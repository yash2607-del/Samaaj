// ...existing code...
import React, { useState } from "react";
import axios from "axios";

const Create = () => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoError, setPhotoError] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("category", category);
    formData.append("description", description.trim());
    formData.append("location", location.trim());
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
    <div className="container py-5" style={{ backgroundColor: "#ffffff" }}>
      <div className="text-center mb-4">
        <h2 style={{ color: "#FFD700", fontWeight: "bold" }}>
          Raise Your Complaint with Samaaj
        </h2>
        <p className="text-muted">
          Help us build a better community by reporting issues you notice.
        </p>
      </div>

      {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      <form
        className="p-4 rounded shadow"
        style={{ backgroundColor: "white" }}
        onSubmit={handleSubmit}
      >
        {/* Problem Title */}
        <div className="form-floating mb-3">
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
        <div className="mb-3 text-center">
          <button
            type="button"
            className="btn w-30 fw-bold"
            style={{ backgroundColor: "yellow", color: "black" }}
            onClick={handleAutoDetect}
            disabled={submitting}
          >
            📍 Auto Detect Address
          </button>
        </div>

        {/* Photo Upload (Required) */}
        <div className="mb-3">
          <label htmlFor="photoUpload" className="form-label fw-bold">
            Upload Photo <span style={{ color: "red" }}>*</span>
          </label>
          <input
            className="form-control"
            type="file"
            id="photoUpload"
            accept="image/*"
            onChange={handlePhotoChange}
            disabled={submitting}
            required
          />
          {photoError && <p className="text-danger mt-2">{photoError}</p>}
        </div>

        {photoPreview && (
          <div className="mb-3 text-center">
            <img
              src={photoPreview}
              alt="preview"
              className="img-fluid rounded"
              style={{ maxHeight: 240 }}
            />
          </div>
        )}

        {/* Submit Button (Centered) */}
        <div className="text-center">
          <button
            type="submit"
            className="btn"
            style={{ backgroundColor: "#FFD700", fontWeight: "bold", width: "200px" }}
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Create;
// ...existing code...