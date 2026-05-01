import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

const getNumericEnv = (name, fallback) => {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
const ML_PREDICTION_TIMEOUT_MS = getNumericEnv('ML_PREDICTION_TIMEOUT_MS', 15000);
const ML_MIN_CONFIDENCE = getNumericEnv('ML_MIN_CONFIDENCE', 0.52);
const ML_MIN_CONTEXT_MATCH_CONFIDENCE = getNumericEnv('ML_MIN_CONTEXT_MATCH_CONFIDENCE', 0.46);
const ML_MIN_TOP1_MARGIN = getNumericEnv('ML_MIN_TOP1_MARGIN', 0.11);
const ML_MIN_TOP1_TOP3_GAP = getNumericEnv('ML_MIN_TOP1_TOP3_GAP', 0.2);
const ML_MIN_VARIANT_AGREEMENT = getNumericEnv('ML_MIN_VARIANT_AGREEMENT', 0.5);
const ML_REJECT_AMBIGUOUS_PREDICTIONS = String(process.env.ML_REJECT_AMBIGUOUS_PREDICTIONS || 'true').toLowerCase() !== 'false';
const ML_REQUIRE_SUBCLASS_MATCH_ON_KEYWORD = String(process.env.ML_REQUIRE_SUBCLASS_MATCH_ON_KEYWORD || 'true').toLowerCase() !== 'false';

const issueToCategoryMap = {
  potholes: 'Road',
  road_cracks: 'Road',
  road_blockage: 'Road',
  trash_pile: 'Sanitization',
  overflowing_bin: 'Sanitization',
  construction_waste: 'Sanitization',
  drain_overflow: 'Sanitization',
  waterlogging: 'Water',
  water_leakage: 'Water',
  broken_electric_pole: 'Electricity',
  fallen_pole: 'Electricity',
  exposed_wires: 'Electricity',
  streetlight_issue: 'Electricity'
};

const categoryToIssuesMap = {
  Road: ['potholes', 'road_cracks', 'road_blockage'],
  Sanitization: ['trash_pile', 'overflowing_bin', 'construction_waste', 'drain_overflow'],
  Cleanliness: ['trash_pile', 'overflowing_bin', 'construction_waste', 'drain_overflow'],
  Water: ['waterlogging', 'water_leakage'],
  Electricity: ['broken_electric_pole', 'fallen_pole', 'exposed_wires', 'streetlight_issue']
};

const issueKeywordMap = {
  streetlight_issue: ['streetlight', 'street light', 'light pole', 'lamp post', 'lamp'],
  broken_electric_pole: ['broken pole', 'electric pole broken', 'tilted pole', 'damaged pole'],
  fallen_pole: ['fallen pole', 'pole fallen', 'collapsed pole'],
  exposed_wires: ['exposed wire', 'open wire', 'hanging wire', 'sparking wire', 'live wire'],
  potholes: ['pothole', 'pot hole'],
  road_cracks: ['road crack', 'cracked road', 'crack on road'],
  road_blockage: ['road block', 'road blockage', 'blocked road', 'debris on road'],
  trash_pile: ['trash pile', 'garbage pile', 'waste pile', 'kooda'],
  overflowing_bin: ['overflowing bin', 'full dustbin', 'dustbin overflow', 'garbage bin overflow'],
  construction_waste: ['construction waste', 'building debris', 'cement debris', 'rubble'],
  drain_overflow: ['drain overflow', 'sewer overflow', 'nala overflow', 'choked drain'],
  waterlogging: ['waterlogging', 'water logging', 'stagnant water', 'flooded street'],
  water_leakage: ['water leakage', 'leaking pipe', 'pipe leakage', 'water leak']
};

const normalizeCategory = (value) => {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return '';
  if (raw === 'cleanliness' || raw === 'sanitization') return 'hygiene';
  if (raw === 'public safety') return 'public safety';
  if (raw === 'electricity') return 'electricity';
  if (raw === 'road') return 'road';
  if (raw === 'water') return 'water';
  if (raw === 'other') return 'other';
  return raw;
};

export const getPredictedCategoryFromIssue = (prediction) => {
  return issueToCategoryMap[String(prediction || '').trim()] || 'Other';
};

export const isPredictionMatchingCategory = ({ reportedCategory, predictedIssue }) => {
  const predictedCategory = getPredictedCategoryFromIssue(predictedIssue);
  return normalizeCategory(reportedCategory) === normalizeCategory(predictedCategory);
};

const inferExpectedIssuesFromText = ({ title, description, category }) => {
  const text = `${String(title || '')} ${String(description || '')}`.toLowerCase();
  const expected = new Set();

  for (const [issue, keywords] of Object.entries(issueKeywordMap)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      expected.add(issue);
    }
  }

  if (expected.size > 0) {
    return Array.from(expected);
  }

  const categoryIssues = categoryToIssuesMap[String(category || '').trim()] || [];
  return Array.from(categoryIssues);
};

export const predictIssueFromImagePath = async ({ imagePath, originalName }) => {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(imagePath), originalName || 'upload.jpg');

  const response = await axios.post(`${ML_SERVICE_URL}/predict`, formData, {
    headers: formData.getHeaders(),
    timeout: ML_PREDICTION_TIMEOUT_MS,
    maxBodyLength: Infinity
  });

  const rawPrediction = response?.data?.final_label || response?.data?.prediction;
  const prediction = rawPrediction ? String(rawPrediction).trim() : '';
  const confidence = Number(response?.data?.confidence);
  const decisionRaw = response?.data?.decision;
  const decision = decisionRaw ? String(decisionRaw).trim() : '';
  const modelOutputs = response?.data?.model_outputs && typeof response.data.model_outputs === 'object'
    ? response.data.model_outputs
    : null;
  const variantAgreementRaw = Number(response?.data?.variant_agreement);
  const variantAgreement = Number.isFinite(variantAgreementRaw) ? variantAgreementRaw : 1;
  const topPredictionsRaw = Array.isArray(response?.data?.top_predictions) ? response.data.top_predictions : [];

  if (!prediction || Number.isNaN(confidence)) {
    throw new Error('Invalid prediction response from ML service');
  }

  const topPredictions = topPredictionsRaw
    .map((entry) => ({
      prediction: String(entry?.label || entry?.class || '').trim(),
      confidence: Number(entry?.confidence)
    }))
    .filter((entry) => entry.prediction && Number.isFinite(entry.confidence))
    .sort((a, b) => b.confidence - a.confidence);

  if (topPredictions.length === 0) {
    topPredictions.push({ prediction, confidence });
  }

  const top1 = topPredictions[0]?.confidence ?? confidence;
  const top2 = topPredictions[1]?.confidence ?? 0;
  // If API returns only top-2, treat top-3 as top-2 so "top1Top3Gap" doesn't become artificially huge.
  const top3 = topPredictions[2]?.confidence ?? top2;

  return {
    prediction,
    confidence,
    decision,
    modelOutputs,
    variantAgreement,
    topPredictions,
    top1Top2Margin: top1 - top2,
    top1Top3Gap: top1 - top3
  };
};

export const assessPredictionReliability = ({
  prediction,
  confidence,
  decision,
  variantAgreement,
  topPredictions,
  top1Top2Margin,
  top1Top3Gap
}) => {
  const normalizedDecision = String(decision || '').trim().toLowerCase();

  if (normalizedDecision === 'unclear') {
    return {
      ok: false,
      prediction,
      confidence,
      decision: normalizedDecision,
      variantAgreement,
      topPredictions,
      reason: 'unclear'
    };
  }

  // Hybrid service may explicitly mark predictions as needing review.
  // In that case, do not hard-reject purely on confidence/margin heuristics.
  if (normalizedDecision === 'verified' || normalizedDecision === 'needs_review' || normalizedDecision === 'uncertain') {
    return {
      ok: true,
      prediction,
      confidence,
      decision: normalizedDecision,
      variantAgreement,
      topPredictions,
      top1Top2Margin,
      top1Top3Gap,
      reason: normalizedDecision
    };
  }

  if (variantAgreement < ML_MIN_VARIANT_AGREEMENT) {
    return {
      ok: false,
      prediction,
      confidence,
      decision: normalizedDecision,
      variantAgreement,
      topPredictions,
      reason: 'unstable_prediction'
    };
  }

  if (confidence < ML_MIN_CONFIDENCE) {
    return {
      ok: false,
      prediction,
      confidence,
      decision: normalizedDecision,
      variantAgreement,
      topPredictions,
      reason: 'low_confidence'
    };
  }

  if (
    ML_REJECT_AMBIGUOUS_PREDICTIONS
    && Array.isArray(topPredictions)
    && topPredictions.length > 1
    && (top1Top2Margin < ML_MIN_TOP1_MARGIN || top1Top3Gap < ML_MIN_TOP1_TOP3_GAP)
  ) {
    return {
      ok: false,
      prediction,
      confidence,
      decision: normalizedDecision,
      variantAgreement,
      topPredictions,
      top1Top2Margin,
      top1Top3Gap,
      reason: 'ambiguous_prediction'
    };
  }

  return {
    ok: true,
    prediction,
    confidence,
    decision: normalizedDecision,
    variantAgreement,
    topPredictions,
    reason: 'reliable'
  };
};

export const assertComplaintImageContext = async ({ imagePath, originalName, category, title, description }) => {
  const {
    prediction,
    confidence,
    decision,
    modelOutputs,
    variantAgreement,
    topPredictions,
    top1Top2Margin,
    top1Top3Gap
  } = await predictIssueFromImagePath({ imagePath, originalName });
  const reliability = assessPredictionReliability({
    prediction,
    confidence,
    decision,
    variantAgreement,
    topPredictions,
    top1Top2Margin,
    top1Top3Gap
  });

  const normalizedDecision = String(decision || reliability?.decision || '').trim().toLowerCase();
  const enforceContextChecks = normalizedDecision === 'verified' || confidence >= ML_MIN_CONTEXT_MATCH_CONFIDENCE;
  const matches = enforceContextChecks
    ? isPredictionMatchingCategory({ reportedCategory: category, predictedIssue: prediction })
    : true;
  const expectedIssues = enforceContextChecks
    ? inferExpectedIssuesFromText({ title, description, category })
    : [];
  const subclassMatches = enforceContextChecks
    ? (expectedIssues.length === 0 || expectedIssues.includes(prediction))
    : true;

  const canPassWithContext = (
    reliability.reason === 'low_confidence'
    && confidence >= ML_MIN_CONTEXT_MATCH_CONFIDENCE
    && matches
    && subclassMatches
  );

  if (!reliability.ok && !canPassWithContext) {
    return {
      ...reliability,
      decision: normalizedDecision,
      modelOutputs
    };
  }

  if (ML_REQUIRE_SUBCLASS_MATCH_ON_KEYWORD && !subclassMatches) {
    return {
      ok: false,
      prediction,
      confidence,
      decision: normalizedDecision,
      modelOutputs,
      variantAgreement,
      topPredictions,
      expectedIssues,
      reason: 'issue_mismatch'
    };
  }

  if (!matches) {
    return {
      ok: false,
      prediction,
      confidence,
      decision: normalizedDecision,
      modelOutputs,
      variantAgreement,
      topPredictions,
      reason: 'category_mismatch'
    };
  }

  return {
    ok: true,
    prediction,
    confidence,
    decision: normalizedDecision,
    modelOutputs,
    variantAgreement,
    topPredictions,
    reason: canPassWithContext ? 'matched_with_context_low_confidence' : 'matched'
  };
};
