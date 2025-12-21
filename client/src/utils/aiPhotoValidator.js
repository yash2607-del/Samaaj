// AI Photo Validation using Google Gemini Vision API

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
const GOOGLE_VISION_KEY = import.meta.env.VITE_GOOGLE_VISION_KEY || '';
const GOOGLE_VISION_URL = (key) => `https://vision.googleapis.com/v1/images:annotate?key=${key}`;
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const USE_GEMINI_FALLBACK = String(import.meta.env.VITE_USE_GEMINI_FALLBACK || '').toLowerCase() === 'true';

/**
 * Validate if uploaded photo is relevant to the complaint
 * @param {File} imageFile - The image file to validate
 * @param {string} category - The complaint category
 * @param {string} description - The complaint description
 * @returns {Promise<{isValid: boolean, message: string, confidence: number}>}
 */
export async function validateComplaintPhoto(imageFile, category, description) {
  // Prefer server-side Vision proxy if available (fast label detection + safe search)
  try {
    const base64Image = await fileToBase64(imageFile);
    const resp = await fetch(`${API_BASE}/api/vision/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64Image })
    });

    if (!resp.ok) {
      const txt = await resp.text().catch(() => '');
      throw new Error(`Vision proxy error: ${resp.status} ${resp.statusText} ${txt}`);
    }

    const j = await resp.json();
    // server returns { labels: [{description,score}], safe: { ... } }
    const res = j || {};

    // Safe search checks
    const safe = res.safe || res.safeSearchAnnotation || {};
    const dangerFlags = ['LIKELY', 'VERY_LIKELY', 'POSSIBLE'];
    if (dangerFlags.includes((safe.adult || '').toUpperCase()) || dangerFlags.includes((safe.violence || '').toUpperCase()) || dangerFlags.includes((safe.racy || '').toUpperCase())) {
      return { isValid: false, message: 'Image flagged as inappropriate', confidence: 100 };
    }

    const labels = res.labels || res.labelAnnotations || [];
    const labelTexts = labels.map(l => ({ desc: l.description, score: l.score }));

    // Category keyword mapping
    const categoryKeywords = {
      'Sanitization': ['sanitization','garbage','waste','trash','dustbin','sweeping','garbage dump'],
      'Cleanliness': ['cleanliness','dirty','litter','filth','cleaning'],
      'Electricity': ['electricity','power','transformer','pole','wire','electrical'],
      'Road': ['pothole','road','street','asphalt','pavement','roadwork'],
      'Water': ['water','leak','drain','sewer','pipeline','flood'],
      'Public Safety': ['danger','accident','fire','crime','hazard','unsafe'],
      'Public Works': ['public works','infrastructure','construction']
    };

    const keywords = (categoryKeywords[category] || []).map(k => k.toLowerCase());
    let bestScore = 0;
    let matchedLabels = [];

    for (const l of labelTexts) {
      const desc = (l.desc || '').toLowerCase();
      for (const kw of keywords) {
        if (desc.includes(kw) || kw.includes(desc)) {
          const score = (l.score || 0) * 100;
          if (score > bestScore) bestScore = score;
          matchedLabels.push({ label: l.desc, score });
        }
      }
    }

    if (bestScore >= 60) {
      return { isValid: true, message: `Matched labels: ${matchedLabels.map(m=>m.label).join(', ')}`, confidence: Math.round(bestScore) };
    }

    // If no strong label match, but top label seems related (fallback to description keywords)
    const topLabel = labels[0];
    if (topLabel) {
      const topScore = Math.round((topLabel.score || 0) * 100);
      return { isValid: false, message: `Top label: ${topLabel.description}`, confidence: topScore };
    }

    return { isValid: true, message: 'No strong label matches found; proceed with caution', confidence: 0 };
  } catch (err) {
    console.error('Google Vision error:', err);
    // Fall back to Gemini below
  }

  // If Google Vision not configured or failed, optionally fall back to Gemini-based validation
  if (!GEMINI_API_KEY || !USE_GEMINI_FALLBACK) {
    console.warn('Gemini fallback disabled or API key not found. Photo validation skipped.');
    return {
      isValid: true,
      message: 'Photo validation skipped. Configure server Vision proxy or enable Gemini fallback with VITE_USE_GEMINI_FALLBACK=true and set VITE_GEMINI_API_KEY.',
      confidence: 0
    };
  }

  try {
    // Convert image to base64
    const base64Image = await fileToBase64(imageFile);
    
    // Create prompt for Gemini
    const prompt = `You are an AI assistant helping validate civic complaint photos. 
    
Complaint Category: ${category}
Complaint Description: ${description}

Analyze the uploaded photo and determine if it's relevant to the complaint. Check if:
1. The photo shows evidence of the reported issue (${category})
2. The photo is clear and shows relevant details
3. The photo is not offensive, inappropriate, or spam

Respond ONLY in this JSON format:
{
  "isValid": true/false,
  "message": "Brief explanation (max 100 characters)",
  "confidence": 0-100 (percentage)
}`;

    const requestBody = {
      contents: [{
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: imageFile.type,
              data: base64Image
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 200,
      }
    };

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const txt = await response.text().catch(() => '');
      throw new Error(`Gemini API error: ${response.status} ${response.statusText} ${txt}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      throw new Error('Invalid response from Gemini API');
    }

    // Parse JSON response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response');
    }

    const result = JSON.parse(jsonMatch[0]);
    return result;
  } catch (error) {
    console.error('Gemini Vision error:', error);
    return {
      isValid: true,
      message: 'Photo validation failed, but upload allowed. Error: ' + (error.message || ''),
      confidence: 0
    };
  }
}

/**
 * Utility: Convert File to base64 string
 * @param {File} file
 * @returns {Promise<string>}
 */
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result.split(',')[1];
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Utility: Check image quality (stub)
 * @param {File} imageFile
 * @returns {Promise<{isGoodQuality: boolean, brightness: number, warning: string|null}>}
 */
export async function checkImageQuality(imageFile) {
  // Stub: always returns good quality
  return { isGoodQuality: true, brightness: 128, warning: null };
}
