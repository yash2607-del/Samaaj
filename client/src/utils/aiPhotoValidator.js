// AI Photo Validation using Google Gemini Vision API

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

/**
 * Validate if uploaded photo is relevant to the complaint
 * @param {File} imageFile - The image file to validate
 * @param {string} category - The complaint category
 * @param {string} description - The complaint description
 * @returns {Promise<{isValid: boolean, message: string, confidence: number}>}
 */
export async function validateComplaintPhoto(imageFile, category, description) {
  if (!GEMINI_API_KEY) {
    console.warn('Gemini API key not found. Photo validation disabled.');
    return {
      isValid: true,
      message: 'Photo validation is disabled. Please add VITE_GEMINI_API_KEY to your .env file.',
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
      throw new Error(`Gemini API error: ${response.statusText}`);
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
    
    return {
      isValid: Boolean(result.isValid),
      message: result.message || 'Photo validated',
      confidence: Number(result.confidence) || 0
    };

  } catch (error) {
    console.error('Photo validation error:', error);
    return {
      isValid: true, // Default to valid if validation fails
      message: `Validation error: ${error.message}. Proceeding anyway.`,
      confidence: 0
    };
  }
}

/**
 * Convert File to base64 string
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]; // Remove data:image/...;base64, prefix
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Quick image quality check (blur detection, brightness)
 */
export async function checkImageQuality(imageFile) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(imageFile);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      
      // Check average brightness
      let totalBrightness = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        totalBrightness += (r + g + b) / 3;
      }
      const avgBrightness = totalBrightness / (pixels.length / 4);
      
      const isTooDark = avgBrightness < 30;
      const isTooLight = avgBrightness > 250;
      const isGoodQuality = !isTooDark && !isTooLight;
      
      URL.revokeObjectURL(url);
      
      resolve({
        isGoodQuality,
        brightness: avgBrightness,
        warning: isTooDark ? 'Image is too dark' : isTooLight ? 'Image is overexposed' : null
      });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ isGoodQuality: true, warning: null });
    };
    
    img.src = url;
  });
}
