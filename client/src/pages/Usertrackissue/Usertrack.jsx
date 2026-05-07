import React, { useEffect, useMemo, useState } from "react";
import placeholderImg from "../../assets/img1.jpg";
const _devLocalBackend = 'http://localhost:3000';
const backendBase = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? _devLocalBackend : '');
const fallbackPic2 = backendBase ? `${backendBase.replace(/\/$/, '')}/uploads/pic2.png` : '/uploads/pic2.png';
import { useNavigate } from "react-router-dom";
import API from "../../api/api.js";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiInbox,
  FiRefreshCw,
  FiTag,
  FiCalendar,
  FiEye,
  FiXCircle,
  FiPlusCircle,
  FiX,
  FiChevronRight,
  FiTrash2
} from "react-icons/fi";
import { MapPin } from "lucide-react";

const statusMeta = {
  Pending: {
    icon: FiClock,
    badgeClass: "bg-orange-100 text-orange-600",
    color: "#FF7A45",
    light: "rgba(255, 122, 69, 0.1)"
  },
  "In Progress": {
    icon: FiRefreshCw,
    badgeClass: "bg-blue-100 text-blue-600",
    color: "#007AFF",
    light: "rgba(0, 122, 255, 0.1)"
  },
  Resolved: {
    icon: FiCheckCircle,
    badgeClass: "bg-green-100 text-green-600",
    color: "#34C759",
    light: "rgba(52, 199, 89, 0.1)"
  },
  Rejected: {
    icon: FiAlertCircle,
    badgeClass: "bg-red-100 text-red-600",
    color: "#FF3B30",
    light: "rgba(255, 59, 48, 0.1)"
  }
};

const mlDecisionMeta = {
  verified: {
    label: 'AI VERIFIED',
    badgeClass: 'bg-green-500 text-white'
  },
  needs_review: {
    label: 'AI NEEDS REVIEW',
    badgeClass: 'bg-amber-500 text-white'
  },
  uncertain: {
    label: 'AI NEEDS REVIEW',
    badgeClass: 'bg-amber-500 text-white'
  }
};

const normalizeMlDecision = (issue) => {
  const direct = String(issue?.mlDecision || '').trim().toLowerCase();
  if (direct) return direct;
  const reviewStatus = String(issue?.mlReviewStatus || '').trim().toLowerCase();
  if (reviewStatus === 'verified' || reviewStatus === 'ai verified') return 'verified';
  if (reviewStatus === 'pending review' || reviewStatus === 'ai needs review' || reviewStatus === 'needs_review') return 'needs_review';
  if (reviewStatus === 'manual check' || reviewStatus === 'uncertain') return 'uncertain';
  return '';
};

const normalizePhotoUrl = (photoPath) => {
  if (!photoPath) return placeholderImg;
  const filename = (photoPath || '').split('/').pop();
  const KNOWN_MISSING = ['1766417044499-919410092.png','1766329893553-386484364.png','1766422049649-436909165.png'];
  if (KNOWN_MISSING.includes(filename)) return fallbackPic2;
  if (/^https?:\/\//i.test(photoPath)) return photoPath;
  const trimmed = photoPath.startsWith("/") ? photoPath.slice(1) : photoPath;
  const base = API.defaults.baseURL || "";
  return base ? `${base.replace(/\/$/, '')}/${trimmed}` : `/${trimmed}`;
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
        setError(err.response?.data?.error || "Failed to load complaints");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchComplaints();
    return () => { mounted = false; };
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this report? This action cannot be undone.")) return;
    try {
      await API.delete(`/api/complaints/${id}`);
      setIssues(prev => prev.filter(item => item._id !== id));
      setSelectedIssue(null);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete complaint");
    }
  };

  const summary = useMemo(() => {
    const total = issues.length;
    const pending = issues.filter((item) => item.status === "Pending").length;
    const inProgress = issues.filter((item) => item.status === "In Progress").length;
    const resolved = issues.filter((item) => item.status === "Resolved").length;
    return { total, pending, inProgress, resolved };
  }, [issues]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  if (loading) {
    return (
      <div className="flex-grow-1 d-flex align-items-center justify-content-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
            <div className="spinner-border" style={{ width: "3rem", height: "3rem", color: "#FF7A45", borderRightColor: 'transparent' }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <div className="mt-4 fw-black" style={{ color: "#000", fontSize: "1.2rem", letterSpacing: '-0.5px' }}>
              FETCHING RECORDS<span style={{ color: '#FF7A45' }}>...</span>
            </div>
          </motion.div>
        </div>
    );
  }

  return (
    <div className="flex-grow-1 px-lg-5 px-3" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
        
        {/* Modern Header */}
        <header className="mb-5">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="fw-black mb-2" style={{ color: "#000", fontSize: "2.8rem", letterSpacing: "-1.5px", lineHeight: '1' }}>
              TRACK ISSUES<span style={{ color: '#FF7A45' }}>.</span>
            </h1>
            <p className="text-muted" style={{ fontSize: "1.1rem", maxWidth: '600px' }}>
              Real-time transparency into your community reports. Watch every step of the resolution lifecycle.
            </p>
          </motion.div>
        </header>

        {/* Premium Stats Grid */}
        <section className="mb-5">
          <div className="row g-4">
            {[
              { label: "Total Reports", value: summary.total, color: "#000", bg: "#f3f4f6" },
              { label: "Pending Review", value: summary.pending, color: "#FF7A45", bg: "rgba(255, 122, 69, 0.05)" },
              { label: "In Progress", value: summary.inProgress, color: "#007AFF", bg: "rgba(0, 122, 255, 0.05)" },
              { label: "Resolved", value: summary.resolved, color: "#34C759", bg: "rgba(52, 199, 89, 0.05)" }
            ].map((stat, i) => (
              <motion.div key={i} className="col-md-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.05)', padding: '2rem', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                  <div className="small text-uppercase fw-bold text-muted mb-2" style={{ letterSpacing: '1px', fontSize: '0.7rem' }}>{stat.label}</div>
                  <div className="fw-black" style={{ fontSize: '2.5rem', color: stat.color, lineHeight: '1' }}>{stat.value}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Complaints Grid Section */}
        <motion.section variants={containerVariants} initial="hidden" animate="visible">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <h5 className="fw-black mb-0" style={{ fontSize: "1.4rem", letterSpacing: '-0.5px' }}>
              ACTIVE REPORTS ({issues.length})
            </h5>
            <button className="btn btn-sm px-4 py-2" 
                    style={{ background: '#000', color: '#fff', borderRadius: '50px', fontWeight: '700', fontSize: '0.75rem' }}
                    onClick={() => navigate('/complaint')}>
              + NEW ISSUE
            </button>
          </div>

          <div className="row g-4">
            {issues.map((issue) => {
              const status = issue.status || "Pending";
              const meta = statusMeta[status] || statusMeta.Pending;
              const StatusIcon = meta.icon;
              const photoUrl = normalizePhotoUrl(issue.photo);
              const mlDecision = normalizeMlDecision(issue);
              const mlMeta = mlDecision ? mlDecisionMeta[mlDecision] : null;

              return (
                <motion.div className="col-md-6 col-xl-4" key={issue._id || issue.id} variants={itemVariants}>
                  <div 
                    className="card h-100 border-0 overflow-hidden" 
                    style={{ 
                      borderRadius: "24px",
                      background: '#fff',
                      boxShadow: '0 15px 35px rgba(0,0,0,0.03)',
                      transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                      cursor: "pointer",
                      border: '1px solid rgba(0,0,0,0.04)'
                    }}
                    onClick={() => setSelectedIssue(issue)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-10px)";
                      e.currentTarget.style.boxShadow = "0 25px 50px rgba(0,0,0,0.06)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 15px 35px rgba(0,0,0,0.03)";
                    }}
                  >
                    <div style={{ position: "relative", height: "240px", overflow: "hidden" }}>
                      <img
                        src={photoUrl}
                        className="w-100 h-100"
                        alt={issue.title}
                        style={{ objectFit: "cover" }}
                      />
                      <div className="position-absolute top-0 end-0 m-3 d-flex flex-column gap-2">
                        <div className="px-3 py-2 rounded-pill d-flex align-items-center gap-2 shadow-lg" 
                             style={{ background: '#fff', color: meta.color, fontWeight: '800', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                          <StatusIcon size={14} /> {status}
                        </div>
                        {mlMeta && (
                          <div className={`px-3 py-2 rounded-pill shadow-lg text-white`} 
                               style={{ background: mlDecision === 'verified' ? '#34C759' : '#FF7A45', fontWeight: '800', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                            {mlMeta.label}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="card-body p-4">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <span className="px-2 py-1 rounded" style={{ background: '#f3f4f6', color: '#666', fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {issue.category || "General"}
                        </span>
                        <span className="text-muted" style={{ fontSize: '0.7rem', fontWeight: '600' }}>
                          {formatDate(issue.createdAt)}
                        </span>
                      </div>
                      <h5 className="fw-bold mb-3" style={{ fontSize: "1.2rem", color: "#000", letterSpacing: '-0.5px' }}>
                        {issue.title || "Untitled Complaint"}
                      </h5>
                      <div className="d-flex align-items-center gap-2 text-muted mb-4" style={{ fontSize: '0.85rem' }}>
                        <MapPin size={14} color="#FF7A45" />
                        <span className="text-truncate">{issue.location || "Location not set"}</span>
                      </div>
                      
                      <div className="d-flex align-items-center justify-content-between pt-3 border-top">
                        <span className="fw-bold" style={{ fontSize: '0.75rem', color: '#000' }}>DETAILS</span>
                        <div style={{ width: '32px', height: '32px', background: '#f3f4f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FiChevronRight />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* Refined Details Modal */}
        <AnimatePresence>
          {selectedIssue && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-4"
              style={{ backgroundColor: "rgba(0,0,0,0.8)", zIndex: 2000, backdropFilter: 'blur(10px)' }}
              onClick={() => setSelectedIssue(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                className="bg-white"
                style={{ maxWidth: "800px", width: "100%", borderRadius: "32px", overflow: "hidden", position: 'relative' }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="position-absolute top-0 end-0 m-4 btn-close bg-white shadow-lg p-3 rounded-circle"
                  style={{ zIndex: 10 }}
                  onClick={() => setSelectedIssue(null)}
                ></button>

                <div className="row g-0" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                  <div className="col-lg-5">
                    <img src={normalizePhotoUrl(selectedIssue.photo)} className="h-100 w-100" style={{ objectFit: 'cover', minHeight: '300px' }} />
                  </div>
                  <div className="col-lg-7 p-5">
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <div className="px-3 py-1 rounded-pill" style={{ background: statusMeta[selectedIssue.status]?.light || '#eee', color: statusMeta[selectedIssue.status]?.color || '#000', fontWeight: '800', fontSize: '0.7rem' }}>
                        {selectedIssue.status || "PENDING"}
                      </div>
                      <span className="text-muted small fw-bold">{formatDate(selectedIssue.createdAt)}</span>
                    </div>
                    <h3 className="fw-black mb-4" style={{ letterSpacing: '-1px' }}>{selectedIssue.title}</h3>
                    <p className="text-muted mb-5" style={{ lineHeight: '1.8' }}>{selectedIssue.description}</p>
                    
                    <div className="row g-4">
                      <div className="col-6">
                        <div className="small text-muted fw-bold text-uppercase mb-1" style={{ letterSpacing: '1px' }}>Category</div>
                        <div className="fw-bold">{selectedIssue.category || "General"}</div>
                      </div>
                      <div className="col-6">
                        <div className="small text-muted fw-bold text-uppercase mb-1" style={{ letterSpacing: '1px' }}>Location</div>
                        <div className="fw-bold">{selectedIssue.location || "Remote"}</div>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-top d-flex justify-content-end">
                      <button 
                        className="btn btn-link text-danger text-decoration-none fw-black small d-flex align-items-center gap-2"
                        onClick={() => handleDelete(selectedIssue._id)}
                      >
                        <FiTrash2 /> DELETE THIS REPORT
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
  );
}
