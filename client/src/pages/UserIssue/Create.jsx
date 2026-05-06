import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/api.js";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiMapPin, FiUpload, FiAlertCircle, FiCheckCircle, 
  FiSend, FiArrowLeft, FiEye, FiType, FiLayers, FiInfo
} from 'react-icons/fi';

const categories = ["Sanitization", "Electricity", "Road", "Water", "Public Safety", "Public Works"];

const Create = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("New Delhi");
  const [district, setDistrict] = useState("");
  const [stateName, setStateName] = useState("Delhi");
  const [pincode, setPincode] = useState("");
  const [autoDetectLoading, setAutoDetectLoading] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoError, setPhotoError] = useState("");
  const [imageSource, setImageSource] = useState("gallery");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  const handlePhotoChange = (e, source = 'gallery') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Image must be under 5MB");
      return;
    }
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    setImageSource(source);
    setPhotoError("");
  };

  const handleAutoDetect = () => {
    setAutoDetectLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude, longitude } = pos.coords;
        const { data } = await API.get('/api/geocode/reverse', { params: { lat: latitude, lon: longitude } });
        const addr = data.address || {};
        setAddressLine(addr.road || addr.suburb || "");
        setDistrict(addr.county || addr.city_district || "");
        setPincode(addr.postcode || "");
        if (addr.amenity) setLandmark(addr.amenity);
      } catch (err) {
        console.error(err);
      } finally {
        setAutoDetectLoading(false);
      }
    }, () => setAutoDetectLoading(false));
  };

  const [duplicateMessage, setDuplicateMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setDuplicateMessage("");
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("category", category);
      formData.append("description", description);
      formData.append("location", `${addressLine}, ${city}`);
      formData.append("district", district);
      formData.append("pincode", pincode);
      formData.append("imageSource", imageSource);
      if (photo) formData.append("photo", photo);

      const { data } = await API.post("/api/complaints", formData);
      setSuccessMessage(data.message || "Report submitted successfully.");
      if (data.message && data.isDuplicate) {
        setDuplicateMessage(data.message);
      }
      setSuccess(true);
      setTimeout(() => navigate("/track-issue"), 4000);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || err.response?.data?.message || "Failed to submit report. Please try again.";
      setError(msg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  if (success) {
    return (
      <div className="flex-grow-1 d-flex align-items-center justify-content-center bg-white">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center px-4">
          <div className="mb-4 d-inline-flex p-4 rounded-circle" style={{ background: successMessage.includes('review') || successMessage.includes('Similar') ? 'rgba(255,122,69,0.1)' : 'rgba(52,199,89,0.1)', color: successMessage.includes('review') || successMessage.includes('Similar') ? '#FF7A45' : '#34C759' }}>
            {successMessage.includes('review') || successMessage.includes('Similar') ? <FiInfo size={60} /> : <FiCheckCircle size={60} />}
          </div>
          <h2 className="fw-black mb-2" style={{ letterSpacing: '-1px' }}>{successMessage.includes('Similar') ? 'ISSUE LOGGED' : 'THANK YOU'}</h2>
          <p className="text-muted mb-4 fw-medium" style={{ maxWidth: '400px' }}>{successMessage || "Redirecting you to the activity tracker..."}</p>
          <div className="d-flex justify-content-center">
             <div className="spinner-border spinner-border-sm text-muted opacity-25" role="status"></div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      initial="hidden" animate="visible" variants={containerVariants}
      className="flex-grow-1 px-lg-5 px-3 py-5" 
      style={{ background: '#F9FAFB' }}
    >
      {/* Header */}
      <header className="mb-5">
        <button onClick={() => navigate(-1)} className="btn btn-link text-dark p-0 mb-4 text-decoration-none d-flex align-items-center gap-2 fw-bold small">
          <FiArrowLeft /> BACK TO PORTAL
        </button>
        <h1 className="fw-black mb-1 text-dark" style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', letterSpacing: '-2px', lineHeight: '1' }}>
          NEW REPORT<span style={{ color: '#FF7A45' }}>.</span>
        </h1>
        <p className="text-muted fw-medium">Provide details about the issue to initiate resolution.</p>
      </header>

      <form onSubmit={handleSubmit} className="row g-5">
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="col-12"
            >
              <div className="p-4 rounded-4 d-flex align-items-center gap-3 mb-2" style={{ background: 'rgba(220,53,69,0.05)', border: '1px solid rgba(220,53,69,0.1)', color: '#dc3545' }}>
                <FiAlertCircle size={20} className="flex-shrink-0" />
                <div className="fw-bold small">{error}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Left Side: Form Details */}
        <div className="col-xl-7">
          <section className="bg-white p-4 p-lg-5 shadow-sm border border-light" style={{ borderRadius: '40px' }}>
            <h5 className="fw-black mb-4 d-flex align-items-center gap-2">
              <FiInfo className="text-warning" /> COMPLAINT DATA
            </h5>
            
            <div className="mb-4">
              <label className="small fw-black text-muted text-uppercase mb-2" style={{ letterSpacing: '1px' }}>Issue Title</label>
              <div className="input-group bg-light rounded-4 px-3 py-1">
                <FiType className="text-muted mt-3 me-2" />
                <input 
                  type="text" className="form-control border-0 bg-transparent shadow-none py-3 fw-bold" 
                  placeholder="e.g. Water leakage in Sector 4" 
                  value={title} onChange={e => setTitle(e.target.value)} required 
                />
              </div>
            </div>

            <div className="row g-4 mb-4">
              <div className="col-md-6">
                <label className="small fw-black text-muted text-uppercase mb-2" style={{ letterSpacing: '1px' }}>Category</label>
                <div className="input-group bg-light rounded-4 px-3 py-1">
                  <FiLayers className="text-muted mt-3 me-2" />
                  <select 
                    className="form-select border-0 bg-transparent shadow-none py-3 fw-bold"
                    value={category} onChange={e => setCategory(e.target.value)} required
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>
              <div className="col-md-6">
                <label className="small fw-black text-muted text-uppercase mb-2" style={{ letterSpacing: '1px' }}>Description</label>
                <textarea 
                  className="form-control border-0 bg-light shadow-none py-3 fw-bold rounded-4" 
                  style={{ minHeight: '56px' }}
                  placeholder="Describe the issue in detail..."
                  value={description} onChange={e => setDescription(e.target.value)} required
                />
              </div>
            </div>

            <hr className="my-5 opacity-5" />

            <h5 className="fw-black mb-4 d-flex align-items-center gap-2">
              <FiMapPin className="text-danger" /> GEOSPATIAL DATA
            </h5>

            <div className="mb-4">
              <button 
                type="button" onClick={handleAutoDetect} disabled={autoDetectLoading}
                className="btn btn-dark w-100 py-3 rounded-pill fw-black d-flex align-items-center justify-content-center gap-2 mb-4"
              >
                {autoDetectLoading ? "FETCHING COORDINATES..." : "AUTO-DETECT CURRENT LOCATION"}
              </button>
              
              <div className="row g-4">
                <div className="col-md-12">
                  <div className="form-floating bg-light rounded-4">
                    <input type="text" className="form-control border-0 bg-transparent shadow-none" id="addr" placeholder="Address" value={addressLine} onChange={e => setAddressLine(e.target.value)} required />
                    <label htmlFor="addr" className="fw-bold text-muted">Street Address / Area</label>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-floating bg-light rounded-4">
                    <input type="text" className="form-control border-0 bg-transparent shadow-none" id="dist" placeholder="District" value={district} onChange={e => setDistrict(e.target.value)} />
                    <label htmlFor="dist" className="fw-bold text-muted">District</label>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-floating bg-light rounded-4">
                    <input type="text" className="form-control border-0 bg-transparent shadow-none" id="pin" placeholder="Pincode" value={pincode} onChange={e => setPincode(e.target.value)} />
                    <label htmlFor="pin" className="fw-bold text-muted">Pincode</label>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Side: Media & Submit */}
        <div className="col-xl-5">
          <div className="sticky-top" style={{ top: '2rem' }}>
            <section className="bg-white p-4 p-lg-5 shadow-sm border border-light mb-4" style={{ borderRadius: '40px' }}>
              <h5 className="fw-black mb-4 d-flex align-items-center gap-2">
                <FiUpload className="text-primary" /> VISUAL EVIDENCE
              </h5>
              
              <div 
                className="position-relative mb-4 overflow-hidden" 
                style={{ height: '300px', borderRadius: '32px', background: '#f8f9fa', border: '2px dashed #dee2e6' }}
              >
                {photoPreview ? (
                  <>
                    <img src={photoPreview} className="w-100 h-100" style={{ objectFit: 'cover' }} alt="Preview" />
                    <button 
                      type="button" onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                      className="position-absolute top-0 end-0 m-3 btn btn-danger btn-sm rounded-circle d-flex align-items-center justify-content-center"
                      style={{ width: '32px', height: '32px' }}
                    >
                      &times;
                    </button>
                  </>
                ) : (
                  <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center text-center p-4">
                    <FiUpload size={48} className="text-muted opacity-30 mb-3" />
                    <div className="fw-black small text-muted">CHOOSE EVIDENCE SOURCE</div>
                    <div className="d-flex gap-3 mt-4">
                       <div className="position-relative">
                          <button type="button" className="btn btn-light rounded-pill px-4 fw-bold small border">GALLERY</button>
                          <input type="file" className="position-absolute top-0 start-0 w-100 h-100 opacity-0 cursor-pointer" onChange={e => handlePhotoChange(e, 'gallery')} accept="image/*" />
                       </div>
                       <div className="position-relative">
                          <button type="button" className="btn btn-dark rounded-pill px-4 fw-bold small shadow-sm">CAMERA</button>
                          <input type="file" className="position-absolute top-0 start-0 w-100 h-100 opacity-0 cursor-pointer" onChange={e => handlePhotoChange(e, 'camera')} accept="image/*" capture="environment" />
                       </div>
                    </div>
                    <div className="text-muted x-small mt-4">High-quality images help in faster resolution.</div>
                  </div>
                )}
              </div>
              {photoError && <div className="text-danger small fw-bold mb-3">{photoError}</div>}
              
              <div className="p-3 rounded-4 mb-4" style={{ background: 'rgba(255,122,69,0.05)', border: '1px solid rgba(255,122,69,0.1)' }}>
                 <div className="d-flex gap-2">
                    <FiAlertCircle className="text-warning flex-shrink-0 mt-1" />
                    <p className="small mb-0 text-muted">
                      Your report will be verified by the community and AI before being assigned to the relevant department.
                    </p>
                 </div>
              </div>

              <button 
                type="submit" disabled={submitting}
                className="btn w-100 py-3 rounded-pill fw-black d-flex align-items-center justify-content-center gap-2 shadow-sm transition-all"
                style={{ background: '#FF7A45', color: '#fff', fontSize: '0.9rem', letterSpacing: '0.5px' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {submitting ? "SUBMITTING..." : "SUBMIT REPORT"} <FiSend size={16} />
              </button>
            </section>
          </div>
        </div>
      </form>

      <style>{`
        .fw-black { font-weight: 900; }
        .x-small { font-size: 0.65rem; }
        .cursor-pointer { cursor: pointer; }
        .opacity-5 { opacity: 0.05; }
        input::placeholder, textarea::placeholder { font-weight: 500; opacity: 0.4; }
      `}</style>
    </motion.div>
  );
};

export default Create;
