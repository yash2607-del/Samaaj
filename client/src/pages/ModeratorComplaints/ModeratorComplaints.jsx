import React, { useEffect, useMemo, useState } from "react";
import placeholderImg from "../../assets/img1.jpg";
import { toastError, toastSuccess } from "../../utils/toast";
import { useNavigate } from "react-router-dom";
import API from "../../api/api.js";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiAlertCircle, FiCheckCircle, FiClock, FiInbox, FiMapPin,
  FiRefreshCw, FiTag, FiCalendar, FiEye, FiCamera, FiFileText,
  FiSend, FiChevronRight, FiFilter, FiActivity
} from "react-icons/fi";

const statusMeta = {
  Pending: { color: "#FF7A45", bg: "rgba(255,122,69,0.1)", icon: FiClock },
  "In Progress": { color: "#007AFF", bg: "rgba(0,122,255,0.1)", icon: FiRefreshCw },
  Resolved: { color: "#34C759", bg: "rgba(52,199,89,0.1)", icon: FiCheckCircle },
  Rejected: { color: "#FF3B30", bg: "rgba(255,59,48,0.1)", icon: FiAlertCircle }
};

export default function ModeratorComplaints() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [actionPhoto, setActionPhoto] = useState(null);
  const [actionDescription, setActionDescription] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [tagFilter, setTagFilter] = useState("All");
  const [trustFilter, setTrustFilter] = useState("All");

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const response = await API.get('/api/complaints/moderator-view');
      setComplaints(response.data.data || response.data || []);
    } catch (err) {
      toastError("Failed to load complaints");
      if (err.response?.status === 401) navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const filteredComplaints = useMemo(() => {
    let filtered = [...complaints];
    if (tagFilter !== "All") filtered = filtered.filter(c => c.reportTag === tagFilter);
    if (trustFilter === "Low Trust") filtered = filtered.filter(c => (c.trustScore || 0) < 0.4);
    
    // Sort: lowest trustScore first
    filtered.sort((a, b) => (a.trustScore || 0) - (b.trustScore || 0));
    return filtered;
  }, [complaints, tagFilter, trustFilter]);

  const handleUpdateStatus = async (complaintId, newStatus) => {
    try {
      setUpdatingStatus(complaintId);
      const storedUser = JSON.parse(localStorage.getItem("user"));
      const formData = new FormData();
      formData.append("status", newStatus);
      formData.append("moderatorEmail", storedUser.email);
      if (actionDescription) formData.append("actionDescription", actionDescription);
      if (actionPhoto) formData.append("actionPhoto", actionPhoto);

      await API.patch(`/api/complaints/update-status/${complaintId}`, formData);
      setActionPhoto(null);
      setActionDescription("");
      setSelectedComplaint(null);
      await fetchComplaints();
      toastSuccess("Status updated!");
    } catch (error) {
      toastError("Update failed");
    } finally {
      setUpdatingStatus(null);
    }
  };

  return (
    <div className="flex-grow-1 px-lg-5 px-3 py-5" style={{ background: '#F9FAFB' }}>
      
      {/* Admin Header */}
      <header className="mb-5 d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3">
        <div>
          <div className="d-flex align-items-center gap-2 mb-2">
            <FiActivity className="text-primary" />
            <span className="text-muted fw-bold small text-uppercase" style={{ letterSpacing: '1px' }}>Department Queue</span>
          </div>
          <h1 className="fw-black mb-1 text-dark" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', letterSpacing: '-1.5px', lineHeight: '1' }}>
            CASE MANAGEMENT<span style={{ color: '#FF7A45' }}>.</span>
          </h1>
          <p className="text-muted fw-medium">Operational oversight of pending and active civic reports.</p>
        </div>
        <div className="d-flex gap-2">
           <select className="form-select border-0 bg-white shadow-sm rounded-pill fw-bold small px-3" style={{ width: '130px' }} value={tagFilter} onChange={e => setTagFilter(e.target.value)}>
              <option value="All">All Tags</option>
              <option value="spam">Spam</option>
              <option value="duplicate">Duplicate</option>
              <option value="irrelevant">Irrelevant</option>
           </select>
           <select className="form-select border-0 bg-white shadow-sm rounded-pill fw-bold small px-3" style={{ width: '130px' }} value={trustFilter} onChange={e => setTrustFilter(e.target.value)}>
              <option value="All">All Trust</option>
              <option value="Low Trust">Low Trust</option>
           </select>
        </div>
      </header>

      {/* Grid Layout */}
      <div className="row g-4">
        {loading ? (
          <div className="col-12 text-center py-5"><div className="spinner-border text-dark"></div></div>
        ) : complaints.length === 0 ? (
          <div className="col-12 text-center py-5">
             <FiInbox size={48} className="text-muted opacity-20 mb-3" />
             <div className="fw-black text-muted">QUEUE IS EMPTY</div>
          </div>
        ) : (
          filteredComplaints.map((c, i) => (
            <motion.div 
              key={c._id} className="col-xl-4 col-lg-6"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            >
              <div className="card h-100 border-0 shadow-sm overflow-hidden" style={{ borderRadius: '32px', background: '#fff', border: '1px solid rgba(0,0,0,0.04)' }}>
                  <div className="position-relative" style={{ height: '200px' }}>
                    <img 
                      src={c.photo ? `${import.meta.env.VITE_API_BASE_URL}/${c.photo.replace(/^\//, '')}` : placeholderImg} 
                      className="w-100 h-100" style={{ objectFit: 'cover' }} alt="Issue" 
                    />
                    <div className="position-absolute top-0 start-0 m-3 d-flex flex-column gap-2">
                       <div className="px-3 py-1 rounded-pill fw-black text-white shadow-lg" style={{ background: (c.trustScore || 0) < 0.4 ? '#FF3B30' : '#34C759', fontSize: '0.65rem' }}>
                          {Math.round((c.trustScore || 0) * 100)}% TRUST
                       </div>
                       {c.mlReviewStatus === 'Verified by AI' && (
                          <div className="px-3 py-1 rounded-pill fw-black text-white shadow-lg d-flex align-items-center gap-1" style={{ background: '#34C759', fontSize: '0.65rem' }}>
                             <FiCheckCircle size={10} /> VERIFIED BY AI
                          </div>
                       )}
                       {c.reportTag && c.reportTag !== 'clean' && (
                          <div className="px-3 py-1 rounded-pill fw-black text-white shadow-lg" style={{ background: '#000', fontSize: '0.65rem' }}>
                             {c.reportTag.toUpperCase()}
                          </div>
                       )}
                    </div>
                    <div className="position-absolute top-0 end-0 m-3">
                       <div className="px-3 py-1 rounded-pill fw-black text-white shadow-lg" style={{ background: statusMeta[c.status]?.color || '#000', fontSize: '0.65rem' }}>
                          {c.status.toUpperCase()}
                       </div>
                    </div>
                 </div>
                 
                 <div className="card-body p-4">
                    <div className="d-flex align-items-center gap-2 mb-2">
                       <span className="px-2 py-1 rounded bg-light small fw-black text-muted" style={{ fontSize: '0.6rem' }}>{c.category?.toUpperCase() || 'GENERAL'}</span>
                       <span className="text-muted small fw-bold">{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h5 className="fw-black text-dark mb-3 text-truncate">{c.title}</h5>
                    <div className="d-flex align-items-center gap-2 text-muted small mb-4">
                       <FiMapPin size={14} className="text-danger" />
                       <span className="text-truncate">{c.district}</span>
                    </div>

                    <AnimatePresence>
                      {selectedComplaint === c._id ? (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                           <div className="p-4 rounded-4 bg-light mb-3">
                              <label className="small fw-black text-muted text-uppercase mb-2">Status Update</label>
                              <select className="form-select mb-3 border-0 rounded-pill shadow-none fw-bold" id={`stat-${c._id}`} defaultValue={c.status}>
                                 <option value="Pending">Pending</option>
                                 <option value="In Progress">In Progress</option>
                                 <option value="Resolved">Resolved</option>
                                 <option value="Rejected">Rejected</option>
                              </select>
                              <textarea className="form-control border-0 rounded-4 mb-3 shadow-none fw-medium" placeholder="Action taken..." rows="2" onChange={e => setActionDescription(e.target.value)} />
                              <button className="btn btn-dark w-100 rounded-pill py-2 fw-black" onClick={() => handleUpdateStatus(c._id, document.getElementById(`stat-${c._id}`).value)}>
                                 SUBMIT UPDATE
                              </button>
                           </div>
                        </motion.div>
                      ) : (
                        <button className="btn btn-light w-100 rounded-pill py-3 fw-black text-muted small d-flex align-items-center justify-content-center gap-2" onClick={() => setSelectedComplaint(c._id)}>
                           MANAGE CASE <FiChevronRight />
                        </button>
                      )}
                    </AnimatePresence>
                 </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <style>{`
        .fw-black { font-weight: 900; }
      `}</style>
    </div>
  );
}
