import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api.js";
import CitizenSidebar from "../../components/CitizenSidebar";
import { FiMapPin, FiUpload, FiAlertCircle, FiCheckCircle, FiSend, FiArrowLeft } from 'react-icons/fi';

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

  // Fetch departments when component mounts
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await API.get("/api/complaints/departments");
        setDepartments(response.data);
      } catch (error) {
        console.error("Error fetching departments:", error);
        setErrorMsg("Failed to load departments. Please try again.");
      }
    };
    fetchDepartments();
  }, []);

  // Auto detect location and get address
  const handleAutoDetect = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported by your browser.");
      return;
    }

    setAutoDetectLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        // Prefer Geoapify (high quality). Provide Vite env var: VITE_GEOAPIFY_KEY
        const geoapifyKey = import.meta?.env?.VITE_GEOAPIFY_KEY || "";

        try {
          let props = null;

          if (geoapifyKey) {
            const resp = await fetch(
              `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&format=json&lang=en&limit=1&apiKey=${geoapifyKey}`
            );
            const j = await resp.json();
            props = j?.features?.[0]?.properties || null;
          }

          // Fallback to Nominatim if Geoapify not available or failed
          if (!props) {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`
            );
            const data = await res.json();
            props = data?.address || null;
            // Nominatim returns different structure; normalize below
            if (props) props.display_name = data.display_name || "";
          }

          if (props) {
            // Attempt to map common fields from Geoapify / Nominatim
            const addrLine = props.street || props.road || props.house || props.housenumber || props.address || props.display_name || "";
            const locality = props.suburb || props.city_district || props.neighbourhood || props.city || props.town || props.village || "New Delhi";
            const dist = props.county || props.district || props.city_district || "";
            const st = props.state || "Delhi";
            const pc = props.postcode || props.postcode || props.postal_code || "";

            setAddressLine(addrLine);
            setCity(locality || "New Delhi");
            setDistrict(dist || "");
            setStateName(st);
            setPincode(pc);
            setLocation(props.formatted || props.display_name || `${addrLine}, ${locality}, ${st}`);
          } else {
            alert("Unable to determine address from your location. Try again or enter manually.");
          }
        } catch (error) {
          console.error(error);
          alert("Unable to fetch address. Please try again.");
        } finally {
          setAutoDetectLoading(false);
        }
      },
      (err) => {
        console.error(err);
        setAutoDetectLoading(false);
        alert("Unable to fetch location. Please allow location access and try again.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Handle photo selection & basic verification
  const handlePhotoChange = (e) => {
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
      }
    } else {
      setPhoto(null);
      setPhotoPreview(null);
      setPhotoError("");
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

    if (!department) {
      setErrorMsg("Please select a department.");
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
    formData.append("department", department);
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
                  <h5 className="fw-bold mb-4 d-flex align-items-center" style={{ color: "#1a1a1a", fontSize: "1.15rem", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
                    <FiAlertCircle className="me-2" style={{ color: "#FFB347" }} />
                    Issue Details
                  </h5>

                  {/* Problem Title */}
                  <div className="form-floating mb-4">
                    <input
                      type="text"
                      className="form-control"
                      id="problemTitle"
                      placeholder="Problem Title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      disabled={submitting}
                      style={{
                        border: "2px solid #e0e0e0",
                        borderRadius: "10px",
                        fontSize: "1rem",
                        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                        transition: "all 0.3s ease",
                        fontWeight: "500"
                      }}
                      onFocus={(e) => e.target.style.border = "2px solid #FFB347"}
                      onBlur={(e) => e.target.style.border = "2px solid #e0e0e0"}
                    />
                    <label htmlFor="problemTitle" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", color: "#616161" }}>Problem Title <span style={{ color: "#D32F2F" }}>*</span></label>
                  </div>

                  <div className="row g-3 mb-4">
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
                            height: "50px"
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

                    {/* Department Selection */}
                    <div className="col-md-6">
                      <div className="form-floating">
                        <select
                          className="form-select"
                          id="department"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          required
                          disabled={submitting}
                          style={{
                            border: "2px solid #e0e0e0",
                            borderRadius: "10px",
                            fontSize: "1rem",
                            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                            transition: "all 0.3s ease",
                            fontWeight: "500",
                            height: "50px"
                          }}
                          onFocus={(e) => e.target.style.border = "2px solid #FFB347"}
                          onBlur={(e) => e.target.style.border = "2px solid #e0e0e0"}
                        >
                          <option value="">Select Department</option>
                          {departments.map((dept) => (
                            <option key={dept._id} value={dept._id}>
                              {dept.name}
                            </option>
                          ))}
                        </select>
                        <label htmlFor="department" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", color: "#616161" }}>Department <span style={{ color: "#D32F2F" }}>*</span></label>
                      </div>
                    </div>
                  </div>

                  {/* Problem Description */}
                  <div className="form-floating">
                    <textarea
                      className="form-control"
                      placeholder="Describe your problem"
                      id="problemDescription"
                      style={{
                        height: "80px",
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
                      Maximum file size: 5MB. Accepted formats: JPG, PNG, GIF
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


