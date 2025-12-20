import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { filterByCategory, filterByStatus, searchComplaints } from "../../utils/filters";
import CitizenSidebar from "../../components/CitizenSidebar";
import NotificationPanel from "../../components/NotificationPanel";
import API from "../../api.js";
import { 
  FiCheckCircle, FiClock, 
  FiSearch, FiFilter, FiAlertCircle, 
  FiInbox, FiTrendingUp, FiBell, FiUser,
  FiSettings, FiGrid, FiLogOut
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

const Dashboard = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [page, setPage] = useState(1);
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
        const storedUser = localStorage.getItem("user");
        const parsedUser = storedUser ? JSON.parse(storedUser) : null;
        const userId = parsedUser?.id || localStorage.getItem("userId") || "";
        const params = userId ? { userId } : {};
        const response = await API.get("/api/complaints", { params });
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
        const response = await fetch('http://localhost:3000/api/notifications', {
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
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotificationCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredComplaints = useMemo(() => {
    let list = filterByCategory(complaints, category);
    list = filterByStatus(list, status);
    list = searchComplaints(list, search);
    return list;
  }, [complaints, category, status, search]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredComplaints.length / PAGE_SIZE)),
    [filteredComplaints.length]
  );

  const paginatedComplaints = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredComplaints.slice(start, start + PAGE_SIZE);
  }, [filteredComplaints, page]);

  useEffect(() => {
    setPage(1);
  }, [search, category, status, complaints.length]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const formatDate = (value) => {
    if (!value) return "Date unavailable";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const statusStyles = {
    Pending: {
      icon: FiClock,
      style: { backgroundColor: "#FFF8F0", color: "#1a1a1a", border: "1px solid #FFB347" }
    },
    "In Progress": {
      icon: FiClock,
      style: { backgroundColor: "#FFE8CC", color: "#1a1a1a", border: "1px solid #FFB347" }
    },
    Resolved: { 
      icon: FiCheckCircle, 
      style: { backgroundColor: "#C8E6C9", color: "#1b5e20", border: "1px solid #4CAF50" }
    },
    Rejected: { 
      icon: FiAlertCircle, 
      style: { backgroundColor: "#FFCDD2", color: "#c62828", border: "1px solid #F44336" }
    }
  };

  return (
    <div className="d-flex" style={{ minHeight: "100vh", backgroundColor: "#f5f7fa" }}>
      <CitizenSidebar />
      <div className="flex-grow-1" style={{ overflow: "auto", backgroundColor: "#f5f7fa" }}>

        {/* Top Navigation Bar */}
        <section className="py-3 px-4 bg-white border-bottom" style={{ position: "sticky", top: 0, zIndex: 100 }}>
          <div className="d-flex align-items-center justify-content-end gap-3">
            <button 
              className="btn btn-light border-0 position-relative"
              style={{ borderRadius: "50%", width: "42px", height: "42px", padding: 0 }}
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <FiBell style={{ fontSize: "1.2rem", color: "#616161" }} />
              {unreadCount > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: "0.65rem" }}>
                  {unreadCount}
                </span>
              )}
            </button>
            <div className="position-relative">
              <button 
                className="btn btn-light border-0 d-flex align-items-center gap-2"
                style={{ borderRadius: "10px", padding: "0.5rem 0.75rem" }}
                onClick={() => setShowUserDropdown(!showUserDropdown)}
              >
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center bg-warning"
                  style={{ width: "32px", height: "32px" }}
                >
                  <FiUser style={{ color: "white", fontSize: "1rem" }} />
                </div>
                <span className="fw-semibold" style={{ fontSize: "0.9rem", color: "#424242" }}>
                  {localStorage.getItem("userName") || "User"}
                </span>
              </button>
              {showUserDropdown && (
                <div 
                  className="position-absolute end-0 mt-2 bg-white shadow-lg rounded-3"
                  style={{ width: "200px", zIndex: 1000, border: "1px solid #e0e0e0" }}
                >
                  <div className="py-2">
                    <button
                      className="btn btn-light w-100 text-start d-flex align-items-center gap-2 border-0"
                      style={{ fontSize: "0.9rem", padding: "0.6rem 1rem" }}
                      onClick={() => { navigate('/user-profile'); setShowUserDropdown(false); }}
                    >
                      <FiUser /> My Profile
                    </button>
                    <button
                      className="btn btn-light w-100 text-start d-flex align-items-center gap-2 border-0"
                      style={{ fontSize: "0.9rem", padding: "0.6rem 1rem" }}
                      onClick={() => { navigate('/settings'); setShowUserDropdown(false); }}
                    >
                      <FiSettings /> Settings
                    </button>
                    <button
                      className="btn btn-light w-100 text-start d-flex align-items-center gap-2 border-0"
                      style={{ fontSize: "0.9rem", padding: "0.6rem 1rem" }}
                      onClick={() => { navigate('/track-issue'); setShowUserDropdown(false); }}
                    >
                      <FiGrid /> Track Issue
                    </button>
                    <hr className="my-2" />
                    <button
                      className="btn btn-light w-100 text-start d-flex align-items-center gap-2 border-0 text-danger"
                      style={{ fontSize: "0.9rem", padding: "0.6rem 1rem" }}
                      onClick={() => {
                        localStorage.clear();
                        navigate('/login');
                      }}
                    >
                      <FiLogOut /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Hero Balance Section */}
        <section className="py-4 px-4">
          <div 
            className="card border-0 shadow-sm position-relative overflow-hidden" 
            style={{ 
              background: "linear-gradient(135deg, #FFB347 0%, #FFD8A8 50%, #FFE4C4 100%)",
              borderRadius: "20px",
              minHeight: "200px"
            }}
          >
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                  <p className="mb-1 text-white opacity-75" style={{ fontSize: "0.9rem", fontWeight: "500" }}>Total Complaints</p>
                  <h1 className="mb-0 text-white fw-bold" style={{ fontSize: "3rem", letterSpacing: "-1px" }}>{totalComplaints}</h1>
                  <p className="mb-0 text-white mt-2" style={{ fontSize: "0.85rem", fontWeight: "500" }}>
                    <FiTrendingUp className="me-1" />
                    <span className="opacity-90">{((resolvedCount / (totalComplaints || 1)) * 100).toFixed(1)}% </span>
                    <span className="opacity-75">resolution rate</span>
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
                        <p className="mb-0 text-muted" style={{ fontSize: "0.8rem", fontWeight: "500" }}>All Issues</p>
                      </div>
                      <h4 className="mb-1 fw-bold" style={{ fontSize: "1.75rem" }}>{totalComplaints}</h4>
                      <p className="mb-0 small text-muted" style={{ fontSize: "0.75rem" }}>Last 30 days</p>
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
                        <p className="mb-0 text-muted" style={{ fontSize: "0.8rem", fontWeight: "500" }}>Processing</p>
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
                placeholder="Search complaints..."
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

        {/* Recent Activity Section */}
        <section className="px-4 pb-4">
          <div className="card border-0 shadow-sm" style={{ borderRadius: "15px" }}>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0 fw-semibold" style={{ color: "#1a1a1a" }}>Recent Activity</h5>
                <span className="text-muted small">
                  {filteredComplaints.length} {filteredComplaints.length === 1 ? 'complaint' : 'complaints'}
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
                      : "Submit your first complaint to get started"}
                  </p>
                </div>
              ) : (
                <>
                  {paginatedComplaints.map((complaint, index) => {
                    const statusConfig = statusStyles[complaint.status] || statusStyles.Pending;
                    const StatusIcon = statusConfig.icon;

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
                              <span className="text-muted small">{formatDate(complaint.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="d-flex align-items-center gap-3">
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
      
      <NotificationPanel 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
    </div>
  );
};

export default Dashboard;



