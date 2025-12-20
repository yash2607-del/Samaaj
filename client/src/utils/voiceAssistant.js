// Voice Assistant utility for complaint form auto-fill
class VoiceAssistant {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.initRecognition();
  }

  initRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-IN'; // Indian English
  }

  isSupported() {
    return this.recognition !== null;
  }

  startListening(onResult, onError, onStopCommand) {
    if (!this.recognition) {
      onError?.('Speech recognition not supported');
      return;
    }

    if (this.isListening) {
      return;
    }

    this.isListening = true;
    let finalTranscript = '';

    this.recognition.onresult = (event) => {
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
          
          // Check for stop command
          const lowerTranscript = transcript.toLowerCase().trim();
          if (lowerTranscript === 'stop' || lowerTranscript === 'stop recording' || lowerTranscript.endsWith(' stop')) {
            // Remove "stop" from the final transcript
            finalTranscript = finalTranscript.replace(/\s*stop(\s+recording)?\s*$/i, '').trim();
            this.stopListening();
            onStopCommand?.(finalTranscript.trim());
            return;
          }
        } else {
          interimTranscript += transcript;
        }
      }

      onResult?.({
        final: finalTranscript.trim(),
        interim: interimTranscript.trim(),
        isFinal: event.results[event.results.length - 1].isFinal
      });
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      onError?.(event.error);
      this.isListening = false;
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    try {
      this.recognition.start();
    } catch (error) {
      console.error('Failed to start recognition:', error);
      this.isListening = false;
      onError?.(error.message);
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  // Intelligently parse complaint issue details from conversation
  parseIssueDetails(text) {
    const lowerText = text.toLowerCase();
    const data = {};

    // Extract concise title (short and title-like)
    let title = '';
    
    // Pattern 1: Extract after "problem is/issue is/complaint is"
    const titlePatterns = [
      /(?:problem is|issue is|complaint is|complaint about)\s+([^.!?,]{10,60})/i,
      /(?:^|\.\s+)([^.!?,]{10,60})(?:\s+(?:problem|issue|not working|broken|damaged|leaking))/i
    ];

    for (const pattern of titlePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        title = match[1].trim();
        break;
      }
    }

    // If no pattern matched, extract key noun phrases from first sentence
    if (!title) {
      const firstSentence = text.split(/[.!?]/)[0].trim();
      
      // Remove common filler words and extract core issue
      const cleanedTitle = firstSentence
        .replace(/^(the|there is|there are|we have|i have|i am complaining about|this is about)\s+/i, '')
        .replace(/\s+(in our area|in my area|near my house|for days|for weeks|since|from).*$/i, '')
        .trim();
      
      // Take first 50 characters max
      if (cleanedTitle.length > 5 && cleanedTitle.length < 80) {
        title = cleanedTitle.length > 50 
          ? cleanedTitle.substring(0, 50).trim() + '...'
          : cleanedTitle;
      }
    }

    // Capitalize first letter
    if (title) {
      data.title = title.charAt(0).toUpperCase() + title.slice(1);
    }

    // Extract category and department keywords
    const categoryKeywords = {
      'Sanitization': ['sanitization', 'garbage', 'waste', 'trash', 'dustbin', 'sweeping', 'cleaning waste'],
      'Cleanliness': ['cleanliness', 'cleaning', 'dirty', 'mess', 'hygiene'],
      'Electricity': ['electricity', 'power', 'light', 'electric', 'current', 'transformer', 'pole', 'wire'],
      'Road': ['road', 'pothole', 'street', 'pathway', 'pavement', 'footpath'],
      'Water': ['water', 'tap', 'drainage', 'leak', 'pipeline', 'sewer', 'supply'],
      'Public Safety': ['safety', 'danger', 'accident', 'crime', 'security', 'unsafe']
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        data.category = category;
        data.department = category; // Same for department
        break;
      }
    }

    // Full text as description
    data.description = text.trim();

    return data;
  }

  // Parse location details from conversation
  parseLocationDetails(text) {
    const data = {};

    // Extract address line (house number, street, etc.)
    const addressPatterns = [
      /(?:address is|located at|at)\s+(.+?)(?:\.|,|near|landmark|in|$)/i,
      /(\d+[a-zA-Z]?\s+[^,.\n]+(?:road|street|lane|avenue|colony|sector|block))/i
    ];

    for (const pattern of addressPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        data.addressLine = match[1].trim();
        break;
      }
    }

    // Extract landmark
    const landmarkPatterns = [
      /(?:near|landmark is|landmark)\s+(.+?)(?:\.|,|in|district|$)/i,
      /(?:opposite|behind|front of)\s+(.+?)(?:\.|,|in|$)/i
    ];

    for (const pattern of landmarkPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        data.landmark = match[1].trim();
        break;
      }
    }

    // Extract district (Delhi specific)
    const delhiDistricts = [
      'Central Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi',
      'New Delhi', 'North East Delhi', 'North West Delhi', 'Shahdara',
      'South East Delhi', 'South West Delhi'
    ];

    for (const district of delhiDistricts) {
      if (text.toLowerCase().includes(district.toLowerCase())) {
        data.district = district;
        break;
      }
    }

    // Extract city
    const cityPatterns = [
      /(?:city is|in)\s+(new delhi|delhi)/i,
      /(new delhi|delhi)/i
    ];

    for (const pattern of cityPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        data.city = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
        break;
      }
    }

    // Extract state
    if (text.toLowerCase().includes('delhi')) {
      data.state = 'Delhi';
    }

    // Extract pincode
    const pincodeMatch = text.match(/\b\d{6}\b/);
    if (pincodeMatch) {
      data.pincode = pincodeMatch[0];
    }

    return data;
  }
}

export const voiceAssistant = new VoiceAssistant();
export default VoiceAssistant;
