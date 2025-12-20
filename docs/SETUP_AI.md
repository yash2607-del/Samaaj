# Quick Start: AI & Location Features Setup

## 🚀 5-Minute Setup Guide

### Step 1: Get Google API Keys (3 minutes)

#### A. Gemini API Key (for AI Photo Validation)
1. Go to https://makersuite.google.com/app/apikey
2. Sign in with Google
3. Click "Create API Key"
4. Copy the key

#### B. Google Maps API Key (for Accurate Location Detection)
1. Go to https://console.cloud.google.com/google/maps-apis
2. Create a new project or select existing
3. Enable **Geocoding API**
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy the API key
6. (Optional) Restrict key to Geocoding API only

### Step 2: Add to Environment (1 minute)
```bash
cd client
# Create .env file with both keys
echo "VITE_GEMINI_API_KEY=your_gemini_key_here" > .env
echo "VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key_here" >> .env
```

### Step 3: Restart Server (1 minute)
```bash
npm run dev
```

### Step 4: Test Features (1 minute)

**Test Location Auto-Detect:**
1. Open Create Complaint page
2. Click "Auto-Detect Location" button
3. Allow location permission when browser prompts
4. Watch address fields auto-fill

**Test Voice Assistant:**
1. Click "Voice Fill" button
2. Say: "Broken street light in Connaught Place"
3. Check if fields auto-fill

**Test Photo Validation:**
1. Select category: "Electricity"
2. Add description: "Street light not working"
3. Upload photo of street light
4. Watch AI validation appear

## ✅ Done!

Your AI and location features are now active.

## 🎯 Usage Examples

### Location Detection
- Click "Auto-Detect" → Browser asks permission → Address fills automatically
- **Without API key**: Falls back to OpenStreetMap (less accurate)
- **With Google Maps API**: Highly accurate address with landmarks

### Voice Input Example
```
"There is garbage accumulation near India Gate, New Delhi. 
The dustbins are overflowing for the past week. 
Pincode is 110001."
```
**Result**: Auto-fills category (Sanitization), location, description

### Photo Validation Example
- **Category**: Road
- **Description**: "Pothole causing accidents"  
- **Valid Photo**: Picture of pothole ✅
- **Invalid Photo**: Picture of food ❌

---

## ⚠️ Important Notes

1. **Voice works without API key** (uses browser)
2. **Photo validation needs Gemini API key**
3. **Location works without API key** (uses OpenStreetMap, less accurate)
4. **Google Maps API gives best location accuracy**
5. **Free tier**: Gemini 60 requests/minute, Google Maps $200 credit/month
6. **Privacy**: Location processed, not stored

---

## 🔍 Verify Setup

Check if working:
```javascript
// Open browser console on Create Complaint page
console.log(import.meta.env.VITE_GEMINI_API_KEY ? '✅ Gemini API Key loaded' : '❌ No Gemini key')
console.log(import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? '✅ Google Maps API Key loaded' : '⚠️ Using OpenStreetMap fallback')
```

---

## 📖 Full Documentation
See [AI_FEATURES.md](./AI_FEATURES.md) for complete guide.
