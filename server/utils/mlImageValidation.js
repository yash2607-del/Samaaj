import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
const ML_PREDICTION_TIMEOUT_MS = Number(process.env.ML_PREDICTION_TIMEOUT_MS || 15000);
const ML_MIN_CONFIDENCE = Number(process.env.ML_MIN_CONFIDENCE || 0.45);
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

  const prediction = response?.data?.prediction;
  const confidence = Number(response?.data?.confidence);

  if (!prediction || Number.isNaN(confidence)) {
    throw new Error('Invalid prediction response from ML service');
  }

  return { prediction, confidence };
};

export const assertComplaintImageContext = async ({ imagePath, originalName, category, title, description }) => {
  const { prediction, confidence } = await predictIssueFromImagePath({ imagePath, originalName });
  const matches = isPredictionMatchingCategory({ reportedCategory: category, predictedIssue: prediction });
  const expectedIssues = inferExpectedIssuesFromText({ title, description, category });
  const subclassMatches = expectedIssues.length === 0 || expectedIssues.includes(prediction);

  if (confidence < ML_MIN_CONFIDENCE) {
    return {
      ok: false,
      prediction,
      confidence,
      reason: 'low_confidence'
    };
  }

  if (ML_REQUIRE_SUBCLASS_MATCH_ON_KEYWORD && !subclassMatches) {
    return {
      ok: false,
      prediction,
      confidence,
      expectedIssues,
      reason: 'issue_mismatch'
    };
  }

  if (!matches) {
    return {
      ok: false,
      prediction,
      confidence,
      reason: 'category_mismatch'
    };
  }

  return {
    ok: true,
    prediction,
    confidence,
    reason: 'matched'
  };
};
