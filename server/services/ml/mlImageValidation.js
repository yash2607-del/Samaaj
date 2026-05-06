import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
const ML_TIMEOUT = 45000;

const categoryContextMap = {
  "Road": "pothole",
  "Sanitization": "garbage",
  "Water": "water"
};

const keywordMap = {
  "pothole": ["pothole", "road broken", "potholes", "cracked road", "bad road"],
  "garbage": ["garbage", "overflowing bin", "trash", "waste", "dump"],
  "water": ["water leakage", "pipe burst", "flood", "waterlogging", "leak"]
};

export const isMeaninglessText = (text) => {
  const t = String(text || '').trim().toLowerCase();
  return t.length < 10 || /(.)\1{5,}/.test(t);
};

export const extractContextLabel = ({ title, description }) => {
  const text = `${String(title || '')} ${String(description || '')}`.toLowerCase();
  for (const [label, keywords] of Object.entries(keywordMap)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      return label;
    }
  }
  return "unknown";
};

export const predictIssueFromImagePath = async ({ imagePath, originalName, title, description, category }) => {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(imagePath), originalName || 'upload.jpg');
  formData.append('title', title || '');
  formData.append('description', description || '');
  formData.append('category', category || '');

  try {
    const response = await axios.post(`${ML_SERVICE_URL}/predict`, formData, {
      headers: formData.getHeaders(),
      timeout: ML_TIMEOUT
    });
    return response.data;
  } catch (error) {
    console.error(`[ML Error] Service down or timeout:`, error.message);
    return null;
  }
};

/**
 * PRODUCTION-READY HYBRID AI SYSTEM
 * Combines ML Service output with strong local context rules.
 */
export const assertComplaintImageContext = async ({ imagePath, originalName, category, title, description }) => {
  const ml = await predictIssueFromImagePath({ imagePath, originalName, title, description, category });
  
  if (!ml) {
    throw new Error("ML service unavailable or failed to respond.");
  }

  const contextLabel = extractContextLabel({ title, description });
  const categoryMatch = contextLabel !== "unknown" && categoryContextMap[category] === contextLabel;

  let { 
    final_label, 
    confidence, 
    decision, 
    reportTag, 
    trustScore, 
    source 
  } = ml;

  // 1. STRONG CONTEXT OVERRIDE (NODE.JS SAFETY LAYER)
  if (categoryMatch) {
    decision = "verified";
    confidence = Math.max(confidence, 0.7);
    final_label = contextLabel;
    source = "strong_context_override";
    reportTag = "clean";
  }

  // 2. REFINED DECISION RULES
  // VERIFIED: confidence > 0.55 OR (context exists AND confidence > 0.3)
  if (decision !== "verified") {
    if (confidence > 0.55 || (contextLabel !== "unknown" && confidence > 0.3)) {
      decision = "verified";
      reportTag = "clean";
    }
  }

  return {
    ok: reportTag !== 'quarantined',
    prediction: final_label,
    confidence,
    decision,
    reportTag,
    trustScore,
    aiExplanation: getAiExplanation({ decision, reportTag, source }),
    modelAgreement: ml.agreement,
    source,
    hf: ml.hf,
    cnn: ml.cnn,
    pretrained: ml.pretrained,
    topPredictions: ml.top_predictions || []
  };
};

function getAiExplanation({ decision, reportTag, source }) {
  if (reportTag === 'quarantined') {
    return "Image flagged as irrelevant or non-civic based on visual behavior.";
  }
  if (source === 'strong_context_override') {
    return "Issue verified based on strong alignment between description and category.";
  }
  if (decision === 'verified') {
    return "AI verified this report using visual and textual evidence.";
  }
  return "Report submitted for manual review. AI analysis is inconclusive.";
}
