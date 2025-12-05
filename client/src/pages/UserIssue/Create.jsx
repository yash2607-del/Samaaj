import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiMapPin, FiUpload, FiAlertCircle, FiCheckCircle, FiSend } from 'react-icons/fi';

const Create = () => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
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
        const response = await axios.get("http://localhost:3000/api/complaints/departments");
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
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;

          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
            );
            const data = await res.json();
            if (data && data.display_name) {
              setLocation(data.display_name);
            } else {
              setLocation("Address not found. Try again.");
            }
          } catch (error) {
            console.error(error);
            alert("Unable to fetch address. Please try again.");
          }
        },
        () => {
          alert("Unable to fetch location. Please allow location access.");
        }
      );
    } else {
      alert("Geolocation not supported by your browser.");
    }
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

    if (!title.trim() || !category || !description.trim() || !location.trim()) {
      setErrorMsg("Please fill all required fields.");
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
    formData.append("location", location.trim());
    formData.append("department", department);
    formData.append("photo", photo);

    try {
      setSubmitting(true);
      const res = await axios.post("http://localhost:3000/api/complaints", formData /* , axios will set proper headers */);
      setSuccessMsg("Complaint submitted successfully.");
      // reset form
      setTitle("");
      setCategory("");
      setDescription("");
      setLocation("");
      setPhoto(null);
      setPhotoPreview(null);
      setPhotoError("");
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || "Submission failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-5" style={{ backgroundColor: "#FFFEF7" }}>
      <div className="text-center mb-5">
        <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
             style={{ width: "80px", height: "80px", backgroundColor: "#FFC107" }}>
          <FiAlertCircle style={{ fontSize: "2.5rem", color: "#1a1a1a" }} />
        </div>
        <h2 className="fw-bold mb-2" style={{ color: "#1a1a1a" }}>
          Submit Civic Complaint
        </h2>
        <p style={{ color: "#616161", fontSize: "1.05rem" }}>
          Your voice drives positive change. Report civic issues and help build a thriving community.
        </p>
      </div>

      {errorMsg && (
        <div className="alert d-flex align-items-center" style={{ backgroundColor: "#FFEBEE", color: "#C62828", border: "1px solid #EF5350" }}>
          <FiAlertCircle className="me-2" style={{ fontSize: "1.2rem" }} />
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="alert d-flex align-items-center" style={{ backgroundColor: "#E8F5E9", color: "#2E7D32", border: "1px solid #4CAF50" }}>
          <FiCheckCircle className="me-2" style={{ fontSize: "1.2rem" }} />
          {successMsg}
        </div>
      )}

      <form
        className="p-5 rounded-3 shadow-sm"
        style={{ backgroundColor: "white", border: "3px solid #FFC107" }}
        onSubmit={handleSubmit}
      >
        <h5 className="fw-bold mb-4 pb-3 border-bottom" style={{ color: "#1a1a1a" }}>Complaint Details</h5>
        
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
          />
          <label htmlFor="problemTitle">Problem Title</label>
        </div>

        {/* Problem Category */}
        <div className="form-floating mb-3">
          <select
            className="form-select"
            id="problemCategory"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            disabled={submitting}
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
          <label htmlFor="problemCategory">Problem Category</label>
        </div>

        {/* Department Selection */}
        <div className="form-floating mb-3">
          <select
            className="form-select"
            id="department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            required
            disabled={submitting}
          >
            <option value="">Select Department</option>
            {departments.map((dept) => (
              <option key={dept._id} value={dept._id}>
                {dept.name}
              </option>
            ))}
          </select>
          <label htmlFor="department">Department</label>
        </div>

        {/* Problem Description */}
        <div className="form-floating mb-3">
          <textarea
            className="form-control"
            placeholder="Describe your problem"
            id="problemDescription"
            style={{ height: "120px" }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            disabled={submitting}
          ></textarea>
          <label htmlFor="problemDescription">Problem Description</label>
        </div>

        {/* Location */}
        <div className="form-floating mb-3">
          <input
            type="text"
            className="form-control"
            id="location"
            placeholder="Enter location or use auto-detect"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            disabled={submitting}
          />
          <label htmlFor="location">Location (Address)</label>
        </div>

        {/* Auto Detect Button */}
        <div className="mb-4 text-center">
          <button
            type="button"
            className="btn fw-semibold px-4 py-2"
            style={{ backgroundColor: "#FFC107", color: "#1a1a1a", border: "none", borderRadius: "8px" }}
            onClick={handleAutoDetect}
            disabled={submitting}
          >
            <FiMapPin className="me-2" style={{ fontSize: "1.1rem" }} />
            Auto-Detect Current Location
          </button>
        </div>

        {/* Photo Upload (Required) */}
        <div className="mb-4">
          <label htmlFor="photoUpload" className="form-label fw-semibold d-flex align-items-center gap-2" style={{ color: "#1a1a1a" }}>
            <FiUpload style={{ color: "#FFC107" }} />
            Upload Supporting Photo <span style={{ color: "#D32F2F" }}>*</span>
          </label>
          <input
            className="form-control"
            type="file"
            id="photoUpload"
            accept="image/*"
            onChange={handlePhotoChange}
            disabled={submitting}
            required
            style={{ borderColor: photoError ? "#D32F2F" : "#dee2e6" }}
          />
          {photoError && (
            <p className="mt-2 d-flex align-items-center gap-1" style={{ color: "#D32F2F", fontSize: "0.875rem" }}>
              <FiAlertCircle />{photoError}
            </p>
          )}
          <small className="text-muted">Maximum file size: 5MB. Accepted formats: JPG, PNG, GIF</small>
        </div>

        {photoPreview && (
          <div className="mb-4 text-center">
            <div className="border rounded-3 p-3" style={{ backgroundColor: "#FFFEF7", borderColor: "#FFC107" }}>
              <p className="small fw-semibold mb-2" style={{ color: "#616161" }}>Image Preview:</p>
              <img
                src={photoPreview}
                alt="preview"
                className="img-fluid rounded"
                style={{ maxHeight: 280, border: "2px solid #FFC107" }}
              />
            </div>
          </div>
        )}

        {/* Submit Button (Centered) */}
        <div className="text-center mt-5 pt-4 border-top">
          <button
            type="submit"
            className="btn btn-lg fw-bold px-5 py-3"
            style={{ 
              backgroundColor: "#FFC107", 
              color: "#1a1a1a", 
              border: "none",
              borderRadius: "10px",
              minWidth: "250px"
            }}
            disabled={submitting}
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
          <p className="text-muted mt-3 small">Your complaint will be reviewed within 24-48 hours</p>
        </div>
      </form>
    </div>
  );
};

export default Create;