import React, { useEffect, useMemo, useState } from "react";
import { toastError, toastSuccess } from "../../utils/toast";
import { useNavigate } from "react-router-dom";
import API from "../../api";
import ModeratorSidebar from "../../components/ModeratorSidebar";
// AI image validation removed
import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiInbox,
  FiMapPin,
  FiRefreshCw,
  FiTag,
  FiCalendar,
  FiEye,
  FiXCircle,
  FiCamera,
  FiFileText,
  FiSend,
  FiClipboard
} from "react-icons/fi";

const statusMeta = {
  Pending: {
    icon: FiClock,
    badgeClass: "bg-warning text-dark",
    surface: "#FFF8F0"
  },
  "In Progress": {
    icon: FiRefreshCw,
    badgeClass: "bg-info text-dark",
    surface: "#E1F5FE"
  },
  Resolved: {
    icon: FiCheckCircle,
    badgeClass: "bg-success text-white",
    surface: "#E8F5E9"
  },
  Rejected: {
    icon: FiAlertCircle,
    badgeClass: "bg-danger text-white",
    surface: "#FFEBEE"
  }
};

const normalizePhotoUrl = (photoPath) => {
  if (!photoPath) return "";
  if (/^https?:\/\//i.test(photoPath)) return photoPath;
  const trimmed = photoPath.startsWith("/") ? photoPath.slice(1) : photoPath;
  return `${import.meta.env.VITE_BACKEND_URL || 'https://samaaj-backend-kj3r.onrender.com'}/${trimmed}`;
};

const formatDate = (value) => {
  if (!value) return "Date unavailable";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export default function ModeratorComplaints() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [actionPhoto, setActionPhoto] = useState(null);
  const [actionDescription, setActionDescription] = useState("");
  const [actionPhotoValidating, setActionPhotoValidating] = useState(false);
  const [actionPhotoValidation, setActionPhotoValidation] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = JSON.parse(localStorage.getItem("user"));

    if (!token || !storedUser || !/moderator/i.test(storedUser.role || '')) {
      toastError("Please login as a moderator");
      navigate("/login");
      return;
    }

    fetchComplaints();
  }, [navigate]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      
      const response = await API.get('/api/complaints/moderator-view');
      
      const data = response.data.data || response.data;
      setComplaints(data);
    } catch (err) {
      console.error("Failed to load complaints", err);
      setError(err.response?.data?.error || "Failed to load complaints");
      
      if (err.response?.status === 401) {
        toastError("Session expired. Please login again.");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => {
    const total = complaints.length;
    const pending = complaints.filter((item) => item.status === "Pending").length;
    const inProgress = complaints.filter((item) => item.status === "In Progress").length;
    const resolved = complaints.filter((item) => item.status === "Resolved").length;
    return { total, pending, inProgress, resolved };
  }, [complaints]);

  const handleUpdateStatus = async (complaintId, newStatus) => {
    try {
      setUpdatingStatus(complaintId);
      const token = localStorage.getItem("token");
      const storedUser = JSON.parse(localStorage.getItem("user"));

      const formData = new FormData();
      formData.append("status", newStatus);
      formData.append("moderatorEmail", storedUser.email);
      
      if (actionDescription) {
        formData.append("actionDescription", actionDescription);
      }
      
      if (actionPhoto) {
        formData.append("actionPhoto", actionPhoto);
      }

      // Debug: log token/header to ensure Authorization is attached
      try {
        const debugToken = localStorage.getItem('token');
        // eslint-disable-next-line no-console
        console.debug('DEBUG update-status token present?', !!debugToken);
      } catch (e) {
        // ignore
      }

      await API.patch(`/api/complaints/update-status/${complaintId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

      // Reset form
      setActionPhoto(null);
      setActionDescription("");
      setSelectedComplaint(null);
      
      // Refresh complaints
      await fetchComplaints();
      toastSuccess("Status updated successfully!");
    } catch (error) {
      console.error("Error updating status:", error);
      toastError(error.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setActionPhoto(file);
      // reset any previous validation state when a new photo is chosen
      setActionPhotoValidation(null);
      setActionPhotoValidating(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex" style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
        <ModeratorSidebar />
        <div className="flex-grow-1 d-flex align-items-center justify-content-center">
          <div className="text-center">
            <div className="spinner-border" style={{ width: "3rem", height: "3rem", color: "#FFB347" }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <div className="mt-3 fw-semibold" style={{ color: "#616161", fontSize: "1.1rem" }}>
              Loading complaints...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="d-flex" style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
        <ModeratorSidebar />
        <div className="flex-grow-1 d-flex align-items-center justify-content-center p-4">
          <div className="card border-0 shadow-sm" style={{ maxWidth: "500px", width: "100%" }}>
            <div className="card-body text-center p-5">
              <FiXCircle style={{ fontSize: "4rem", color: "#D32F2F" }} />
              <h4 className="mt-4 mb-3 fw-bold" style={{ color: "#1a1a1a" }}>Unable to Load Complaints</h4>
              <p className="text-muted mb-4">{error}</p>
              <button 
                className="btn fw-semibold px-4"
                style={{ backgroundColor: "#FFB347", color: "#1a1a1a", border: "none" }}
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!complaints.length) {
    return (
      <div className="d-flex" style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
        <ModeratorSidebar />
        <div className="flex-grow-1 d-flex align-items-center justify-content-center p-4">
          <div className="card border-0 shadow-sm" style={{ maxWidth: "600px", width: "100%" }}>
            <div className="card-body text-center p-5">
              <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-4"
                   style={{ width: "100px", height: "100px", backgroundColor: "#FFF8F0" }}>
                <FiInbox style={{ fontSize: "3rem", color: "#FFB347" }} />
              </div>
              <h4 className="mb-3 fw-bold" style={{ color: "#1a1a1a" }}>No Complaints Yet</h4>
              <p className="text-muted mb-4" style={{ fontSize: "1.05rem" }}>
                No complaints have been submitted to your department yet.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex" style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <ModeratorSidebar />
      <div className="flex-grow-1" style={{ overflow: "auto" }}>
        
        {/* Header Section */}
        <section className="py-3 px-4 border-bottom shadow-sm" style={{ background: "linear-gradient(135deg, #FFB347 0%, #FFD8A8 100%)" }}>
          <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-lg-between">
            <div>
              <h3 className="mb-2 fw-bold" style={{ color: "#1a1a1a", fontSize: "1.75rem" }}>
                All Complaints
              </h3>
              <p className="mb-0" style={{ color: "#424242", fontSize: "0.95rem" }}>
                Manage and resolve civic complaints from your department
              </p>
            </div>
          </div>
        </section>

        {/* Summary Stats Section */}
        <section className="py-3 px-4" style={{ backgroundColor: "#FFFEF7" }}>
          <div className="row g-3">
            <div className="col-6 col-md-3">
              <div className="card border-0 shadow-sm h-100" style={{ borderTop: "4px solid #FFB347" }}>
                <div className="card-body p-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="text-muted" style={{ fontSize: "0.85rem", fontWeight: "500" }}>Total</span>
                    <FiClipboard style={{ color: "#FFB347", fontSize: "1.3rem" }} />
                  </div>
                  <h3 className="mb-0 fw-bold" style={{ color: "#1a1a1a", fontSize: "2rem" }}>{summary.total}</h3>
                  <small className="text-muted">Complaints</small>
                </div>
              </div>
            </div>

            <div className="col-6 col-md-3">
              <div className="card border-0 shadow-sm h-100" style={{ borderTop: "4px solid #FFA07A" }}>
                <div className="card-body p-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="text-muted" style={{ fontSize: "0.85rem", fontWeight: "500" }}>Pending</span>
                    <FiClock style={{ color: "#FFA07A", fontSize: "1.3rem" }} />
                  </div>
                  <h3 className="mb-0 fw-bold" style={{ color: "#1a1a1a", fontSize: "2rem" }}>{summary.pending}</h3>
                  <small className="text-muted">Awaiting Action</small>
                </div>
              </div>
            </div>

            <div className="col-6 col-md-3">
              <div className="card border-0 shadow-sm h-100" style={{ borderTop: "4px solid #64B5F6" }}>
                <div className="card-body p-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="text-muted" style={{ fontSize: "0.85rem", fontWeight: "500" }}>In Progress</span>
                    <FiRefreshCw style={{ color: "#64B5F6", fontSize: "1.3rem" }} />
                  </div>
                  <h3 className="mb-0 fw-bold" style={{ color: "#1a1a1a", fontSize: "2rem" }}>{summary.inProgress}</h3>
                  <small className="text-muted">Being Resolved</small>
                </div>
              </div>
            </div>

            <div className="col-6 col-md-3">
              <div className="card border-0 shadow-sm h-100" style={{ borderTop: "4px solid #4CAF50" }}>
                <div className="card-body p-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="text-muted" style={{ fontSize: "0.85rem", fontWeight: "500" }}>Resolved</span>
                    <FiCheckCircle style={{ color: "#4CAF50", fontSize: "1.3rem" }} />
                  </div>
                  <h3 className="mb-0 fw-bold" style={{ color: "#1a1a1a", fontSize: "2rem" }}>{summary.resolved}</h3>
                  <small className="text-muted">Completed</small>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Complaints List */}
        <section className="py-3 px-4">
          <div className="row g-3">
            {complaints.map((complaint) => {
              const meta = statusMeta[complaint.status] || statusMeta.Pending;
              const StatusIcon = meta.icon;

              return (
                <div key={complaint._id} className="col-12 col-md-6 col-lg-4">
                  <div 
                    className="card border-0 shadow-sm h-100"
                    style={{ 
                      borderRadius: "12px",
                      backgroundColor: meta.surface,
                      transition: "all 0.3s",
                      cursor: "pointer"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
                    }}
                  >
                    <div className="card-body p-4">
                      {/* Header */}
                      <div className="d-flex align-items-start justify-content-between mb-3">
                        <div className="flex-grow-1">
                          <h5 className="mb-2 fw-bold" style={{ color: "#1a1a1a", fontSize: "1.15rem" }}>
                            {complaint.title}
                          </h5>
                          <div className="d-flex flex-wrap gap-2 align-items-center text-muted" style={{ fontSize: "0.85rem" }}>
                            <span className="d-flex align-items-center gap-1">
                              <FiTag size={14} />
                              {complaint.category || "General"}
                            </span>
                            <span>•</span>
                            <span className="d-flex align-items-center gap-1">
                              <FiMapPin size={14} />
                              {complaint.district}
                            </span>
                            <span>•</span>
                            <span className="d-flex align-items-center gap-1">
                              <FiCalendar size={14} />
                              {formatDate(complaint.createdAt)}
                            </span>
                          </div>
                        </div>
                        <span className={`badge ${meta.badgeClass} d-flex align-items-center gap-1 px-3 py-2`}>
                          <StatusIcon size={14} />
                          {complaint.status}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-muted mb-3" style={{ fontSize: "0.95rem", lineHeight: "1.6" }}>
                        {complaint.description}
                      </p>

                      {/* Photo */}
                      {complaint.photo && (
                        <div className="mb-3">
                          <img 
                            src={normalizePhotoUrl(complaint.photo)} 
                            alt="Complaint" 
                            className="img-fluid rounded"
                            style={{ maxHeight: "200px", objectFit: "cover", width: "100%" }}
                          />
                        </div>
                      )}

                      {/* Action Section */}
                      {selectedComplaint === complaint._id ? (
                        <div className="border-top pt-3 mt-3">
                          <h6 className="mb-3 fw-semibold" style={{ color: "#424242" }}>
                            <FiFileText className="me-2" />
                            Update & Add Action Details
                          </h6>
                          
                          {/* Status Selector */}
                          <div className="mb-3">
                            <label className="form-label small fw-semibold text-muted">Change Status</label>
                            <select 
                              className="form-select"
                              defaultValue={complaint.status}
                              id={`status-${complaint._id}`}
                              style={{ borderRadius: "8px" }}
                            >
                              <option value="Pending">Pending</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Resolved">Resolved</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                          </div>

                          {/* Action Description */}
                          <div className="mb-3">
                            <label className="form-label small fw-semibold text-muted">Action Description</label>
                            <textarea
                              className="form-control"
                              rows="3"
                              placeholder="Describe what actions were taken..."
                              value={actionDescription}
                              onChange={(e) => setActionDescription(e.target.value)}
                              style={{ borderRadius: "8px", fontSize: "0.9rem" }}
                            />
                          </div>

                          {/* Photo Upload */}
                          <div className="mb-3">
                            <label className="form-label small fw-semibold text-muted">
                              <FiCamera className="me-1" />
                              Upload Action Photo
                            </label>
                            <input
                              type="file"
                              className="form-control"
                              accept="image/*"
                              onChange={handlePhotoChange}
                              style={{ borderRadius: "8px" }}
                            />
                            {actionPhoto && (
                              <small className="text-success d-block mt-1">
                                ✓ {actionPhoto.name}
                              </small>
                            )}

                            {actionPhotoValidating && (
                              <div className="mt-2 d-flex align-items-center gap-2" style={{ color: "#2196F3", fontSize: "0.9rem" }}>
                                <div className="spinner-border spinner-border-sm" role="status"></div>
                                <span>AI is validating action photo...</span>
                              </div>
                            )}

                            {actionPhotoValidation && !actionPhotoValidating && (
                              <div className={`mt-2 d-flex align-items-center gap-2 p-2 rounded`} 
                                   style={{ 
                                     backgroundColor: actionPhotoValidation.isValid ? '#E8F5E9' : '#FFF3E0',
                                     color: actionPhotoValidation.isValid ? '#2E7D32' : '#F57C00',
                                     fontSize: '0.9rem'
                                   }}>
                                {actionPhotoValidation.isValid ? <FiCheckCircle /> : <FiEye />}
                                <span>
                                  {actionPhotoValidation.message} 
                                  {actionPhotoValidation.confidence > 0 && ` (${actionPhotoValidation.confidence}% confidence)`}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-sm flex-grow-1 fw-semibold"
                              style={{ 
                                backgroundColor: "#FFB347", 
                                color: "#1a1a1a", 
                                border: "none",
                                padding: "0.6rem"
                              }}
                              onClick={() => {
                                const newStatus = document.getElementById(`status-${complaint._id}`).value;
                                handleUpdateStatus(complaint._id, newStatus);
                              }}
                              disabled={updatingStatus === complaint._id}
                            >
                              {updatingStatus === complaint._id ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-2" />
                                  Updating...
                                </>
                              ) : (
                                <>
                                  <FiSend className="me-1" />
                                  Update
                                </>
                              )}
                            </button>
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => {
                                setSelectedComplaint(null);
                                setActionPhoto(null);
                                setActionDescription("");
                              }}
                              style={{ padding: "0.6rem 1rem" }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="border-top pt-3 mt-3">
                          <button
                            className="btn btn-sm w-100 fw-semibold"
                            style={{ 
                              backgroundColor: "#FFB347", 
                              color: "#1a1a1a", 
                              border: "none"
                            }}
                            onClick={() => setSelectedComplaint(complaint._id)}
                          >
                            <FiEye className="me-2" />
                            Manage & Update Status
                          </button>
                        </div>
                      )}

                      {/* Moderator Info */}
                      {complaint.assignedTo && (
                        <div className="mt-3 pt-3 border-top">
                          <small className="text-muted">
                            Assigned to: <strong>{complaint.assignedTo.name || complaint.assignedTo.email || 'Moderator'}</strong>
                          </small>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
