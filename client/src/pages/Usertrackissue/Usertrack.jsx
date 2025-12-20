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
  FiPlusCircle,
  FiX
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
  const [selectedIssue, setSelectedIssue] = useState(null);

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
              <h3 className="mb-2 fw-bold" style={{ color: "#1a1a1a", fontSize: "2rem" }}>
                Track Your Complaints
              </h3>
              <p className="mb-0" style={{ color: "#424242", fontSize: "1rem", lineHeight: "1.5" }}>
                Stay updated on the status and progress of all your civic issue submissions in real-time
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
            <h5 className="fw-semibold d-flex align-items-center gap-2 mb-2" style={{ color: "#1a1a1a", fontSize: "1.3rem" }}>
              <FiClock style={{ color: "#FFB347", fontSize: "1.2rem" }} />
              Your Submitted Complaints
            </h5>
            <p className="text-muted mb-0" style={{ fontSize: "0.95rem" }}>
              You have <span className="fw-semibold" style={{ color: "#FFB347" }}>{issues.length}</span> {issues.length === 1 ? 'complaint' : 'complaints'} on record. Click any card to view full details and track resolution progress.
            </p>
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

                      {/* Meta Information */}
                      <div className="pt-2">
                        <div className="row g-2 mb-3">
                          <div className="col-12">
                            <div className="d-flex align-items-center gap-2 text-muted small">
                              <FiTag style={{ color: "#FFB347", fontSize: "1rem" }} />
                              <span className="fw-semibold">{issue.category || "Uncategorized"}</span>
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
                          onClick={() => setSelectedIssue(issue)}
                        >
                          <FiEye />
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Details Modal */}
        {selectedIssue && (
          <div
            className="position-fixed top-0 start-0 w-100 h-100"
            style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
            onClick={() => setSelectedIssue(null)}
          >
            <div className="d-flex align-items-center justify-content-center w-100 h-100 p-3">
              <div
                className="card shadow-lg"
                style={{ maxWidth: "700px", width: "100%", borderRadius: "16px", maxHeight: "90vh", overflow: "auto" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="card-body p-4">
                  {/* Modal Header */}
                  <div className="d-flex justify-content-between align-items-start mb-4">
                    <div className="flex-grow-1">
                      <h4 className="fw-bold mb-2" style={{ color: "#1a1a1a" }}>
                        {selectedIssue.title || "Untitled Complaint"}
                      </h4>
                      <span className={`badge ${statusMeta[selectedIssue.status]?.badgeClass || statusMeta.Pending.badgeClass} px-3 py-2`}>
                        {selectedIssue.status || "Pending"}
                      </span>
                    </div>
                    <button
                      className="btn btn-light border-0"
                      style={{ borderRadius: "50%", width: "40px", height: "40px", padding: 0 }}
                      onClick={() => setSelectedIssue(null)}
                    >
                      <FiX style={{ fontSize: "1.3rem" }} />
                    </button>
                  </div>

                  {/* Image */}
                  {normalizePhotoUrl(selectedIssue.photo) && (
                    <div className="mb-4">
                      <img
                        src={normalizePhotoUrl(selectedIssue.photo)}
                        alt={selectedIssue.title}
                        className="img-fluid rounded-3"
                        style={{ width: "100%", maxHeight: "350px", objectFit: "cover" }}
                      />
                    </div>
                  )}

                  {/* Description */}
                  <div className="mb-4">
                    <h6 className="fw-semibold mb-2" style={{ color: "#424242" }}>Description</h6>
                    <p className="text-muted" style={{ lineHeight: "1.7" }}>
                      {selectedIssue.description || "No description provided."}
                    </p>
                  </div>

                  {/* Details Grid */}
                  <div className="mb-4">
                    <h6 className="fw-semibold mb-3" style={{ color: "#424242" }}>Complaint Details</h6>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="d-flex align-items-start gap-2">
                          <FiTag className="mt-1" style={{ color: "#FFB347", fontSize: "1.1rem" }} />
                          <div>
                            <div className="small text-muted">Category</div>
                            <div className="fw-semibold">{selectedIssue.category || "Uncategorized"}</div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="d-flex align-items-start gap-2">
                          <FiCalendar className="mt-1" style={{ color: "#FFB347", fontSize: "1.1rem" }} />
                          <div>
                            <div className="small text-muted">Submitted On</div>
                            <div className="fw-semibold">{formatDate(selectedIssue.createdAt)}</div>
                          </div>
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="d-flex align-items-start gap-2">
                          <FiMapPin className="mt-1" style={{ color: "#FFB347", fontSize: "1.1rem" }} />
                          <div>
                            <div className="small text-muted">Location</div>
                            <div className="fw-semibold">{selectedIssue.location || "Not specified"}</div>
                            {selectedIssue.district && (
                              <div className="small text-muted">District: {selectedIssue.district}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      {selectedIssue.department?.name && (
                        <div className="col-md-6">
                          <div className="d-flex align-items-start gap-2">
                            <FiTag className="mt-1" style={{ color: "#FFB347", fontSize: "1.1rem" }} />
                            <div>
                              <div className="small text-muted">Department</div>
                              <div className="fw-semibold">{selectedIssue.department.name}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-outline-secondary flex-grow-1"
                      onClick={() => setSelectedIssue(null)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


