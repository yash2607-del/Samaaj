import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api.js";
import CitizenSidebar from "../../components/CitizenSidebar";
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
  FiPlusCircle
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
  const base = API.defaults.baseURL || "";
  return base ? `${base}/${trimmed}` : `/${trimmed}`;
};

const formatDate = (value) => {
  if (!value) return "Date unavailable";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export default function Usertrack() {
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const fetchComplaints = async () => {
      try {
        setLoading(true);
        setError("");

        const storedUser = localStorage.getItem("user");
        const parsedUser = storedUser ? JSON.parse(storedUser) : null;
        const userId = parsedUser?.id || localStorage.getItem("userId");

        if (!userId) {
          setError("Please log in to view your complaints.");
          return;
        }

        const response = await API.get("/api/complaints", { params: { userId } });
        if (!mounted) return;
        setIssues(response.data?.data || []);
      } catch (err) {
        if (!mounted) return;
        console.error("Failed to load complaints", err);
        setError(err.response?.data?.error || "Failed to load complaints");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchComplaints();
    return () => {
      mounted = false;
    };
  }, []);

  const summary = useMemo(() => {
    const total = issues.length;
    const pending = issues.filter((item) => item.status === "Pending").length;
    const inProgress = issues.filter((item) => item.status === "In Progress").length;
    const resolved = issues.filter((item) => item.status === "Resolved").length;
    return { total, pending, inProgress, resolved };
  }, [issues]);

  if (loading) {
    return (
      <div className="d-flex" style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
        <CitizenSidebar />
        <div className="flex-grow-1 d-flex align-items-center justify-content-center">
          <div className="text-center">
            <div className="spinner-border" style={{ width: "3rem", height: "3rem", color: "#FFB347" }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <div className="mt-3 fw-semibold" style={{ color: "#616161", fontSize: "1.1rem" }}>
              Loading your complaints...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="d-flex" style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
        <CitizenSidebar />
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

  if (!issues.length) {
    return (
      <div className="d-flex" style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
        <CitizenSidebar />
        <div className="flex-grow-1 d-flex align-items-center justify-content-center p-4">
          <div className="card border-0 shadow-sm" style={{ maxWidth: "600px", width: "100%" }}>
            <div className="card-body text-center p-5">
              <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-4"
                   style={{ width: "100px", height: "100px", backgroundColor: "#FFF8F0" }}>
                <FiInbox style={{ fontSize: "3rem", color: "#FFB347" }} />
              </div>
              <h4 className="mb-3 fw-bold" style={{ color: "#1a1a1a" }}>No Complaints Yet</h4>
              <p className="text-muted mb-4" style={{ fontSize: "1.05rem" }}>
                You haven't submitted any civic complaints. Start making a difference by reporting issues in your community.
              </p>
              <button 
                className="btn btn-lg fw-semibold px-5"
                style={{ backgroundColor: "#FFB347", color: "#1a1a1a", border: "none" }}
                onClick={() => navigate('/complaint')}
              >
                <FiPlusCircle className="me-2" />
                Submit Your First Complaint
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex" style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <CitizenSidebar />
      <div className="flex-grow-1" style={{ overflow: "auto" }}>
        
        {/* Header Section */}
        <section className="py-4 px-4 border-bottom shadow-sm" style={{ background: "linear-gradient(135deg, #FFB347 0%, #FFD8A8 100%)" }}>
          <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-lg-between">
            <div>
              <h3 className="mb-2 fw-bold" style={{ color: "#1a1a1a", fontSize: "1.75rem" }}>
                Track Your Issues
              </h3>
              <p className="mb-0" style={{ color: "#424242", fontSize: "0.95rem" }}>
                Monitor the progress of every complaint you've submitted to the civic authorities
              </p>
            </div>
          </div>
        </section>

        {/* Summary Stats Section */}
        <section className="py-4 px-4" style={{ backgroundColor: "#FFFEF7" }}>
          <div className="row g-3">
            <div className="col-6 col-md-3">
              <div className="card border-0 shadow-sm h-100" style={{ borderTop: "4px solid #FFB347" }}>
                <div className="card-body text-center p-3 p-md-4">
                  <div className="fw-bold mb-1" style={{ fontSize: "2rem", color: "#1a1a1a" }}>
                    {summary.total}
                  </div>
                  <div className="small text-muted fw-semibold">Total Complaints</div>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card border-0 shadow-sm h-100" style={{ borderTop: "4px solid #FFB347" }}>
                <div className="card-body text-center p-3 p-md-4">
                  <div className="fw-bold mb-1" style={{ fontSize: "2rem", color: "#FFB347" }}>
                    {summary.pending}
                  </div>
                  <div className="small text-muted fw-semibold">Pending Review</div>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card border-0 shadow-sm h-100" style={{ borderTop: "4px solid #0288D1" }}>
                <div className="card-body text-center p-3 p-md-4">
                  <div className="fw-bold mb-1" style={{ fontSize: "2rem", color: "#0288D1" }}>
                    {summary.inProgress}
                  </div>
                  <div className="small text-muted fw-semibold">In Progress</div>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card border-0 shadow-sm h-100" style={{ borderTop: "4px solid #2E7D32" }}>
                <div className="card-body text-center p-3 p-md-4">
                  <div className="fw-bold mb-1" style={{ fontSize: "2rem", color: "#2E7D32" }}>
                    {summary.resolved}
                  </div>
                  <div className="small text-muted fw-semibold">Resolved</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Complaints Grid Section */}
        <section className="py-4 px-4" style={{ backgroundColor: "#FFFEF7" }}>
          <div className="mb-4">
            <h5 className="fw-semibold d-flex align-items-center gap-2 mb-1" style={{ color: "#1a1a1a" }}>
              <FiClock style={{ color: "#FFB347" }} />
              All Your Complaints ({issues.length})
            </h5>
            <p className="text-muted mb-0 small">Click on any card to view complete details and current status</p>
          </div>

          <div className="row g-4">
            {issues.map((issue) => {
              const status = issue.status || "Pending";
              const meta = statusMeta[status] || statusMeta.Pending;
              const StatusIcon = meta.icon;
              const photoUrl = normalizePhotoUrl(issue.photo);

              return (
                <div className="col-md-6 col-xl-4" key={issue._id || issue.id}>
                  <div 
                    className="card h-100 border-0 shadow-sm" 
                    style={{ 
                      borderRadius: "12px",
                      borderTop: `4px solid ${meta.surface}`,
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      cursor: "pointer",
                      overflow: "hidden"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-8px)";
                      e.currentTarget.style.boxShadow = "0 12px 28px rgba(0,0,0,0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.12)";
                    }}
                  >
                    {/* Image or Placeholder */}
                    {photoUrl ? (
                      <div style={{ position: "relative", overflow: "hidden", height: "200px" }}>
                        <img
                          src={photoUrl}
                          className="card-img-top"
                          alt={issue.title || "Complaint"}
                          style={{ 
                            height: "100%", 
                            width: "100%",
                            objectFit: "cover",
                            transition: "transform 0.3s ease"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                          onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                        />
                        <div 
                          className="position-absolute top-0 end-0 m-3"
                          style={{ zIndex: 1 }}
                        >
                          <span className={`badge ${meta.badgeClass} d-inline-flex align-items-center gap-1 px-3 py-2 shadow`}>
                            <StatusIcon />
                            {status}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="d-flex align-items-center justify-content-center position-relative"
                        style={{ height: "200px", backgroundColor: meta.surface }}
                      >
                        <FiInbox style={{ fontSize: "3rem", color: "#BDBDBD" }} />
                        <div 
                          className="position-absolute top-0 end-0 m-3"
                          style={{ zIndex: 1 }}
                        >
                          <span className={`badge ${meta.badgeClass} d-inline-flex align-items-center gap-1 px-3 py-2 shadow`}>
                            <StatusIcon />
                            {status}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Card Body */}
                    <div className="card-body p-4">
                      <h5 className="card-title mb-3 fw-bold" style={{ fontSize: "1.15rem", color: "#1a1a1a", lineHeight: "1.4" }}>
                        {issue.title || "Untitled Complaint"}
                      </h5>

                      <p className="card-text text-muted mb-3" style={{ fontSize: "0.9rem", lineHeight: "1.6" }}>
                        {issue.description
                          ? issue.description.length > 120
                            ? `${issue.description.slice(0, 120)}...`
                            : issue.description
                          : "No description provided."}
                      </p>

                      {/* Meta Information */}
                      <div className="border-top pt-3">
                        <div className="row g-2 mb-3">
                          <div className="col-12">
                            <div className="d-flex align-items-center gap-2 text-muted small">
                              <FiTag style={{ color: "#FFB347", fontSize: "1rem" }} />
                              <span className="fw-semibold">{issue.category || "Uncategorized"}</span>
                            </div>
                          </div>
                          <div className="col-12">
                            <div className="d-flex align-items-center gap-2 text-muted small">
                              <FiMapPin style={{ color: "#FFB347", fontSize: "1rem" }} />
                              <span style={{ 
                                overflow: "hidden", 
                                textOverflow: "ellipsis", 
                                whiteSpace: "nowrap" 
                              }}>
                                {issue.location || "Location not specified"}
                              </span>
                            </div>
                          </div>
                          <div className="col-12">
                            <div className="d-flex align-items-center gap-2 text-muted small">
                              <FiCalendar style={{ color: "#FFB347", fontSize: "1rem" }} />
                              <span>{formatDate(issue.createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Action Button */}
                        <button 
                          className="btn btn-sm w-100 fw-semibold d-flex align-items-center justify-content-center gap-2" 
                          style={{ 
                            backgroundColor: "#FFB347", 
                            color: "#1a1a1a", 
                            border: "none",
                            padding: "0.6rem"
                          }}
                          onClick={() => alert(`View details for: ${issue.title}`)}
                        >
                          <FiEye />
                          View Full Details
                        </button>
                      </div>
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


