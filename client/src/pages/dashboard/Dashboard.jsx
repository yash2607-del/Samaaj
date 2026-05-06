import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { filterByCategory, filterByStatus, searchComplaints } from "../../utils/filters";
import NotificationPanel from "../../components/NotificationPanel";
import API from "../../api/api.js";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCheckCircle, FiClock,
  FiSearch, FiFilter, FiAlertCircle,
  FiInbox, FiTrendingUp, FiBell, FiUser,
  FiSettings, FiGrid, FiLogOut, FiChevronRight, FiPlusCircle, FiArrowRight, FiActivity
} from 'react-icons/fi';

const categories = ["All", "Sanitization", "Cleanliness", "Electricity", "Road", "Water", "Public Safety"];

const Dashboard = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        setLoading(true);
        const storedUser = localStorage.getItem("user");
        const parsedUser = storedUser ? JSON.parse(storedUser) : null;
        const userId = parsedUser?.id || localStorage.getItem("userId") || "";
        const response = await API.get("/api/complaints", { params: userId ? { userId } : {} });
        setComplaints(response.data?.data || []);
      } catch (err) {
        setError("Unable to load complaints.");
      } finally {
        setLoading(false);
      }
    };
    fetchComplaints();
  }, []);

  const stats = useMemo(() => {
    const total = complaints.length;
    const resolved = complaints.filter((c) => c.status === "Resolved").length;
    const pending = complaints.filter((c) => c.status === "Pending" || c.status === "In Progress").length;
    return { total, resolved, pending, rate: total > 0 ? ((resolved / total) * 100).toFixed(0) : 0 };
  }, [complaints]);

  const filteredComplaints = useMemo(() => {
    let list = filterByCategory(complaints, category);
    list = searchComplaints(list, search);
    return list.slice(0, 5); // Just show top 5 for "Recent"
  }, [complaints, category, search]);

  const statusColors = {
    Pending: { color: "#FF7A45", bg: "rgba(255,122,69,0.1)", icon: FiClock },
    "In Progress": { color: "#475569", bg: "rgba(71,85,105,0.1)", icon: FiActivity },
    Resolved: { color: "#1a1a1a", bg: "rgba(0,0,0,0.05)", icon: FiCheckCircle },
    Rejected: { color: "#991B1B", bg: "rgba(153,27,27,0.1)", icon: FiAlertCircle }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <motion.div 
      initial="hidden" animate="visible" variants={containerVariants}
      className="container-fluid px-lg-5 px-3 py-4 py-lg-5" 
      style={{ background: '#F9FAFB', minHeight: '100vh' }}
    >
      {/* Top Profile Header - Better for Mobile */}
      <header className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-5">
        <div>
          <h1 className="fw-black mb-1 text-dark" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '-2px', lineHeight: '1' }}>
            PORTAL<span style={{ color: '#FF7A45' }}>.</span>
          </h1>
          <p className="text-muted fw-medium">Welcome back, <span className="text-dark fw-bold">{localStorage.getItem("userName")?.split(' ')[0] || "Citizen"}</span></p>
        </div>
        
        <div className="d-flex align-items-center gap-3 bg-white p-2 rounded-pill shadow-sm border border-light">
          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="btn btn-light rounded-circle p-0 d-flex align-items-center justify-content-center position-relative"
            style={{ width: '45px', height: '45px' }}
            onClick={() => setShowNotifications(true)}
          >
            <FiBell size={20} className="text-dark" />
            {unreadCount > 0 && <span className="position-absolute top-0 start-100 translate-middle badge rounded-circle bg-danger border border-white" style={{ fontSize: '0.6rem', padding: '0.35em 0.5em' }}>{unreadCount}</span>}
          </motion.button>
          <div className="d-none d-md-block pe-2">
            <div className="fw-bold small" style={{ color: '#1a1a1a' }}>{localStorage.getItem("userName") || "Citizen"}</div>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>Active Citizen</div>
          </div>
          <div className="rounded-circle overflow-hidden shadow-sm" style={{ width: '45px', height: '45px', background: 'linear-gradient(135deg, #FF7A45 0%, #FFB347 100%)' }}>
            <div className="w-100 h-100 d-flex align-items-center justify-content-center text-white fw-black">
              {(localStorage.getItem("userName") || "C").charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="row g-4 mb-5">
        {/* Hero Impact Card */}
        <div className="col-xl-8">
          <motion.div 
            variants={itemVariants}
            className="h-100 p-4 p-lg-5 position-relative overflow-hidden shadow-xl" 
            style={{ background: '#000', borderRadius: '40px', color: '#fff' }}
          >
            <div className="position-relative" style={{ zIndex: 1 }}>
              <div className="small text-uppercase fw-black mb-4" style={{ opacity: 0.6, letterSpacing: '3px' }}>Your Civic Impact</div>
              <div className="row align-items-end">
                <div className="col-md-7">
                  <h2 className="display-3 fw-black mb-4" style={{ letterSpacing: '-3px', lineHeight: '0.9' }}>
                    Resolution is at <span style={{ color: '#FF7A45' }}>{stats.rate}%</span>
                  </h2>
                  <p className="text-white opacity-60 fw-medium mb-5" style={{ maxWidth: '400px' }}>
                    Thank you for actively contributing to your community. Every report brings us closer to a better society.
                  </p>
                  <motion.button 
                    whileHover={{ x: 10 }}
                    className="btn px-4 py-3 rounded-pill fw-black d-flex align-items-center gap-3"
                    style={{ background: '#FF7A45', color: '#fff', fontSize: '0.9rem' }}
                    onClick={() => navigate('/complaint')}
                  >
                    REPORT NEW ISSUE <FiPlusCircle size={20} />
                  </motion.button>
                </div>
                <div className="col-md-5 d-none d-md-block text-end">
                   <div className="d-inline-flex flex-column gap-3">
                      <div className="text-end">
                        <div className="display-5 fw-black text-white">{stats.total}</div>
                        <div className="small opacity-50 fw-bold">TOTAL REPORTS</div>
                      </div>
                      <div className="text-end">
                        <div className="display-5 fw-black text-white">{stats.resolved}</div>
                        <div className="small opacity-50 fw-bold">RESOLVED CASES</div>
                      </div>
                   </div>
                </div>
              </div>
            </div>
            {/* Background Decorative Elements */}
            <div className="position-absolute" style={{ width: '400px', height: '400px', background: '#FF7A45', borderRadius: '50%', filter: 'blur(120px)', opacity: 0.15, top: '-150px', right: '-150px' }}></div>
            <div className="position-absolute" style={{ width: '200px', height: '200px', background: '#007AFF', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.1, bottom: '-50px', left: '-50px' }}></div>
          </motion.div>
        </div>

        {/* Small Action Cards */}
        <div className="col-xl-4">
          <div className="row g-4 h-100">
            <div className="col-12">
              <motion.div 
                variants={itemVariants}
                whileHover={{ y: -5 }}
                className="p-4 h-100 d-flex flex-column justify-content-center bg-white shadow-sm border border-light" 
                style={{ borderRadius: '32px' }}
              >
                <div className="d-flex align-items-center gap-3 mb-3">
                   <div className="p-3 rounded-circle" style={{ background: 'rgba(52,199,89,0.1)', color: '#34C759' }}><FiCheckCircle size={24} /></div>
                   <h5 className="fw-black mb-0">Tracked Issues</h5>
                </div>
                <p className="text-muted small fw-medium mb-4">View real-time updates on your submitted reports.</p>
                <button className="btn w-100 py-3 fw-black rounded-pill border-0 shadow-sm" style={{ background: '#f8f9fa', fontSize: '0.8rem' }} onClick={() => navigate('/track-issue')}>VIEW TRACKER <FiArrowRight className="ms-2" /></button>
              </motion.div>
            </div>
            <div className="col-12">
              <motion.div 
                variants={itemVariants}
                whileHover={{ y: -5 }}
                className="p-4 h-100 d-flex flex-column justify-content-center" 
                style={{ background: '#FF7A45', borderRadius: '32px', color: '#fff' }}
              >
                <div className="d-flex align-items-center gap-3 mb-3">
                   <div className="p-3 rounded-circle" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}><FiSearch size={24} /></div>
                   <h5 className="fw-black mb-0">Nearby Issues</h5>
                </div>
                <p className="text-white opacity-80 small fw-medium mb-4">Discover what's happening around your location right now.</p>
                <button className="btn btn-light w-100 py-3 fw-black rounded-pill" style={{ fontSize: '0.8rem' }} onClick={() => navigate('/nearby-complaints')}>EXPLORE MAP</button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Section */}
      <div className="row g-5">
        {/* Left: Recent Activity Feed */}
        <div className="col-lg-8">
          <header className="d-flex align-items-center justify-content-between mb-4">
            <h5 className="fw-black mb-0" style={{ letterSpacing: '1px' }}>RECENT ACTIVITY</h5>
            <div className="d-flex gap-2">
              <div className="input-group input-group-sm bg-white rounded-pill px-3 py-1 shadow-sm border border-light">
                <FiSearch className="text-muted me-2 mt-1" />
                <input type="text" placeholder="Quick find..." className="form-control border-0 bg-transparent p-0 shadow-none" style={{ fontSize: '0.85rem' }} value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
          </header>

          <motion.div variants={itemVariants} className="bg-white p-2" style={{ borderRadius: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)' }}>
            {loading ? (
               <div className="p-5 text-center"><div className="spinner-border text-muted border-4" style={{ width: '3rem', height: '3rem' }}></div></div>
            ) : filteredComplaints.length === 0 ? (
              <div className="p-5 text-center">
                <FiInbox size={48} className="text-muted mb-3 opacity-20" />
                <div className="text-muted fw-bold">No reports found</div>
              </div>
            ) : (
              filteredComplaints.map((c, i) => (
                <motion.div 
                  key={c._id} 
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                  whileHover={{ background: '#F9FAFB' }}
                  className="p-4 d-flex align-items-center justify-content-between rounded-4 transition-all"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/track-issue?id=${c._id}`)}
                >
                  <div className="d-flex align-items-center gap-4 flex-grow-1 overflow-hidden">
                    <div 
                      className="d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm"
                      style={{ width: '55px', height: '55px', borderRadius: '18px', background: statusColors[c.status]?.bg || '#f3f4f6', color: statusColors[c.status]?.color || '#000' }}
                    >
                      {React.createElement(statusColors[c.status]?.icon || FiAlertCircle, { size: 24 })}
                    </div>
                    <div className="overflow-hidden">
                      <div className="fw-bold mb-1 text-dark text-truncate" style={{ fontSize: '1.05rem', letterSpacing: '-0.3px' }}>{c.title}</div>
                      <div className="d-flex gap-3 align-items-center flex-wrap">
                         <span className="small text-muted fw-bold">{c.category.toUpperCase()}</span>
                         <span className="small text-muted opacity-40">•</span>
                         <span className="small text-muted fw-medium">{new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-4 d-none d-md-flex">
                     <div className="d-flex flex-column align-items-end gap-1">
                        <div className="px-3 py-1 rounded-pill" style={{ background: statusColors[c.status]?.bg || '#f3f4f6', color: statusColors[c.status]?.color || '#000', fontSize: '0.65rem', fontWeight: '900', letterSpacing: '0.5px' }}>
                          {c.status.toUpperCase()}
                        </div>
                        {c.mlReviewStatus && (
                          <div className="px-2 py-0.5 rounded-pill text-white" style={{ background: c.mlReviewStatus === 'AI Verified' ? '#34C759' : '#FF7A45', fontSize: '0.55rem', fontWeight: '900', letterSpacing: '0.3px' }}>
                            {c.mlReviewStatus.toUpperCase()}
                          </div>
                        )}
                     </div>
                     <FiChevronRight className="text-muted opacity-30" />
                  </div>
                </motion.div>
              ))
            )}
            <div className="p-3 border-top border-light text-center">
              <button className="btn btn-link text-dark text-decoration-none fw-black small" onClick={() => navigate('/track-issue')}>
                VIEW ALL ACTIVITY <FiArrowRight className="ms-1" />
              </button>
            </div>
          </motion.div>
        </div>

        {/* Right: Quick Links & Help */}
        <div className="col-lg-4">
           <motion.div variants={itemVariants}>
              <h5 className="fw-black mb-4" style={{ letterSpacing: '1px' }}>RESOURCES</h5>
              <div className="d-flex flex-column gap-3">
                {[
                  { label: 'Portal Preferences', icon: FiSettings, path: '/settings', desc: 'Customise your experience' },
                  { label: 'Heatmap View', icon: FiGrid, path: '/explore', desc: 'Global issue visualization' },
                  { label: 'Support Center', icon: FiAlertCircle, path: '/about', desc: 'How Samaaj works' }
                ].map((action, i) => (
                  <button key={i} className="btn w-100 p-4 text-start d-flex align-items-center justify-content-between bg-white border border-light shadow-sm transition-all" 
                          style={{ borderRadius: '24px' }}
                          onClick={() => navigate(action.path)}>
                    <div className="d-flex align-items-center gap-3">
                      <div className="p-3 rounded-circle" style={{ background: '#F9FAFB' }}>
                        <action.icon size={20} className="text-dark" />
                      </div>
                      <div>
                        <div className="fw-black mb-0" style={{ fontSize: '0.9rem' }}>{action.label}</div>
                        <div className="text-muted fw-medium" style={{ fontSize: '0.75rem' }}>{action.desc}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
           </motion.div>
        </div>
      </div>

      <NotificationPanel isOpen={showNotifications} onClose={() => setShowNotifications(false)} />

      {/* Global CSS for responsiveness tweaks */}
      <style>{`
        .transition-all { transition: all 0.2s ease-in-out; }
        .transition-all:hover { transform: translateX(8px); }
        .fw-black { font-weight: 900; }
        .shadow-xl { box-shadow: 0 30px 60px rgba(0,0,0,0.12); }
        
        @media (max-width: 768px) {
          .display-3 { font-size: 2.5rem !important; }
          .p-lg-5 { padding: 1.5rem !important; }
        }
      `}</style>
    </motion.div>
  );
};

export default Dashboard;
