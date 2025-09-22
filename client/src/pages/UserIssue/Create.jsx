import React, { useState } from "react";

const Create = () => {
  const [location, setLocation] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoError, setPhotoError] = useState("");

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
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setPhotoError("Only image files are allowed.");
        setPhoto(null);
      } else if (file.size > 5 * 1024 * 1024) {
        setPhotoError("File size must be less than 5MB.");
        setPhoto(null);
      } else {
        setPhoto(file);
        setPhotoError("");
      }
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!photo) {
      setPhotoError("Photo is required before submitting.");
      return;
    }

    // Everything is valid → proceed
    alert("Complaint submitted successfully ✅");
  };

  return (
    <div className="container py-5" style={{ backgroundColor: "#ffffff" }}>
      <div className="text-center mb-4">
        <h2 style={{ color: "#FFD700", fontWeight: "bold" }}>
          📝 Raise Your Complaint with Samaaj
        </h2>
        <p className="text-muted">
          Help us build a better community by reporting issues you notice.
        </p>
      </div>

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
            required
          />
          <label htmlFor="problemTitle">Problem Title</label>
        </div>

        {/* Problem Category */}
        <div className="form-floating mb-3">
          <select className="form-select" id="problemCategory" defaultValue="" required>
            <option value="" disabled>
              Select Category
            </option>
            <option>Sanitization</option>
            <option>Cleanliness</option>
            <option>Electricity</option>
            <option>Road</option>
            <option>Water</option>
            <option>Public Safety</option>
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
            required
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
          />
          <label htmlFor="location">Location (Address)</label>
        </div>

        {/* Auto Detect Button */}
        <div className="mb-3 text-center">
          <button
            type="button"
            className="btn w-100"
            style={{ backgroundColor: "yellow", color: "black" }}
            onClick={handleAutoDetect}
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
            required
          />
          {photoError && <p className="text-danger mt-2">{photoError}</p>}
        </div>

        {/* Submit Button (Centered) */}
        <div className="text-center">
          <button
            type="submit"
            className="btn"
            style={{ backgroundColor: "#FFD700", fontWeight: "bold", width: "200px" }}
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default Create;
