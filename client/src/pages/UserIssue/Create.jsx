import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api.js";
import CitizenSidebar from "../../components/CitizenSidebar";
import { FiMapPin, FiUpload, FiAlertCircle, FiCheckCircle, FiSend, FiArrowLeft, FiMic, FiMicOff, FiEye } from 'react-icons/fi';
import { voiceAssistant } from "../../utils/voiceAssistant";
import { validateComplaintPhoto, checkImageQuality } from "../../utils/aiPhotoValidator";

const Create = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("New Delhi");
  const [district, setDistrict] = useState("");
  const [stateName, setStateName] = useState("Delhi");
  const [pincode, setPincode] = useState("");
  const [autoDetectLoading, setAutoDetectLoading] = useState(false);
  const [department, setDepartment] = useState("");
  const [departments, setDepartments] = useState([]);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoError, setPhotoError] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // AI Features State
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [activeSection, setActiveSection] = useState(null); // 'issue' or 'location'
  const [currentStep, setCurrentStep] = useState(0); // Track which field we're filling
  const [photoValidating, setPhotoValidating] = useState(false);
  const [photoValidation, setPhotoValidation] = useState(null);

  // Voice flow steps for issue section
  const issueSteps = [
    { field: 'title', prompt: 'Say: Problem title is [your title]', instruction: 'State the problem briefly' },
    { field: 'category', prompt: 'Say: Category is [sanitization/electricity/water/road/cleanliness/public safety]', instruction: 'Choose the category' },
    { field: 'description', prompt: 'Say: Problem description is [detailed description]', instruction: 'Describe in detail' }
  ];

  // Voice flow steps for location section
  const locationSteps = [
    { field: 'addressLine', prompt: 'Say: Address is [house number, street name]', instruction: 'Your street address' },
    { field: 'landmark', prompt: 'Say: Landmark is [landmark name]', instruction: 'Nearby landmark' },
    { field: 'district', prompt: 'Say: District is [district name]', instruction: 'Delhi district' },
    { field: 'pincode', prompt: 'Say: Pincode is [6 digits]', instruction: 'Area pincode' }
  ];

  // Fetch departments when component mounts
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await API.get("/api/complaints/departments");
        // Remove duplicates by name
        const uniqueDepts = response.data.reduce((acc, dept) => {
          if (!acc.find(d => d.name.toLowerCase() === dept.name.toLowerCase())) {
            acc.push(dept);
          }
          return acc;
        }, []);
        setDepartments(uniqueDepts);
      } catch (error) {
        console.error("Error fetching departments:", error);
        setErrorMsg("Failed to load departments. Please try again.");
      }
    };
    fetchDepartments();
  }, []);

  // Filter departments based on selected category
  const getFilteredDepartments = () => {
    if (!category) return [];
    
    // Filter departments that match the selected category
    return departments.filter(dept => 
      dept.category && dept.category.toLowerCase() === category.toLowerCase()
    );
  };

  // Auto-select department when category changes and only one relevant department exists
  useEffect(() => {
    if (category && departments.length > 0) {
      const filtered = getFilteredDepartments();
      if (filtered.length === 1) {
        setDepartment(filtered[0]._id);
      }
    }
  }, [category, departments]);

  // Auto detect location and get address using Google Maps Geocoding API
  const handleAutoDetect = () => {
    // Check if geolocation is available
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser. Please enter location manually.");
      return;
    }

    // Check if page is secure (HTTPS or localhost)
    const isSecureContext = window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (!isSecureContext) {
      setErrorMsg("Location access requires HTTPS or localhost. Please use HTTPS or enter location manually.");
      return;
    }

    // Request permission and show loading
    setAutoDetectLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    // Check permission state first
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' })
        .then((permissionStatus) => {
          if (permissionStatus.state === 'denied') {
            setAutoDetectLoading(false);
            setErrorMsg("Location access is blocked. Please enable location permissions in your browser settings:\n1. Click the lock icon in address bar\n2. Allow location access\n3. Refresh the page");
            return;
          }
          // Proceed with geolocation
          requestGeolocation();
        })
        .catch(() => {
          // Fallback if permissions API not available
          requestGeolocation();
        });
    } else {
      // Fallback if permissions API not available
      requestGeolocation();
    }
  };

  const requestGeolocation = () => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Use Google Maps Geocoding API for accurate location
        const googleApiKey = import.meta?.env?.VITE_GOOGLE_MAPS_API_KEY || "";

        try {
          let addressData = null;

          if (googleApiKey) {
            // Google Maps Geocoding API - Most accurate
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${googleApiKey}&language=en`
            );
            const data = await response.json();

            if (data.status === 'OK' && data.results && data.results.length > 0) {
              const result = data.results[0];
              const components = result.address_components;
              
              // Extract address components
              let street = '';
              let locality = '';
              let district = '';
              let state = '';
              let pincode = '';
              let landmark = '';

              components.forEach(component => {
                const types = component.types;
                if (types.includes('street_number') || types.includes('premise')) {
                  street = component.long_name + ' ' + street;
                } else if (types.includes('route')) {
                  street += component.long_name;
                } else if (types.includes('sublocality_level_1') || types.includes('sublocality')) {
                  locality = component.long_name;
                } else if (types.includes('locality')) {
                  if (!locality) locality = component.long_name;
                } else if (types.includes('administrative_area_level_3')) {
                  district = component.long_name;
                } else if (types.includes('administrative_area_level_1')) {
                  state = component.long_name;
                } else if (types.includes('postal_code')) {
                  pincode = component.long_name;
                } else if (types.includes('point_of_interest') || types.includes('establishment')) {
                  landmark = component.long_name;
                }
              });

              addressData = {
                formatted: result.formatted_address,
                street: street.trim() || result.formatted_address.split(',')[0],
                locality: locality || 'New Delhi',
                district: district || '',
                state: state || 'Delhi',
                pincode: pincode || '',
                landmark: landmark || ''
              };
            }
          }

          // Fallback to OpenStreetMap Nominatim if Google API not available
          if (!addressData) {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
              {
                headers: {
                  'User-Agent': 'Samaaj-Complaint-App'
                }
              }
            );
            const data = await response.json();

            if (data && data.address) {
              const addr = data.address;
              addressData = {
                formatted: data.display_name,
                street: addr.road || addr.street || addr.house_number || '',
                locality: addr.suburb || addr.neighbourhood || addr.city || addr.town || 'New Delhi',
                district: addr.county || addr.city_district || addr.state_district || '',
                state: addr.state || 'Delhi',
                pincode: addr.postcode || '',
                landmark: addr.amenity || addr.shop || ''
              };
            }
          }

          if (addressData) {
            setAddressLine(addressData.street);
            setCity(addressData.locality);
            setDistrict(addressData.district);
            setStateName(addressData.state);
            setPincode(addressData.pincode);
            if (addressData.landmark) setLandmark(addressData.landmark);
            setLocation(addressData.formatted);
            setSuccessMsg("Location detected successfully!");
          } else {
            setErrorMsg("Unable to determine address from your location. Please enter manually.");
          }
        } catch (error) {
          console.error("Geocoding error:", error);
          setErrorMsg("Failed to fetch address. Please check your internet connection and try again.");
        } finally {
          setAutoDetectLoading(false);
        }
      },
      (error) => {
        setAutoDetectLoading(false);
        console.error("Geolocation error:", error);
        
        // Handle different error types with detailed messages
        switch (error.code) {
          case 1: // PERMISSION_DENIED
            setErrorMsg("Location access denied. To enable:\n• Click the location/lock icon in your browser's address bar\n• Select 'Allow' for location\n• Refresh the page and try again");
            break;
          case 2: // POSITION_UNAVAILABLE
            setErrorMsg("Location information unavailable. Please:\n• Check if location services are enabled on your device\n• Ensure you have GPS/WiFi enabled\n• Try again in a few seconds");
            break;
          case 3: // TIMEOUT
            setErrorMsg("Location request timed out. This might be due to:\n• Weak GPS signal\n• Slow internet connection\n• Please try again");
            break;
          default:
            setErrorMsg("Unable to retrieve your location. Please enter location manually or try again.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 20000, // Increased timeout
        maximumAge: 0
      }
    );
  };

  // Handle photo selection & basic verification
  const handlePhotoChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setPhotoError("Only image files are allowed.");
        setPhoto(null);
        setPhotoPreview(null);
      } else if (file.size > 5 * 1024 * 1024) {
        setPhotoError("File size must be less than 5MB.");
        setPhoto(null);
        setPhotoPreview(null);
      } else {
        setPhoto(file);
        setPhotoError("");
        setPhotoPreview(URL.createObjectURL(file));

        // AI: Check image quality
        const qualityCheck = await checkImageQuality(file);
        if (qualityCheck.warning) {
          setPhotoError(`Warning: ${qualityCheck.warning}. You can still proceed.`);
        }

        // AI: Validate photo relevance (only if category and description exist)
        if (category && description) {
          setPhotoValidating(true);
          setPhotoValidation(null);
          
          try {
            const validation = await validateComplaintPhoto(file, category, description);
            setPhotoValidation(validation);
            
            if (!validation.isValid && validation.confidence > 60) {
              setPhotoError(validation.message);
            }
          } catch (error) {
            console.error('Photo validation failed:', error);
          } finally {
            setPhotoValidating(false);
          }
        }
      }
    } else {
      setPhoto(null);
      setPhotoPreview(null);
      setPhotoError("");
      setPhotoValidation(null);
    }
  };

  // Voice Assistant Functions
  const startVoiceInput = (section) => {
    if (!voiceAssistant.isSupported()) {
      alert('Voice input is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    setActiveSection(section);
    setCurrentStep(0);
    setIsVoiceListening(true);
    setVoiceTranscript("");
    startListeningForCurrentStep(section, 0);
  };

  const startListeningForCurrentStep = (section, step) => {
    const steps = section === 'issue' ? issueSteps : locationSteps;
    
    if (step >= steps.length) {
      // All steps completed
      setIsVoiceListening(false);
      setActiveSection(null);
      setCurrentStep(0);
      return;
    }

    const currentField = steps[step].field;
    
    voiceAssistant.startListening(
      (result) => {
        setVoiceTranscript(result.final || result.interim);
      },
      (error) => {
        console.error('Voice error:', error);
        setIsVoiceListening(false);
        setActiveSection(null);
        setCurrentStep(0);
        alert(`Voice input error: ${error}`);
      },
      (finalText) => {
        // Stop command or completion
        if (finalText && finalText.trim()) {
          processFieldInput(section, currentField, finalText);
        }
        
        // Move to next step
        const nextStep = step + 1;
        setCurrentStep(nextStep);
        setVoiceTranscript("");
        
        if (nextStep < steps.length) {
          // Continue to next field
          setTimeout(() => {
            startListeningForCurrentStep(section, nextStep);
          }, 500);
        } else {
          // All done
          setIsVoiceListening(false);
          setActiveSection(null);
          setCurrentStep(0);
        }
      }
    );
  };

  const processFieldInput = (section, field, text) => {
    // Extract the value after common patterns
    let value = text.trim();
    
    // Remove field name prefixes like "problem title is", "category is", etc.
    value = value
      .replace(/^(problem\s+)?title\s+is\s+/i, '')
      .replace(/^category\s+is\s+/i, '')
      .replace(/^department\s+is\s+/i, '')
      .replace(/^(problem\s+)?description\s+is\s+/i, '')
      .replace(/^address\s+(line\s+)?is\s+/i, '')
      .replace(/^landmark\s+is\s+/i, '')
      .replace(/^district\s+is\s+/i, '')
      .replace(/^city\s+is\s+/i, '')
      .replace(/^pincode\s+is\s+/i, '')
      .trim();

    // Convert spoken numbers to digits
    const convertSpokenNumbers = (str) => {
      const numberMap = {
        'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
        'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
        'ten': '10', 'eleven': '11', 'twelve': '12', 'thirteen': '13', 'fourteen': '14',
        'fifteen': '15', 'sixteen': '16', 'seventeen': '17', 'eighteen': '18', 'nineteen': '19',
        'twenty': '20', 'thirty': '30', 'forty': '40', 'fifty': '50',
        'sixty': '60', 'seventy': '70', 'eighty': '80', 'ninety': '90',
        'hundred': '100', 'thousand': '1000'
      };

      let result = str;
      
      // Handle compound numbers like "fifty five" -> "55"
      result = result.replace(/\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)\s+(one|two|three|four|five|six|seven|eight|nine)\b/gi, (match, tens, ones) => {
        return String(parseInt(numberMap[tens.toLowerCase()]) + parseInt(numberMap[ones.toLowerCase()]));
      });

      // Replace individual number words
      Object.keys(numberMap).forEach(word => {
        const regex = new RegExp('\\b' + word + '\\b', 'gi');
        result = result.replace(regex, numberMap[word]);
      });

      return result;
    };

    // Convert spoken symbols to actual symbols (for addresses)
    const convertSpokenSymbols = (str) => {
      return str
        .replace(/\s+dash\s+/gi, '-')
        .replace(/\s+slash\s+/gi, '/')
        .replace(/\s+hyphen\s+/gi, '-')
        .replace(/\s+comma\s+/gi, ', ')
        .replace(/\s+dot\s+/gi, '.')
        .replace(/\s+hash\s+/gi, '#')
        .replace(/\s+number\s+/gi, '#')
        .replace(/\s+at\s+/gi, '@')
        .replace(/\s+and\s+/gi, ' & ')
        .replace(/\s+plus\s+/gi, '+');
    };

    if (section === 'issue') {
      switch (field) {
        case 'title':
          // Clean up and limit title length
          const cleanTitle = value.charAt(0).toUpperCase() + value.slice(1);
          setTitle(cleanTitle.length > 50 ? cleanTitle.substring(0, 50) + '...' : cleanTitle);
          break;
        
        case 'category':
          // Match category from spoken text
          const categoryMap = {
            'sanitization': 'Sanitization',
            'cleanliness': 'Cleanliness',
            'electricity': 'Electricity',
            'electric': 'Electricity',
            'power': 'Electricity',
            'road': 'Road',
            'water': 'Water',
            'public safety': 'Public Safety',
            'safety': 'Public Safety'
          };
          
          const lowerValue = value.toLowerCase();
          for (const [key, cat] of Object.entries(categoryMap)) {
            if (lowerValue.includes(key)) {
              setCategory(cat);
              break;
            }
          }
          break;
        
        case 'description':
          setDescription(value);
          break;
      }
    } else if (section === 'location') {
      switch (field) {
        case 'addressLine':
          // Convert spoken numbers and symbols to actual format
          let formattedAddress = convertSpokenNumbers(value);
          formattedAddress = convertSpokenSymbols(formattedAddress);
          setAddressLine(formattedAddress);
          break;
        
        case 'landmark':
          setLandmark(value);
          break;
        
        case 'district':
          // Match Delhi districts
          const districts = [
            'Central Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi',
            'New Delhi', 'North East Delhi', 'North West Delhi', 'Shahdara',
            'South East Delhi', 'South West Delhi'
          ];
          
          const matchedDistrict = districts.find(d => 
            value.toLowerCase().includes(d.toLowerCase())
          );
          if (matchedDistrict) {
            setDistrict(matchedDistrict);
          } else {
            setDistrict(value);
          }
          setCity('New Delhi');
          setStateName('Delhi');
          break;
        
        case 'pincode':
          // Convert spoken numbers to digits
          const convertedPincode = convertSpokenNumbers(value);
          // Extract 6-digit pincode
          const pincodeMatch = convertedPincode.match(/\d{6}/);
          if (pincodeMatch) {
            setPincode(pincodeMatch[0]);
          }
          break;
      }
    }
  };

  const stopVoiceInput = () => {
    voiceAssistant.stopListening();
    
    // Process current transcript before stopping
    if (voiceTranscript && voiceTranscript.trim()) {
      const steps = activeSection === 'issue' ? issueSteps : locationSteps;
      const currentField = steps[currentStep]?.field;
      
      if (currentField) {
        processFieldInput(activeSection, currentField, voiceTranscript);
      }
      
      // Move to next step
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setVoiceTranscript("");
      
      if (nextStep < steps.length) {
        // Continue to next field
        setTimeout(() => {
          startListeningForCurrentStep(activeSection, nextStep);
        }, 500);
      } else {
        // All done
        setIsVoiceListening(false);
        setActiveSection(null);
        setCurrentStep(0);
      }
    } else {
      // No transcript, just stop
      setIsVoiceListening(false);
      setActiveSection(null);
      setCurrentStep(0);
      setVoiceTranscript("");
    }
  };

  // Handle form submission -> send multipart/form-data to server
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!title.trim() || !category || !description.trim() || (!location.trim() && !addressLine.trim())) {
      setErrorMsg("Please fill all required fields (provide location or address line).");
      return;
    }

    if (!photo) {
      setPhotoError("Photo is required before submitting.");
      return;
    }

    // Auto-select department if not selected
    let selectedDept = department;
    if (!selectedDept && category && departments.length > 0) {
      const filtered = getFilteredDepartments();
      if (filtered.length > 0) {
        selectedDept = filtered[0]._id;
        setDepartment(selectedDept);
      }
    }

    if (!selectedDept) {
      setErrorMsg("Unable to assign department. Please select a category.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("category", category);
    formData.append("description", description.trim());
    formData.append("location", location.trim() || addressLine.trim());
    formData.append("addressLine", addressLine.trim());
    formData.append("landmark", landmark.trim());
    formData.append("city", city.trim());
    formData.append("district", district.trim());
    formData.append("state", stateName.trim());
    formData.append("pincode", pincode.trim());
    formData.append("department", selectedDept);
    formData.append("photo", photo);

    try {
      setSubmitting(true);
      const storedUser = localStorage.getItem("user");
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      if (parsedUser?.id) formData.append("userId", parsedUser.id);

      const res = await API.post("/api/complaints", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setSuccessMsg("Complaint submitted successfully.");
      // reset form
      setTitle("");
      setCategory("");
      setDescription("");
      setLocation("");
      setAddressLine("");
      setLandmark("");
      setCity("New Delhi");
      setDistrict("");
      setStateName("Delhi");
      setPincode("");
      setPhoto(null);
      setPhotoPreview(null);
      setPhotoError("");
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || "Submission failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className="d-flex" style={{ minHeight: "100vh", backgroundColor: "#f5f7fa" }}>
      <CitizenSidebar />
      <div className="flex-grow-1" style={{ overflow: "auto", backgroundColor: "#f5f7fa" }}>
        {/* Header */}
        <section
          className="py-3 px-4 bg-white border-bottom"
          style={{ position: "sticky", top: 0, zIndex: 100 }}
        >
          <div className="d-flex align-items-center">
            <button
              className="btn btn-sm me-3"
              onClick={() => navigate("/dashboard")}
              style={{ backgroundColor: "white", border: "none" }}
            >
              <FiArrowLeft style={{ fontSize: "1.2rem", color: "#1a1a1a" }} />
            </button>
            <div>
              <h4 className="mb-1 fw-bold" style={{ color: "#1a1a1a" }}>Submit Complaint</h4>
              <p className="mb-0 small" style={{ color: "#424242" }}>
                Report an issue in your area
              </p>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-4 px-4">
          <div className="container">
            {errorMsg && (
          <div className="alert d-flex align-items-center shadow-sm mb-4" style={{ backgroundColor: "#FFEBEE", color: "#C62828", border: "none", borderLeft: "4px solid #D32F2F", borderRadius: "8px", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
            <FiAlertCircle className="me-2" style={{ fontSize: "1.3rem", flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="alert d-flex align-items-center shadow-sm mb-4" style={{ backgroundColor: "#E8F5E9", color: "#2E7D32", border: "none", borderLeft: "4px solid #4CAF50", borderRadius: "8px", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
            <FiCheckCircle className="me-2" style={{ fontSize: "1.3rem", flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Main Form Card */}
        <div className="card border-0 shadow-lg" style={{ borderRadius: "16px", overflow: "hidden" }}>
          {/* Card Header */}
          <div className="card-header border-0 py-4" style={{ background: "linear-gradient(135deg, #FFB347 0%, #FFD8A8 100%)" }}>
            <h4 className="fw-bold mb-0" style={{ color: "white", fontSize: "1.4rem", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
              Complaint Information
            </h4>
            {isVoiceListening && (
              <div className="mt-2 p-3 bg-white rounded shadow-sm" style={{ fontSize: '0.9rem' }}>
                <div className="d-flex flex-column gap-2">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                      <div className="spinner-border spinner-border-sm text-danger" role="status">
                        <span className="visually-hidden">Listening...</span>
                      </div>
                      <span className="text-muted">
                        Step {currentStep + 1}/{activeSection === 'issue' ? issueSteps.length : locationSteps.length}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger d-flex align-items-center gap-1"
                      onClick={stopVoiceInput}
                      style={{
                        borderRadius: '8px',
                        padding: '0.4rem 0.8rem',
                        fontWeight: '600'
                      }}
                    >
                      <FiMicOff size={14} />
                      <span>Stop & Next</span>
                    </button>
                  </div>
                  <div className="fw-bold text-primary" style={{ fontSize: '0.95rem' }}>
                    {activeSection === 'issue' ? issueSteps[currentStep]?.prompt : locationSteps[currentStep]?.prompt}
                  </div>
                  {voiceTranscript && (
                    <div className="text-dark mt-1 p-2 bg-light rounded">
                      <small className="text-muted">You said: </small>
                      <span className="fw-semibold">{voiceTranscript}</span>
                    </div>
                  )}
                  <small className="text-muted">
                    <strong>Tip:</strong> Say "stop" or click the button above to move to next field
                  </small>
                </div>
              </div>
            )}
          </div>

          {/* Card Body */}
          <form className="card-body p-4 p-md-5" style={{ backgroundColor: "white" }} onSubmit={handleSubmit}>
            <div className="row g-4">
              {/* Issue Details Section */}
              <div className="col-12">
                <div className="p-4 rounded-3" style={{ backgroundColor: "#FFF8F0", border: "2px solid #FFD8A8" }}>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="fw-bold mb-0 d-flex align-items-center" style={{ color: "#1a1a1a", fontSize: "1.15rem", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
                      <FiAlertCircle className="me-2" style={{ color: "#FFB347" }} />
                      Issue Details
                    </h5>
                    {voiceAssistant.isSupported() && (
                      <button
                        type="button"
                        className="btn btn-sm d-flex align-items-center gap-2"
                        onClick={() => activeSection === 'issue' ? stopVoiceInput() : startVoiceInput('issue')}
                        disabled={submitting}
                        style={{
                          backgroundColor: activeSection === 'issue' ? '#FF6B6B' : '#FFB347',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '0.5rem 1rem',
                          fontWeight: '600',
                          transition: 'all 0.3s'
                        }}
                      >
                        {activeSection === 'issue' ? (
                          <>
                            <FiMicOff size={16} />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <FiMic size={16} />
                            <span>Voice Fill</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Voice Assistant Hint */}
                  {voiceAssistant.isSupported() && !isVoiceListening && (
                    <div className="alert alert-info d-flex align-items-start gap-2 mb-4" style={{ backgroundColor: '#E3F2FD', border: 'none', borderLeft: '4px solid #2196F3', fontSize: '0.85rem' }}>
                      <FiMic size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                      <div>
                        <strong>Voice Guide:</strong> Click "Voice Fill" and follow step-by-step:
                        <ol className="mb-0 mt-1 ps-3">
                          <li>Say: "Problem title is [title]"</li>
                          <li>Say: "Category is [category]"</li>
                          <li>Say: "Problem description is [description]"</li>
                        </ol>
                        <small className="text-muted mt-1 d-block">
                          Say "stop" or click "Stop & Next" button after each field.
                        </small>
                      </div>
                    </div>
                  )}

                  <div className="row g-3 mb-4">
                    {/* Problem Title */}
                    <div className="col-md-6">
                      <div className="form-floating">
                        <input
                          type="text"
                          className="form-control"
                          id="problemTitle"
                          placeholder="Problem Title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          required
                          disabled={submitting}
                          maxLength={60}
                          style={{
                            border: "2px solid #e0e0e0",
                            borderRadius: "10px",
                            fontSize: "1rem",
                            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                            transition: "all 0.3s ease",
                            fontWeight: "500",
                            height: "58px"
                          }}
                          onFocus={(e) => e.target.style.border = "2px solid #FFB347"}
                          onBlur={(e) => e.target.style.border = "2px solid #e0e0e0"}
                        />
                        <label htmlFor="problemTitle" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", color: "#616161" }}>Problem Title <span style={{ color: "#D32F2F" }}>*</span></label>
                      </div>
                    </div>

                    {/* Problem Category */}
                    <div className="col-md-6">
                      <div className="form-floating">
                        <select
                          className="form-select"
                          id="problemCategory"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          required
                          disabled={submitting}
                          style={{
                            border: "2px solid #e0e0e0",
                            borderRadius: "10px",
                            fontSize: "1rem",
                            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                            transition: "all 0.3s ease",
                            fontWeight: "500",
                            height: "58px"
                          }}
                          onFocus={(e) => e.target.style.border = "2px solid #FFB347"}
                          onBlur={(e) => e.target.style.border = "2px solid #e0e0e0"}
                        >
                          <option value="" disabled>
                            Select Category
                          </option>
                          <option>Sanitization</option>
                          <option>Cleanliness</option>
                          <option>Electricity</option>
                          <option>Road</option>
                          <option>Water</option>
                          <option>Public Safety</option>
                          <option>Other</option>
                        </select>
                        <label htmlFor="problemCategory" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", color: "#616161" }}>Problem Category <span style={{ color: "#D32F2F" }}>*</span></label>
                      </div>
                    </div>
                  </div>

                  {/* Problem Description */}
                  <div className="form-floating mb-4">
                    <textarea
                      className="form-control"
                      placeholder="Describe your problem"
                      id="problemDescription"
                      style={{
                        height: "120px",
                        border: "2px solid #e0e0e0",
                        borderRadius: "10px",
                        fontSize: "1rem",
                        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                        transition: "all 0.3s ease",
                        fontWeight: "500"
                      }}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      disabled={submitting}
                      onFocus={(e) => e.target.style.border = "2px solid #FFB347"}
                      onBlur={(e) => e.target.style.border = "2px solid #e0e0e0"}
                    ></textarea>
                    <label htmlFor="problemDescription" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", color: "#616161" }}>Problem Description <span style={{ color: "#D32F2F" }}>*</span></label>
                  </div>
                </div>
              </div>

              {/* Location Section */}
              <div className="col-12">
                <div className="p-4 rounded-3" style={{ backgroundColor: "#FFF8F0", border: "2px solid #FFD8A8" }}>
                  <h5 className="fw-bold mb-4 d-flex align-items-center" style={{ color: "#1a1a1a", fontSize: "1.15rem", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
                    <FiMapPin className="me-2" style={{ color: "#FFB347" }} />
                    Location Information <span style={{ color: "#D32F2F" }}>*</span>
                  </h5>

                  {/* Structured Location Subfields */}
                  <div className="row g-3">
                    <div className="col-12">
                      <div className="form-floating">
                        <input
                          type="text"
                          className="form-control"
                          id="addressLine"
                          placeholder="Address line (House number, street)"
                          value={addressLine}
                          onChange={(e) => setAddressLine(e.target.value)}
                          disabled={submitting}
                          style={{ border: "2px solid #e0e0e0", borderRadius: "10px", height: "50px" }}
                          onFocus={(e) => e.target.style.border = "2px solid #FFB347"}
                          onBlur={(e) => e.target.style.border = "2px solid #e0e0e0"}
                        />
                        <label htmlFor="addressLine">Address Line <span style={{ color: "#D32F2F" }}>*</span></label>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-floating">
                        <input
                          type="text"
                          className="form-control"
                          id="landmark"
                          placeholder="Landmark (optional)"
                          value={landmark}
                          onChange={(e) => setLandmark(e.target.value)}
                          disabled={submitting}
                          style={{ border: "2px solid #e0e0e0", borderRadius: "10px", height: "50px" }}
                          onFocus={(e) => e.target.style.border = "2px solid #FFB347"}
                          onBlur={(e) => e.target.style.border = "2px solid #e0e0e0"}
                        />
                        <label htmlFor="landmark">Landmark</label>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-floating">
                        <select
                          className="form-select"
                          id="district"
                          value={district}
                          onChange={(e) => setDistrict(e.target.value)}
                          disabled={submitting}
                          style={{ border: "2px solid #e0e0e0", borderRadius: "10px", height: "50px" }}
                        >
                          <option value="">Select District</option>
                          <option>Central Delhi</option>
                          <option>North Delhi</option>
                          <option>South Delhi</option>
                          <option>East Delhi</option>
                          <option>West Delhi</option>
                          <option>New Delhi</option>
                          <option>North East Delhi</option>
                          <option>North West Delhi</option>
                          <option>Shahdara</option>
                          <option>South East Delhi</option>
                          <option>South West Delhi</option>
                        </select>
                        <label htmlFor="district">District</label>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-floating">
                        <input
                          type="text"
                          className="form-control"
                          id="city"
                          placeholder="City"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          disabled={submitting}
                          style={{ border: "2px solid #e0e0e0", borderRadius: "10px", height: "50px" }}
                        />
                        <label htmlFor="city">City</label>
                      </div>
                    </div>

                    <div className="col-md-3">
                      <div className="form-floating">
                        <input
                          type="text"
                          className="form-control"
                          id="state"
                          placeholder="State"
                          value={stateName}
                          onChange={(e) => setStateName(e.target.value)}
                          disabled={submitting}
                          style={{ border: "2px solid #e0e0e0", borderRadius: "10px", height: "50px" }}
                        />
                        <label htmlFor="state">State</label>
                      </div>
                    </div>

                    <div className="col-md-3">
                      <div className="form-floating">
                        <input
                          type="text"
                          className="form-control"
                          id="pincode"
                          placeholder="Pin Code"
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value)}
                          disabled={submitting}
                          style={{ border: "2px solid #e0e0e0", borderRadius: "10px", height: "50px" }}
                        />
                        <label htmlFor="pincode">Pin Code</label>
                      </div>
                    </div>

                    {/* Auto Detect Button */}
                    <div className="col-12 text-center mt-3">
                      <button
                        type="button"
                        className="btn fw-semibold px-4 py-3 shadow-sm"
                        style={{
                          background: "linear-gradient(135deg, #FFB347 0%, #FFD8A8 100%)",
                          color: "#1a1a1a",
                          border: "none",
                          borderRadius: "10px",
                          fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                          fontSize: "1rem",
                          transition: "all 0.3s ease"
                        }}
                        onClick={handleAutoDetect}
                        disabled={submitting || autoDetectLoading}
                      >
                        <FiMapPin className="me-2" style={{ fontSize: "1.1rem" }} />
                        {autoDetectLoading ? "Detecting location..." : "Auto-Detect Current Location"}
                      </button>
                      <div className="mt-2">
                        <small className="text-muted" style={{ fontSize: "0.8rem" }}>
                          💡 Click button → Allow location when browser prompts → Address auto-fills
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Photo Upload Section */}
              <div className="col-12">
                <div className="p-4 rounded-3" style={{ backgroundColor: "#FFF8F0", border: "2px solid #FFD8A8" }}>
                  <h5 className="fw-bold mb-4 d-flex align-items-center" style={{ color: "#1a1a1a", fontSize: "1.15rem", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
                    <FiUpload className="me-2" style={{ color: "#FFB347" }} />
                    Supporting Evidence <span style={{ color: "#D32F2F", fontSize: "0.9rem", marginLeft: "0.25rem" }}>*</span>
                  </h5>

                  <div className="mb-3">
                    <input
                      className="form-control"
                      type="file"
                      id="photoUpload"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      disabled={submitting}
                      required
                      style={{
                        border: photoError ? "2px solid #D32F2F" : "2px solid #e0e0e0",
                        borderRadius: "10px",
                        padding: "0.75rem",
                        fontSize: "1rem",
                        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                        transition: "all 0.3s ease",
                        fontWeight: "500"
                      }}
                    />
                    
                    {/* AI Photo Validation Status */}
                    {photoValidating && (
                      <div className="mt-2 d-flex align-items-center gap-2" style={{ color: "#2196F3", fontSize: "0.9rem" }}>
                        <div className="spinner-border spinner-border-sm" role="status"></div>
                        <span>AI is validating your photo...</span>
                      </div>
                    )}
                    
                    {photoValidation && !photoValidating && (
                      <div className={`mt-2 d-flex align-items-center gap-2 p-2 rounded`} 
                           style={{ 
                             backgroundColor: photoValidation.isValid ? '#E8F5E9' : '#FFF3E0',
                             color: photoValidation.isValid ? '#2E7D32' : '#F57C00',
                             fontSize: '0.9rem'
                           }}>
                        {photoValidation.isValid ? <FiCheckCircle /> : <FiEye />}
                        <span>
                          {photoValidation.message} 
                          {photoValidation.confidence > 0 && ` (${photoValidation.confidence}% confidence)`}
                        </span>
                      </div>
                    )}
                    
                    {photoError && (
                      <div className="mt-2 d-flex align-items-center" style={{ color: "#D32F2F", fontSize: "0.9rem", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
                        <FiAlertCircle className="me-1" />{photoError}
                      </div>
                    )}
                    <small className="text-muted d-block mt-2" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
                      Maximum file size: 5MB. AI will verify photo relevance.
                    </small>
                  </div>

                  {photoPreview && (
                    <div className="text-center mt-4">
                      <div className="border rounded-3 p-3 shadow-sm" style={{ backgroundColor: "white", borderColor: "#FFD8A8" }}>
                        <p className="small fw-semibold mb-3" style={{ color: "#616161", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
                          Image Preview:
                        </p>
                        <img
                          src={photoPreview}
                          alt="preview"
                          className="img-fluid rounded"
                          style={{ maxHeight: "300px", objectFit: "contain", border: "1px solid #e0e0e0" }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="col-12">
                <div className="text-center pt-3">
                  <button
                    type="submit"
                    className="btn btn-lg fw-bold px-5 py-3 shadow-sm"
                    style={{
                      background: "linear-gradient(135deg, #FFB347 0%, #FFD8A8 100%)",
                      color: "#1a1a1a",
                      border: "none",
                      borderRadius: "12px",
                      minWidth: "280px",
                      fontSize: "1.1rem",
                      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                      transition: "all 0.3s ease",
                      letterSpacing: "0.3px"
                    }}
                    disabled={submitting}
                    onMouseEnter={(e) => !submitting && (e.target.style.transform = "translateY(-2px)")}
                    onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Processing Submission...
                      </>
                    ) : (
                      <>
                        <FiSend className="me-2" style={{ fontSize: "1.2rem" }} />
                        Submit Complaint
                      </>
                    )}
                  </button>
                  <p className="text-muted mt-3" style={{ fontSize: "0.95rem", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
                    Your complaint will be reviewed within 24-48 hours
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
        </section>
      </div>
    </div>
  );
};

export default Create;


