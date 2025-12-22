import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { filterByCategory, filterByStatus, searchComplaints } from "../../utils/filters";
import CitizenSidebar from "../../components/CitizenSidebar";
import NotificationPanel from "../../components/NotificationPanel";
import API from "../../api.js";
import { 
  FiCheckCircle, FiClock, 
  FiSearch, FiFilter, FiAlertCircle, 
  FiFlag, FiMapPin, FiInbox, FiThumbsUp, FiThumbsDown,
  FiBell, FiUser, FiSettings, FiGrid, FiLogOut, FiX
} from 'react-icons/fi';

const categories = [
  "All",
  "Sanitization",
  "Cleanliness",
  "Electricity",
  "Road",
  "Water",
  "Public Safety",
];

const statuses = ["All", "Pending", "In Progress", "Resolved", "Rejected"];

const NearbyComplaints = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [page, setPage] = useState(1);
  const [userDistrict, setUserDistrict] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [voteNote, setVoteNote] = useState("");
  const [voteSubmitting, setVoteSubmitting] = useState(false);
  const [voteError, setVoteError] = useState("");
  const [voteSuccess, setVoteSuccess] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const PAGE_SIZE = 5;

  const { totalComplaints, resolvedCount, inProgressCount } = useMemo(() => {
    const total = complaints.length;
    const resolved = complaints.filter((c) => c.status === "Resolved").length;
    const inProgress = complaints.filter((c) => ["Pending", "In Progress"].includes(c.status)).length;
    return { totalComplaints: total, resolvedCount: resolved, inProgressCount: inProgress };
  }, [complaints]);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        setLoading(true);
        setError("");
        
        // Fetch user profile to get district
        const token = localStorage.getItem("token");
        const profileRes = await API.get("/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const district = profileRes.data.user?.location || "your area";
        setUserDistrict(district);

        // District-scoped feed for citizens
        const response = await API.get("/api/complaints", { params: { scope: 'district' } });
        setComplaints(response.data?.data || []);
      } catch (err) {
        console.error("Failed fetching complaints:", err);
        setError(err.response?.data?.error || "Unable to load complaints. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  // Fetch notification count
  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'https://samaaj-backend-kj3r.onrender.com'}/api/notifications`, {
            credentials: 'include'
          });
        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotificationCount();
    const interval = setInterval(fetchNotificationCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, category, status, complaints.length]);

  const filteredComplaints = useMemo(() => {
    let list = filterByCategory(complaints, category);
    list = filterByStatus(list, status);
    list = searchComplaints(list, search);
    return list;
  }, [complaints, category, status, search]);

  const paginatedComplaints = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredComplaints.slice(start, start + PAGE_SIZE);
  }, [filteredComplaints, page]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredComplaints.length / PAGE_SIZE)),
    [filteredComplaints.length]
  );

  const formatDate = (value) => {
    if (!value) return "Date unavailable";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);
  const statusStyles = {
    Pending: {
      icon: FiClock,
      className: "",
      style: { backgroundColor: "#FFF8F0", color: "#1a1a1a", border: "1px solid #FFB347" }
    },
    "In Progress": {
      icon: FiClock,
      className: "",
      style: { backgroundColor: "#FFE8CC", color: "#1a1a1a", border: "1px solid #FFB347" }
    },
    Resolved: { icon: FiCheckCircle, className: "bg-success", style: {} },
    Rejected: { icon: FiAlertCircle, className: "bg-danger", style: {} }
  };

  const currentUserId = useMemo(() => {
    if (typeof window === "undefined") return "";
    try {
      const storedUser = window.localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed?.id) return String(parsed.id);
      }

      const fallback = window.localStorage.getItem("userId");
      if (fallback) return String(fallback);
    } catch (_) {
      return "";
    }
    return "";
  }, []);

  const userValidation = useMemo(() => {
    if (!selectedComplaint || !currentUserId) return null;
    return (selectedComplaint.communityValidations || []).find(
      (entry) => String(entry?.userId || "") === String(currentUserId)
    ) || null;
  }, [selectedComplaint, currentUserId]);

  const orderedCommunityNotes = useMemo(() => {
    if (!selectedComplaint?.communityValidations) return [];
    return [...selectedComplaint.communityValidations].sort(
      (a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0)
    );
  }, [selectedComplaint]);

  const textualCommunityNotes = useMemo(
    () => orderedCommunityNotes.filter((entry) => entry?.note?.trim()),
    [orderedCommunityNotes]
  );

  useEffect(() => {
    if (!selectedComplaint) {
      setVoteNote("");
      setVoteError("");
      setVoteSuccess("");
      return;
    }

    setVoteNote(userValidation?.note || "");
    setVoteError("");
    setVoteSuccess("");
  }, [selectedComplaint, userValidation]);

  useEffect(() => {
    if (!selectedComplaint) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedComplaint(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedComplaint]);

  const hasUserSupport = Boolean(userValidation);

  const handleOpenComplaint = (complaint) => {
    setSelectedComplaint(complaint);
  };

  const handleCloseModal = () => {
    setSelectedComplaint(null);
  };

  const handleNoteChange = (event) => {
    const value = event?.target?.value ?? "";
    setVoteNote(value.slice(0, 500));
    if (voteError) setVoteError("");
    if (voteSuccess) setVoteSuccess("");
  };

  const submitSupport = async (noteValue = voteNote) => {
    if (!selectedComplaint) return;
    if (!currentUserId) {
      setVoteError("Please sign in to support this issue.");
      return;
    }

    setVoteSubmitting(true);
    setVoteError("");
    setVoteSuccess("");

    try {
      const response = await API.post(`/api/complaints/${selectedComplaint._id}/community-validate`, {
        note: noteValue
      });

      const updated = response.data?.data;
      if (updated) {
        setComplaints((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
        setSelectedComplaint(updated);
      }

      setVoteSuccess(response.data?.message || "Support recorded.");
    } catch (err) {
      setVoteError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Unable to record support. Please try again."
      );
    } finally {
      setVoteSubmitting(false);
    }
  };

  const handleVoteSubmit = async (event) => {
    event?.preventDefault?.();
    await submitSupport(voteNote);
  };

  const handleQuickSupport = () => {
    submitSupport("");
  };

  const handleWithdrawSupport = async () => {
    if (!selectedComplaint) return;
    if (!currentUserId) {
      setVoteError("Please sign in to update your support.");
      return;
    }

    setVoteSubmitting(true);
    setVoteError("");
    setVoteSuccess("");

    try {
      const response = await API.delete(`/api/complaints/${selectedComplaint._id}/community-validate`);
      const updated = response.data?.data;

      if (updated) {
        setComplaints((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
        setSelectedComplaint(updated);
        setVoteNote("");
      }

      setVoteSuccess("Support removed.");
    } catch (err) {
      setVoteError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Unable to remove support. Please try again."
      );
    } finally {
      setVoteSubmitting(false);
    }
  };

  const handleLike = async (complaintId, e) => {
    if (e) {
      e.stopPropagation();
    }
    
    try {
      const response = await API.post(`/api/complaints/${complaintId}/like`);
      const updated = response.data?.data;

      if (updated) {
        setComplaints((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
        if (selectedComplaint && selectedComplaint._id === updated._id) {
          setSelectedComplaint(updated);
        }
      }
    } catch (err) {
      console.error('Error liking complaint:', err);
    }
  };

  const handleDislike = async (complaintId, e) => {
    if (e) {
      e.stopPropagation();
    }
    
    try {
      const response = await API.post(`/api/complaints/${complaintId}/dislike`);
      const updated = response.data?.data;

      if (updated) {
        setComplaints((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
        if (selectedComplaint && selectedComplaint._id === updated._id) {
          setSelectedComplaint(updated);
        }
      }
    } catch (err) {
      console.error('Error disliking complaint:', err);
    }
  };

  return (
    <div className="d-flex" style={{ minHeight: "100vh", backgroundColor: "#f5f7fa" }}>
      <CitizenSidebar />
      <div className="flex-grow-1" style={{ overflow: "auto", backgroundColor: "#f5f7fa" }}>

        {/* Hero Section */}
        <section className="py-4 px-4">
          <div 
            className="card border-0 shadow-sm position-relative overflow-hidden" 
            style={{ 
              background: "linear-gradient(135deg, #FFB347 0%, #FFA07A 50%, #FFD8A8 100%)",
              borderRadius: "20px",
              minHeight: "200px"
            }}
          >
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                  <p className="mb-1 text-white opacity-75" style={{ fontSize: "0.9rem", fontWeight: "500" }}>
                    <FiMapPin className="me-1" />
                    Nearby Issues
                  </p>
                  <h1 className="mb-0 text-white fw-bold" style={{ fontSize: "3rem", letterSpacing: "-1px" }}>{totalComplaints}</h1>
                  <p className="mb-0 text-white mt-2" style={{ fontSize: "0.85rem", fontWeight: "500" }}>
                    <span className="opacity-90">in {userDistrict || "your area"}</span>
                  </p>
                </div>
              </div>
            </div>
            <div style={{ 
              position: "absolute", 
              width: "300px", 
              height: "300px", 
              borderRadius: "50%", 
              background: "rgba(255,255,255,0.08)",
              right: "-100px",
              bottom: "-100px"
            }}></div>
            <div style={{ 
              position: "absolute", 
              width: "150px", 
              height: "150px", 
              borderRadius: "50%", 
              background: "rgba(255,255,255,0.06)",
              right: "50px",
              top: "-50px"
            }}></div>
          </div>
        </section>

        {/* Quick Stats Cards */}
        <section className="px-4 pb-4">
          <div className="row g-3">
            <div className="col-md-4">
              <div className="card border-0 shadow-sm" style={{ borderRadius: "15px", borderLeft: "4px solid #FFB347" }}>
                <div className="card-body p-3">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#FFB347" }}></div>
                        <p className="mb-0 text-muted" style={{ fontSize: "0.8rem", fontWeight: "500" }}>Total Issues</p>
                      </div>
                      <h4 className="mb-1 fw-bold" style={{ fontSize: "1.75rem" }}>{totalComplaints}</h4>
                      <p className="mb-0 small text-muted" style={{ fontSize: "0.75rem" }}>In your area</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card border-0 shadow-sm" style={{ borderRadius: "15px", borderLeft: "4px solid #4CAF50" }}>
                <div className="card-body p-3">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#4CAF50" }}></div>
                        <p className="mb-0 text-muted" style={{ fontSize: "0.8rem", fontWeight: "500" }}>Resolved</p>
                      </div>
                      <h4 className="mb-1 fw-bold" style={{ fontSize: "1.75rem" }}>{resolvedCount}</h4>
                      <p className="mb-0 small" style={{ fontSize: "0.75rem", color: "#4CAF50" }}>
                        ↑ {((resolvedCount / (totalComplaints || 1)) * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card border-0 shadow-sm" style={{ borderRadius: "15px", borderLeft: "4px solid #FF9800" }}>
                <div className="card-body p-3">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#FF9800" }}></div>
                        <p className="mb-0 text-muted" style={{ fontSize: "0.8rem", fontWeight: "500" }}>Active</p>
                      </div>
                      <h4 className="mb-1 fw-bold" style={{ fontSize: "1.75rem" }}>{inProgressCount}</h4>
                      <p className="mb-0 small text-muted" style={{ fontSize: "0.75rem" }}>In progress</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Search and Filters Section */}
        <section className="px-4 pb-3">
          <div className="d-flex gap-3 align-items-center flex-wrap">
            <div className="input-group" style={{ maxWidth: "350px" }}>
              <span className="input-group-text bg-white border-end-0" style={{ borderColor: "#e0e0e0", borderRadius: "10px 0 0 10px" }}>
                <FiSearch style={{ color: "#9e9e9e", fontSize: "1.1rem" }} />
              </span>
              <input
                type="text"
                className="form-control border-start-0 shadow-none"
                placeholder="Search issues..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ borderColor: "#e0e0e0", borderRadius: "0 10px 10px 0", fontSize: "0.9rem" }}
              />
            </div>
            <div className="d-flex gap-2 align-items-center">
              <div className="d-flex align-items-center gap-2">
                <label className="text-muted fw-semibold mb-0" style={{ fontSize: "0.85rem" }}>Category:</label>
                <select
                  className="form-select shadow-sm border-0"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ width: "160px", borderRadius: "10px", fontSize: "0.9rem", fontWeight: "500" }}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div className="d-flex align-items-center gap-2">
                <label className="text-muted fw-semibold mb-0" style={{ fontSize: "0.85rem" }}>Status:</label>
                <select
                  className="form-select shadow-sm border-0"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={{ width: "150px", borderRadius: "10px", fontSize: "0.9rem", fontWeight: "500" }}
                >
                  {statuses.map((stat) => (
                    <option key={stat} value={stat}>
                      {stat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Community Issues Section */}
        <section className="px-4 pb-4">
          <div className="card border-0 shadow-sm" style={{ borderRadius: "15px" }}>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0 fw-semibold" style={{ color: "#1a1a1a" }}>Community Issues</h5>
                <span className="text-muted small">
                  {filteredComplaints.length} {filteredComplaints.length === 1 ? 'issue' : 'issues'}
                </span>
              </div>
              {error && (
                <div className="alert alert-danger border-0 mb-3" role="alert">
                  {error}
                </div>
              )}
              {loading && (
                <div className="text-center py-4">
                  <div className="spinner-border" style={{ color: "#FFB347" }} role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              )}
              {!loading && filteredComplaints.length === 0 ? (
                <div className="text-center py-5">
                  <FiInbox style={{ fontSize: "3rem", color: "#e0e0e0", marginBottom: "1rem" }} />
                  <h6 className="fw-semibold text-muted">No complaints found</h6>
                  <p className="text-muted small mb-0">
                    {search || category !== "All" || status !== "All" 
                      ? "Try adjusting your filters" 
                      : "No complaints in your district yet"}
                  </p>
                </div>
              ) : (
                <>
                  {paginatedComplaints.map((complaint, index) => {
                    const statusConfig = statusStyles[complaint.status] || statusStyles.Pending;
                    const StatusIcon = statusConfig.icon;
                    const supportCount = complaint.communityValidations?.length || 0;

                    return (
                      <div 
                        key={complaint._id} 
                        className="d-flex justify-content-between align-items-center py-3"
                        style={{ 
                          borderBottom: index < paginatedComplaints.length - 1 ? "1px solid #f0f0f0" : "none",
                          cursor: "pointer",
                          transition: "background 0.2s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#fafafa"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                        onClick={() => handleOpenComplaint(complaint)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            handleOpenComplaint(complaint);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="d-flex align-items-center gap-3 flex-grow-1">
                          <div 
                            className="rounded-circle d-flex align-items-center justify-content-center"
                            style={{ 
                              width: "45px", 
                              height: "45px", 
                              backgroundColor: "#FFF8F0",
                              flexShrink: 0
                            }}
                          >
                            <StatusIcon style={{ fontSize: "1.2rem", color: "#FFB347" }} />
                          </div>
                          <div className="flex-grow-1" style={{ minWidth: 0 }}>
                            <div className="fw-semibold text-truncate mb-1" style={{ fontSize: "0.95rem" }}>
                              {complaint.title}
                            </div>
                            <div className="d-flex gap-2 align-items-center">
                              <span className="text-muted small">{complaint.category}</span>
                              <span style={{ color: "#e0e0e0" }}>•</span>
                              <span className="text-muted small">
                                <FiMapPin size={12} className="me-1" />
                                {complaint.district || complaint.location || "Unknown"}
                              </span>
                              <span style={{ color: "#e0e0e0" }}>•</span>
                              <span className="text-muted small">{formatDate(complaint.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="d-flex align-items-center gap-3">
                          <div className="d-flex align-items-center gap-2">
                            <button
                              className="btn btn-sm d-flex align-items-center gap-1"
                              style={{
                                backgroundColor: complaint.likes?.includes(currentUserId) ? "#FFB347" : "#f5f5f5",
                                color: complaint.likes?.includes(currentUserId) ? "white" : "#666",
                                border: "none",
                                borderRadius: "8px",
                                padding: "0.35rem 0.6rem"
                              }}
                              onClick={(e) => handleLike(complaint._id, e)}
                            >
                              <FiThumbsUp size={14} />
                              <span style={{ fontSize: "0.8rem" }}>{complaint.likes?.length || 0}</span>
                            </button>
                            <button
                              className="btn btn-sm d-flex align-items-center gap-1"
                              style={{
                                backgroundColor: complaint.dislikes?.includes(currentUserId) ? "#f44336" : "#f5f5f5",
                                color: complaint.dislikes?.includes(currentUserId) ? "white" : "#666",
                                border: "none",
                                borderRadius: "8px",
                                padding: "0.35rem 0.6rem"
                              }}
                              onClick={(e) => handleDislike(complaint._id, e)}
                            >
                              <FiThumbsDown size={14} />
                              <span style={{ fontSize: "0.8rem" }}>{complaint.dislikes?.length || 0}</span>
                            </button>
                          </div>
                          <span 
                            className="badge px-3 py-2"
                            style={{ 
                              backgroundColor: statusConfig.style.backgroundColor,
                              color: statusConfig.style.color,
                              border: statusConfig.style.border,
                              borderRadius: "8px",
                              fontSize: "0.75rem",
                              fontWeight: "500"
                            }}
                          >
                            {complaint.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {filteredComplaints.length > PAGE_SIZE && (
                    <div className="d-flex justify-content-between align-items-center pt-3">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </button>
                      <span className="text-muted small">
                        Page {page} of {totalPages}
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={page === totalPages}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>
      </div>
      {selectedComplaint && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100"
          style={{ backgroundColor: "rgba(0,0,0,0.45)", zIndex: 1050 }}
          onClick={handleCloseModal}
        >
          <div className="d-flex align-items-center justify-content-center w-100 h-100">
            <div
              className="card shadow-lg"
              style={{ maxWidth: "500px", width: "92%", borderRadius: "18px", maxHeight: "85vh", overflowY: "auto" }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="flex-grow-1">
                    <p className="text-muted small mb-1">{selectedComplaint.category}</p>
                    <h4 className="fw-bold mb-1" style={{ color: "#1a1a1a" }}>{selectedComplaint.title}</h4>
                    <div className="d-flex flex-wrap gap-2 text-muted small">
                      <span><FiMapPin className="me-1" />{selectedComplaint.district || selectedComplaint.location || "Unknown location"}</span>
                      <span>•</span>
                      <span>{formatDate(selectedComplaint.createdAt)}</span>
                    </div>
                  </div>
                  <div className="d-flex flex-column align-items-end gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-light"
                      style={{ borderRadius: "50%", width: "32px", height: "32px", padding: 0, border: "1px solid #ddd" }}
                      onClick={handleCloseModal}
                    >
                      <FiX size={18} />
                    </button>
                    <span
                      className="badge px-3 py-2"
                      style={{
                        backgroundColor: (statusStyles[selectedComplaint.status]?.style?.backgroundColor) || "#FFF8F0",
                        color: (statusStyles[selectedComplaint.status]?.style?.color) || "#1a1a1a",
                        border: (statusStyles[selectedComplaint.status]?.style?.border) || "1px solid #FFB347",
                        borderRadius: "8px"
                      }}
                    >
                      {selectedComplaint.status}
                    </span>
                  </div>
                </div>

                {selectedComplaint.description && (
                  <p className="text-muted mb-3" style={{ lineHeight: 1.6 }}>
                    {selectedComplaint.description}
                  </p>
                )}

                {selectedComplaint.photo && (
                  <div className="mb-4">
                    <img
                      src={`${import.meta.env.VITE_BACKEND_URL || 'https://samaaj-backend-kj3r.onrender.com'}/${selectedComplaint.photo}`}
                      alt={selectedComplaint.title}
                      className="img-fluid rounded-3"
                      style={{ 
                        maxHeight: "300px", 
                        width: "100%", 
                        objectFit: "cover",
                        border: "2px solid #f0f0f0"
                      }}
                    />
                  </div>
                )}

                <div className="d-flex align-items-center gap-2 mb-4">
                  <button
                    type="button"
                    className="btn d-flex align-items-center gap-2"
                    style={{
                      backgroundColor: selectedComplaint.likes?.includes(currentUserId) ? "#FFB347" : "#f5f5f5",
                      color: selectedComplaint.likes?.includes(currentUserId) ? "white" : "#666",
                      border: "none",
                      borderRadius: "10px",
                      padding: "0.6rem 1rem"
                    }}
                    onClick={() => handleLike(selectedComplaint._id)}
                  >
                    <FiThumbsUp size={20} />
                    <span className="fw-semibold">{selectedComplaint.likes?.length || 0} Like{selectedComplaint.likes?.length !== 1 ? 's' : ''}</span>
                  </button>
                  <button
                    type="button"
                    className="btn d-flex align-items-center gap-2"
                    style={{
                      backgroundColor: selectedComplaint.dislikes?.includes(currentUserId) ? "#f44336" : "#f5f5f5",
                      color: selectedComplaint.dislikes?.includes(currentUserId) ? "white" : "#666",
                      border: "none",
                      borderRadius: "10px",
                      padding: "0.6rem 1rem"
                    }}
                    onClick={() => handleDislike(selectedComplaint._id)}
                  >
                    <FiThumbsDown size={20} />
                    <span className="fw-semibold">{selectedComplaint.dislikes?.length || 0} Dislike{selectedComplaint.dislikes?.length !== 1 ? 's' : ''}</span>
                  </button>
                </div>

                <div>
                  <label className="form-label fw-semibold" style={{ color: "#424242" }}>
                    Add a quick note (optional)
                  </label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={voteNote}
                    onChange={handleNoteChange}
                    maxLength={500}
                    placeholder="Share why this issue matters or what you observed."
                    style={{ borderRadius: "12px", border: "2px solid #e0e0e0" }}
                    onBlur={() => {
                      if (voteNote.trim() && voteNote.trim() !== (userValidation?.note || "")) {
                        submitSupport(voteNote.trim());
                      }
                    }}
                  />
                </div>

                {voteError && (
                  <div className="alert alert-danger mt-3 mb-0" role="alert">
                    {voteError}
                  </div>
                )}
                {voteSuccess && (
                  <div className="alert alert-success mt-3 mb-0" role="alert">
                    {voteSuccess}
                  </div>
                )}

                {textualCommunityNotes.length > 0 && (
                  <div className="mt-4">
                    <p className="fw-semibold small text-muted mb-2">Community validation</p>
                    <div className="d-flex flex-column gap-2" style={{ maxHeight: "180px", overflowY: "auto" }}>
                      {textualCommunityNotes
                        .slice(0, 6)
                        .map((entry) => (
                          <div key={`${entry?.userId}-${entry?.createdAt}`} className="p-3 bg-light rounded-3">
                            <p className="mb-1 text-muted small">
                              #{String(entry?.userId || "").slice(-6)} • {formatDate(entry?.createdAt)}
                            </p>
                            <p className="mb-0" style={{ lineHeight: 1.5 }}>{entry.note}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <NotificationPanel 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
    </div>
  );
};

export default NearbyComplaints;



