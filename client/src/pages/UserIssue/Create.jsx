import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api.js";
import CitizenSidebar from "../../components/CitizenSidebar";
import { FiMapPin, FiUpload, FiAlertCircle, FiCheckCircle, FiSend, FiArrowLeft, FiEye } from 'react-icons/fi';
// AI image validation removed

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
  // Handle photo selection & basic verification
  const handlePhotoChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      setPhoto(null);
      setPhotoPreview(null);
      setPhotoError("");
      setPhotoValidation(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setPhotoError("Only image files are allowed.");
      setPhoto(null);
      setPhotoPreview(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("File size must be less than 5MB.");
      setPhoto(null);
      setPhotoPreview(null);
      return;
    }

    setPhoto(file);
    setPhotoError("");
    setPhotoPreview(URL.createObjectURL(file));

    // No AI validation — only basic client-side checks
  };
            
  const handleAutoDetect = () => {
    setErrorMsg("");
    setSuccessMsg("");
    setAutoDetectLoading(true);

    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      setAutoDetectLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Use OpenStreetMap Nominatim reverse geocoding
          const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
          if (!resp.ok) throw new Error('Reverse geocoding failed');
          const data = await resp.json();
          const addr = data.address || {};
          const addressData = {
            street: addr.road ? `${addr.house_number ? addr.house_number + ' ' : ''}${addr.road}` : (addr.neighbourhood || addr.suburb || ''),
            locality: addr.suburb || addr.neighbourhood || addr.city || addr.town || 'New Delhi',
            district: addr.county || addr.city_district || addr.state_district || '',
            state: addr.state || 'Delhi',
            pincode: addr.postcode || '',
            landmark: addr.amenity || addr.shop || ''
          };

          const formatted = data.display_name || '';

          setAddressLine(addressData.street || formatted);
          setCity(addressData.locality);
          setDistrict(addressData.district);
          setStateName(addressData.state);
          setPincode(addressData.pincode);
          if (addressData.landmark) setLandmark(addressData.landmark);
          setLocation(formatted);
          setSuccessMsg('Location detected successfully!');
        } catch (error) {
          console.error('Geocoding error:', error);
          setErrorMsg('Failed to fetch address. Please check your internet connection and try again.');
        } finally {
          setAutoDetectLoading(false);
        }
      },
      (error) => {
        setAutoDetectLoading(false);
        console.error('Geolocation error:', error);
        switch (error.code) {
          case 1:
            setErrorMsg("Location access denied. To enable:\n• Click the location/lock icon in your browser's address bar\n• Select 'Allow' for location\n• Refresh the page and try again");
            break;
          case 2:
            setErrorMsg("Location information unavailable. Please:\n• Check if location services are enabled on your device\n• Ensure you have GPS/WiFi enabled\n• Try again in a few seconds");
            break;
          case 3:
            setErrorMsg("Location request timed out. This might be due to:\n• Weak GPS signal\n• Slow internet connection\n• Please try again");
            break;
          default:
            setErrorMsg('Unable to retrieve your location. Please enter location manually or try again.');
        }
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  };

  // Fetch departments from server for category -> department mapping
  useEffect(() => {
    let mounted = true;
    const fetchDepartments = async () => {
      try {
        const resp = await API.get('/api/complaints/departments');
        if (mounted && resp?.data) {
          // controller returns { data: [...] } or array
          const list = Array.isArray(resp.data) ? resp.data : (resp.data.data || resp.data);
          setDepartments(list || []);
        }
      } catch (err) {
        console.error('Failed to load departments:', err);
      }
    };
    fetchDepartments();
    return () => { mounted = false; };
  }, []);

  const getFilteredDepartments = () => {
    if (!category) return departments;
    const cat = String(category).toLowerCase();
    return departments.filter(d => {
      const name = String(d.name || '').toLowerCase();
      const c = String(d.category || '').toLowerCase();
      const sub = String(d.subcategory || '').toLowerCase();
      return c === cat || sub.includes(cat) || name.includes(cat);
    });
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
                    
                  </div>

                  {/* Voice Assistant Hint */}
                  

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

                    {/* Department (auto-suggest / select) */}
                    <div className="col-md-6">
                      <div className="form-floating">
                        <select
                          className="form-select"
                          id="departmentSelect"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          disabled={submitting}
                          style={{ border: "2px solid #e0e0e0", borderRadius: "10px", height: "58px" }}
                        >
                          <option value="">Select Department (optional)</option>
                          {departments && departments.map((d) => (
                            <option key={d._id || d.id || d.name} value={d._id || d.id || d.name}>{d.name}{d.category ? ` — ${d.category}` : ''}</option>
                          ))}
                        </select>
                        <label htmlFor="departmentSelect" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", color: "#616161" }}>Department (optional)</label>
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
                    
                    {photoError && (
                      <div className="mt-2 d-flex align-items-center" style={{ color: "#D32F2F", fontSize: "0.9rem", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
                        <FiAlertCircle className="me-1" />{photoError}
                      </div>
                    )}
                    <small className="text-muted d-block mt-2" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
                      Maximum file size: 5MB.
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


