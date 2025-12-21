import React, { useEffect, useMemo, useState } from "react";
import { toastError } from "../../utils/toast";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ModeratorSidebar from "../../components/ModeratorSidebar";
import { 
  FiClipboard, FiCheckCircle, FiClock, 
  FiSearch, FiFilter, FiAlertCircle, 
  FiEye, FiInbox, FiTrendingUp, FiUser,
  FiSettings, FiGrid, FiLogOut
} from 'react-icons/fi';

const ModeratorDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [moderatorDept, setModeratorDept] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total: 0,
    resolved: 0,
    processing: 0
  });

  const fetchComplaints = (token) => {
    setLoading(true);
    axios
      .get("http://localhost:3000/api/complaints/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        console.log("Complaints response:", res.data);
        const data = res.data.data || res.data;
        setComplaints(data);
        setFilteredComplaints(data);
        
        // Calculate stats
        const total = data.length;
        const resolved = data.filter(c => c.status === 'Resolved').length;
        const processing = data.filter(c => c.status === 'In Progress').length;
        setStats({ total, resolved, processing });
      })
      .catch((err) => {
        console.error("Error fetching complaints:", err.response?.data || err.message);
        console.error("Status code:", err.response?.status);
        
        if (err.response?.status === 401) {
          toastError("Your session has expired. Please login again.");
          localStorage.clear();
          window.location.href = "/login";
        } else if (err.response?.status === 403) {
          toastError(err.response?.data?.message || "You don't have permission to view these complaints.");
        } else {
          toastError("Failed to load complaints. Please try again.");
        }
      })
      .finally(() => setLoading(false));
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const updateStatus = async (complaintId, newStatus) => {
    try {
      setUpdating(complaintId);
      const token = localStorage.getItem("token");
      console.log('Updating status:', { complaintId, newStatus, userEmail: user.email });

      const response = await axios.patch(`http://localhost:3000/api/complaints/update-status/${complaintId}`, {
        status: newStatus,
        moderatorEmail: user.email
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      console.log('Update response:', response.data);
      // Refresh complaints after update
      fetchComplaints(token);
    } catch (error) {
      console.error("Error updating status:", error.response?.data || error.message);
      toastError(error.response?.data?.message || "Failed to update status. Please try again.");
    } finally {
      setUpdating(null);
    }
  };

  const assignToMe = async (complaintId) => {
    try {
      setUpdating(complaintId);
      const token = localStorage.getItem("token");
      await axios.post(`http://localhost:3000/api/complaints/assign/${complaintId}`, {
        moderatorEmail: user.email
      }, { headers: { Authorization: `Bearer ${token}` } });
      fetchComplaints(token);
    } catch (error) {
      console.error('Error assigning complaint:', error.response?.data || error.message);
      toastError(error.response?.data?.message || 'Failed to assign complaint');
    } finally {
      setUpdating(null);
    }
  };

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");
    
    console.log("Stored user:", storedUser);
    console.log("Token exists:", !!token);
    
    setUser(storedUser);

    if (!storedUser || !token || !/moderator/i.test(storedUser.role || '')) {
      toastError("Please login as a moderator");
      window.location.href = "/login";
      return;
    }

    // Fetch moderator profile to get department info (non-blocking)
    axios
      .get("http://localhost:3000/profile", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        console.log("Profile response:", res.data);
        const deptData = res.data.user?.department;
        
        // Handle department - if it's an object with name, use it; if it's a string ID, fetch departments
        if (deptData) {
          if (typeof deptData === 'object' && deptData.name) {
            setModeratorDept(deptData.name);
          } else if (typeof deptData === 'string') {
            // Fetch departments list to map ID to name
            axios.get("http://localhost:3000/api/complaints/departments")
              .then(deptRes => {
                const dept = deptRes.data.find(d => d._id === deptData);
                setModeratorDept(dept ? dept.name : deptData);
              })
              .catch(() => setModeratorDept(deptData));
          }
        } else {
          setModeratorDept("Unknown");
        }
      })
      .catch((err) => {
        console.error("Error fetching profile:", err.response?.data || err.message);
        // Use department from stored user if profile fetch fails
        setModeratorDept(storedUser.department || "Unknown");
      });

    // Fetch complaints using moderator-view (department-scoped)
    axios.get('http://localhost:3000/api/complaints/moderator-view', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        const data = res.data.data || res.data || [];
        setComplaints(data);
        setFilteredComplaints(data);
        const total = data.length;
        const resolved = data.filter(c => c.status === 'Resolved').length;
        const processing = data.filter(c => c.status === 'In Progress').length;
        setStats({ total, resolved, processing });
      })
      .catch(err => {
        console.error('Error fetching moderator complaints:', err.response?.data || err.message);
        if (err.response?.status === 401) {
          toastError('Your session has expired. Please login again.');
          localStorage.clear();
          window.location.href = '/login';
        } else if (err.response?.status === 403) {
          toastError(err.response?.data?.message || "You don't have permission to view these complaints.");
        } else {
          toastError('Failed to load complaints. Please try again.');
        }
      });
  }, []);

  // Filter complaints based on search and filters
  useEffect(() => {
    let filtered = [...complaints];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "All") {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== "All") {
      filtered = filtered.filter(c => c.category === categoryFilter);
    }

    setFilteredComplaints(filtered);
  }, [searchTerm, statusFilter, categoryFilter, complaints]);

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
      <ModeratorSidebar />
      <div className="flex-grow-1" style={{ overflow: "auto", backgroundColor: "#f5f7fa" }}>

        {/* Top Navigation Bar */}
        <section className="py-3 px-4 bg-white border-bottom" style={{ position: "sticky", top: 0, zIndex: 100 }}>
          <div className="d-flex align-items-center justify-content-end gap-3">
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
                  {localStorage.getItem("userName") || "Moderator"}
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
                      onClick={() => { navigate('/moderator-profile'); setShowUserDropdown(false); }}
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
                      onClick={() => { navigate('/moderator-complaints'); setShowUserDropdown(false); }}
                    >
                      <FiGrid /> Complaints
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
                  <h1 className="mb-0 text-white fw-bold" style={{ fontSize: "3rem", letterSpacing: "-1px" }}>{stats.total}</h1>
                  <p className="mb-0 text-white mt-2" style={{ fontSize: "0.85rem", fontWeight: "500" }}>
                    <FiTrendingUp className="me-1" />
                    <span className="opacity-90">{((stats.resolved / (stats.total || 1)) * 100).toFixed(1)}% </span>
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
                      <h4 className="mb-1 fw-bold" style={{ fontSize: "1.75rem" }}>{stats.total}</h4>
                      <p className="mb-0 small text-muted" style={{ fontSize: "0.75rem" }}>Total complaints</p>
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
                      <h4 className="mb-1 fw-bold" style={{ fontSize: "1.75rem" }}>{stats.resolved}</h4>
                      <p className="mb-0 small" style={{ fontSize: "0.75rem", color: "#4CAF50" }}>
                        ↑ {((stats.resolved / (stats.total || 1)) * 100).toFixed(0)}%
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
                        <p className="mb-0 text-muted" style={{ fontSize: "0.8rem", fontWeight: "500" }}>In Progress</p>
                      </div>
                      <h4 className="mb-1 fw-bold" style={{ fontSize: "1.75rem" }}>{stats.processing}</h4>
                      <p className="mb-0 small text-muted" style={{ fontSize: "0.75rem" }}>Active cases</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Search and Filters */}
        <section className="px-4 pb-3">
          <div className="card border-0 shadow-sm" style={{ borderRadius: "15px" }}>
            <div className="card-body p-3">
              <div className="d-flex gap-3 align-items-center flex-wrap">
                <div className="flex-grow-1" style={{ minWidth: "250px", maxWidth: "400px" }}>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0" style={{ borderColor: "#e0e0e0", borderRadius: "8px 0 0 8px" }}>
                      <FiSearch style={{ color: "#9e9e9e", fontSize: "1.1rem" }} />
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0 shadow-none"
                      placeholder="Search complaints..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ borderColor: "#e0e0e0", borderRadius: "0 8px 8px 0", fontSize: "0.9rem" }}
                    />
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <label className="text-muted fw-semibold mb-0" style={{ fontSize: "0.85rem" }}>Category:</label>
                  <select
                    className="form-select shadow-sm border-0"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    style={{ width: "160px", borderRadius: "10px", fontSize: "0.9rem", fontWeight: "500" }}
                  >
                    <option value="All">All</option>
                    <option value="Sanitization">Sanitization</option>
                    <option value="Cleanliness">Cleanliness</option>
                    <option value="Electricity">Electricity</option>
                    <option value="Road">Road</option>
                    <option value="Water">Water</option>
                    <option value="Public Safety">Public Safety</option>
                  </select>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <label className="text-muted fw-semibold mb-0" style={{ fontSize: "0.85rem" }}>Status:</label>
                  <select
                    className="form-select shadow-sm border-0"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ width: "150px", borderRadius: "10px", fontSize: "0.9rem", fontWeight: "500" }}
                  >
                    <option value="All">All</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Complaints List */}
        <section className="px-4 pb-4">
          <div className="card border-0 shadow-sm" style={{ borderRadius: "15px" }}>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0 fw-semibold" style={{ color: "#1a1a1a" }}>All Complaints</h5>
                <span className="text-muted small">
                  {filteredComplaints.length} {filteredComplaints.length === 1 ? 'complaint' : 'complaints'}
                </span>
              </div>
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border" style={{ color: "#FFB347" }} role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : filteredComplaints.length === 0 ? (
                <div className="text-center py-5">
                  <FiInbox style={{ fontSize: "3rem", color: "#e0e0e0", marginBottom: "1rem" }} />
                  <h6 className="fw-semibold text-muted">No complaints found</h6>
                  <p className="text-muted small mb-0">
                    {searchTerm || categoryFilter !== "All" || statusFilter !== "All" 
                      ? "Try adjusting your filters" 
                      : "No complaints available"}
                  </p>
                </div>
              ) : (
                <>
                  {filteredComplaints.map((complaint, index) => {
                    const statusConfig = statusStyles[complaint.status] || statusStyles.Pending;
                    const StatusIcon = statusConfig.icon;
                    
                    return (
                      <div 
                        key={complaint._id} 
                        className="d-flex justify-content-between align-items-center py-3"
                        style={{ 
                          borderBottom: index < filteredComplaints.length - 1 ? "1px solid #f0f0f0" : "none",
                          cursor: "pointer"
                        }}
                        onClick={() => window.location.href = `/moderator-complaints?id=${complaint._id}`}
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
                              <span className="text-muted small">{complaint.district || complaint.location || "Unknown"}</span>
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
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ModeratorDashboard;



