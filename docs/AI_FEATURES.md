# AI Features Documentation

## Overview
The Samaaj complaint management system now includes AI-powered features to enhance user experience:

1. **Voice Assistant** - Auto-fill complaint forms using voice input
2. **AI Photo Validation** - Automatically verify if uploaded photos are relevant to the complaint

---

## 🎤 Voice Assistant

### Features
- **Conversational AI**: Speak naturally and AI fills fields intelligently
- **Context-Aware Parsing**: Understands what you mean (title, category, department, location)
- **Two-Section Voice Input**: 
  - Issue Details (Title, Category, Department, Description)
  - Location Information (Address, Landmark, District, City, Pincode)
- **Real-time Transcription**: See your words as you speak
- **Step-by-Step Auto-Fill**: Each field gets filled automatically from your conversation

### How to Use

#### **Method 1: Voice Fill Issue Details**

1. Click the **"Voice Fill"** button in the Issue Details section
2. Speak your complaint naturally:
   - Start with the problem (becomes Title)
   - Mention category keywords (electricity, water, road, etc.)
   - Describe the issue in detail (becomes Description)

**Example:**
```
User: "The street light is not working. There is no electricity 
in the pole near my house. It's been dark for 5 days and very 
unsafe at night."

AI Auto-fills:
✓ Title: "The street light is not working"
✓ Category: "Electricity"
✓ Department: "Electricity"
✓ Description: [Full text]
```

#### **Method 2: Voice Fill Location**

1. After filling issue details, click **"Voice Fill"** in Location section
2. Speak your address with details:
   - Street address/house number
   - Landmark
   - Area/District
   - City and pincode

**Example:**
```
User: "Address is 25 Rajpur Road near Connaught Place. 
Landmark is opposite Metro Station. South Delhi district. 
New Delhi city. Pincode 110001."

AI Auto-fills:
✓ Address Line: "25 Rajpur Road"
✓ Landmark: "opposite Metro Station"
✓ District: "South Delhi"
✓ City: "New Delhi"
✓ Pincode: "110001"
```

### Supported Browsers
- ✅ Google Chrome
- ✅ Microsoft Edge  
- ✅ Safari
- ❌ Firefox (limited support)

### Tips for Best Results

**For Issue Details:**
- Start with what the problem is (title)
- Mention the category (water, electricity, road, cleanliness, etc.)
- Add detailed description
- Speak in sentences, not keywords

**For Location:**
- Say "address is [your address]"
- Say "landmark is [landmark]" or "near [landmark]"
- Mention district explicitly
- Speak pincode clearly with 6 digits

### Smart Category Detection

The AI automatically detects category from keywords:

| **Category** | **Keywords** |
|--------------|--------------|
| Sanitization | garbage, waste, trash, dustbin, sweeping |
| Cleanliness | cleaning, dirty, mess, hygiene |
| Electricity | electricity, power, light, electric, current, transformer, pole, wire |
| Road | road, pothole, street, pathway, pavement, footpath |
| Water | water, tap, drainage, leak, pipeline, sewer, supply |
| Public Safety | safety, danger, accident, crime, security, unsafe |

---

## 📸 AI Photo Validation

### Features
- **Relevance Check**: Verifies photo matches the complaint description
- **Quality Detection**: Checks if image is too dark/bright
- **Spam Prevention**: Detects inappropriate or irrelevant images
- **Confidence Score**: Shows how sure the AI is about validation

### How It Works

1. **Upload a Photo**
   - Select category and add description first
   - Upload your photo
   - AI will automatically analyze it

2. **Understanding Results**
   - ✅ **Green Badge**: Photo is relevant and clear
   - ⚠️ **Orange Badge**: Photo may not be relevant (low confidence)
   - ❌ **Red Error**: Photo is definitely not relevant or inappropriate

3. **What Gets Checked**
   - Photo shows evidence of the reported issue
   - Photo is clear and shows relevant details
   - Photo is not offensive or spam
   - Image brightness and quality

### Example Scenarios

**✅ Valid Photos:**
- Broken road → Photo of pothole
- Water leakage → Photo of leaking pipe
- Garbage pile → Photo of waste accumulation

**❌ Invalid Photos:**
- Electricity issue → Photo of food/selfie
- Road problem → Photo of unrelated building
- Blurry/too dark photos

---

## ⚙️ Setup Instructions

### 1. Get Google Gemini API Key (Free)

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key

### 2. Configure Environment Variables

Create a `.env` file in the `client` folder:

```bash
# Copy .env.example to .env
cp client/.env.example client/.env
```

Edit `client/.env` and add your API key:

```env
VITE_GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 3. Restart Development Server

```bash
cd client
npm run dev
```

---

## 🔧 Technical Details

### Voice Assistant
- **Technology**: Web Speech API (Browser-native)
- **Language**: English (Indian - en-IN)
- **Processing**: Real-time, client-side
- **No API Key Required**

### Photo Validation
- **AI Model**: Google Gemini 1.5 Flash
- **API**: Gemini Vision API
- **Processing Time**: 2-5 seconds
- **Free Tier**: 60 requests/minute

### Privacy & Security
- Voice input is processed locally in your browser
- Photos are sent to Google's Gemini API for analysis
- No data is stored by Google after processing
- All complaint data remains on your server

---

## 🐛 Troubleshooting

### Voice Input Not Working

**Issue**: "Voice input is not supported"  
**Solution**: Use Chrome, Edge, or Safari browser

**Issue**: Microphone access denied  
**Solution**: 
1. Click the lock icon in address bar
2. Allow microphone permissions
3. Reload the page

**Issue**: Voice not detected  
**Solution**:
- Check microphone hardware
- Test mic in system settings
- Speak louder and closer to mic

### Photo Validation Issues

**Issue**: "Photo validation is disabled"  
**Solution**: Add `VITE_GEMINI_API_KEY` to `.env` file

**Issue**: "Validation error: 429"  
**Solution**: You've exceeded the free tier limit (60/min). Wait a minute.

**Issue**: Validation takes too long  
**Solution**: 
- Check internet connection
- Try smaller image size (< 2MB)
- Refresh and try again

### General Issues

**Issue**: Features not showing  
**Solution**:
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R)
3. Restart dev server

---

## 📊 API Usage Limits

### Google Gemini (Free Tier)
- **Requests**: 60 per minute
- **Daily Quota**: 1,500 per day
- **Image Size**: Up to 4MB
- **Cost**: FREE

### Upgrading
If you need more quota:
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Enable billing (pay-as-you-go)
3. Gemini Flash is very affordable (~$0.00025 per image)

---

## 🚀 Future Enhancements

Planned features:
- [ ] Multi-language voice support (Hindi, Bengali, etc.)
- [ ] Voice commands for navigation
- [ ] Auto-suggest category from photo
- [ ] Complaint summary generation
- [ ] Voice-based complaint tracking

---

## 💡 Best Practices

1. **For Citizens**:
   - Use voice input for faster complaint filing
   - Upload clear, well-lit photos
   - Review AI suggestions before submitting

2. **For Moderators**:
   - Check photo validation confidence scores
   - Manually verify low-confidence submissions
   - Report false positives/negatives for improvement

---

## 📞 Support

If you encounter issues:
1. Check this documentation
2. Review browser console for errors
3. Contact system administrator
4. Report bugs via GitHub issues

---

## 🙏 Credits

- **Voice Recognition**: Web Speech API (W3C Standard)
- **AI Vision**: Google Gemini 1.5 Flash
- **Integration**: Samaaj Development Team

---

**Last Updated**: December 17, 2025  
**Version**: 1.0.0
