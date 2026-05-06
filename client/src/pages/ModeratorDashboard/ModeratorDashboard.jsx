import React, { useEffect, useMemo, useState } from "react";
import { toastError } from "../../utils/toast";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiClipboard, FiCheckCircle, FiClock,
  FiSearch, FiFilter, FiAlertCircle,
  FiEye, FiInbox, FiTrendingUp, FiUser,
  FiSettings, FiGrid, FiLogOut, FiChevronRight,
  FiActivity, FiTarget, FiZap, FiMenu, FiBell
} from 'react-icons/fi';

const ModeratorDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [moderatorDept, setModeratorDept] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [tagFilter, setTagFilter] = useState("All");
  const [trustFilter, setTrustFilter] = useState("All");
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, resolved: 0, processing: 0, flagged: 0 });

  const fetchComplaints = (token) => {
    setLoading(true);
    axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/complaints/moderator-view`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      const data = res.data.data || res.data || [];
      setComplaints(data);
      setFilteredComplaints(data);
      const total = data.length;
      const resolved = data.filter(c => c.status === 'Resolved').length;
      const processing = data.filter(c => c.status === 'In Progress').length;
      const flagged = data.filter(c => c.reportTag && c.reportTag !== 'clean').length;
      setStats({ total, resolved, processing, flagged });
    })
    .catch(err => {
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate('/login');
      }
    })
    .finally(() => setLoading(false));
  };

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");
    setUser(storedUser);
    if (!storedUser || !token || !/moderator/i.test(storedUser.role || '')) {
      navigate("/login");
      return;
    }
    fetchComplaints(token);
    setModeratorDept(storedUser.department?.name || storedUser.department || "All Departments");
  }, []);

  useEffect(() => {
    let filtered = [...complaints];
    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== "All") filtered = filtered.filter(c => c.status === statusFilter);
    if (tagFilter !== "All") filtered = filtered.filter(c => c.reportTag === tagFilter);
    if (trustFilter === "Low Trust") filtered = filtered.filter(c => (c.trustScore || 0) < 0.4);
    if (trustFilter === "Manual Check") filtered = filtered.filter(c => c.mlDecision === 'uncertain' || c.mlDecision === 'unclear');

    // Sort: lowest trustScore first
    filtered.sort((a, b) => (a.trustScore || 0) - (b.trustScore || 0));
    
    setFilteredComplaints(filtered);
  }, [searchTerm, statusFilter, tagFilter, trustFilter, complaints]);

  const statusMeta = {
    Pending: { color: "#FF7A45", bg: "rgba(255,122,69,0.1)", icon: FiClock },
    "In Progress": { color: "#007AFF", bg: "rgba(0,122,255,0.1)", icon: FiZap },
    Resolved: { color: "#34C759", bg: "rgba(52,199,89,0.1)", icon: FiCheckCircle },
    Rejected: { color: "#FF3B30", bg: "rgba(255,59,48,0.1)", icon: FiAlertCircle }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <motion.div 
      initial="hidden" animate="visible" variants={containerVariants}
      className="container-fluid px-lg-5 px-3 py-4 py-lg-5" 
      style={{ background: '#F9FAFB', minHeight: '100vh' }}
    >
      
      {/* Admin Control Center Header */}
      <header className="mb-5 d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3">
        <div>
          <div className="d-flex align-items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-pill fw-black" style={{ background: '#000', color: '#fff', fontSize: '0.65rem', letterSpacing: '1px' }}>
              MODERATOR COMMAND
            </span>
            <span className="text-muted fw-bold small opacity-60">/ {moderatorDept.toUpperCase()}</span>
          </div>
          <h1 className="fw-black mb-1 text-dark" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', letterSpacing: '-1.5px', lineHeight: '1' }}>
            CONTROL CENTER<span style={{ color: '#FF7A45' }}>.</span>
          </h1>
          <p className="text-muted fw-medium mb-0">Unified management system for community verification.</p>
        </div>
        
        <div className="d-flex align-items-center gap-3 bg-white p-2 rounded-pill shadow-sm border border-light">
           <div className="d-none d-md-block ps-2 text-end">
            <div className="fw-bold small" style={{ color: '#1a1a1a' }}>{localStorage.getItem("userName") || "Admin"}</div>
            <div className="text-muted" style={{ fontSize: '0.7rem' }}>Authorized Personnel</div>
          </div>
          <div className="rounded-circle overflow-hidden shadow-sm" style={{ width: '45px', height: '45px', background: '#000' }}>
            <div className="w-100 h-100 d-flex align-items-center justify-content-center text-white fw-black">
              {(localStorage.getItem("userName") || "A").charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {/* Analytics Command Strip */}
      <section className="mb-5">
        <div className="row g-4">
          {[
            { label: 'Total Assigned', value: stats.total, icon: FiActivity, color: '#FF7A45' },
            { label: 'Resolved Case', value: stats.resolved, icon: FiCheckCircle, color: '#1a1a1a' },
            { label: 'Flagged / AI', value: stats.flagged, icon: FiAlertCircle, color: '#FF3B30' },
            { label: 'Active Process', value: stats.processing, icon: FiZap, color: '#1a1a1a' }
          ].map((stat, i) => (
            <div key={i} className="col-lg-3 col-md-6">
              <motion.div 
                variants={itemVariants}
                whileHover={{ y: -5, boxShadow: '0 15px 30px rgba(0,0,0,0.04)' }}
                className="p-4 h-100 border border-light bg-white" 
                style={{ borderRadius: '32px', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}
              >
                <div className="d-flex justify-content-between align-items-start mb-4">
                   <div className="p-3 rounded-4" style={{ background: '#F9FAFB', border: '1px solid rgba(0,0,0,0.03)' }}>
                     <stat.icon size={22} style={{ color: stat.color }} />
                   </div>
                   <div className="small fw-black text-muted opacity-20" style={{ fontSize: '0.6rem', letterSpacing: '2px' }}>0{i+1}</div>
                </div>
                <div className="fw-black text-dark mb-1" style={{ fontSize: '2.5rem', letterSpacing: '-2px', lineHeight: '1' }}>{stat.value}</div>
                <div className="small fw-black text-muted text-uppercase mt-2" style={{ letterSpacing: '1.5px', fontSize: '0.65rem', opacity: 0.6 }}>{stat.label}</div>
              </motion.div>
            </div>
          ))}
        </div>
      </section>

      {/* Main Operations Terminal */}
      <section className="bg-white p-4 p-lg-5 shadow-sm border border-light" style={{ borderRadius: '40px' }}>
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-5 gap-3">
          <h5 className="fw-black mb-0 d-flex align-items-center gap-2">
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FF7A45' }}></div>
            LIVE QUEUE TERMINAL
          </h5>
          <div className="d-flex gap-2 flex-wrap">
            <div className="input-group input-group-sm bg-light rounded-pill px-3 py-2 shadow-none border-0" style={{ width: '250px' }}>
              <FiSearch className="text-muted me-2 mt-1" />
              <input 
                type="text" 
                placeholder="Search cases..." 
                className="form-control border-0 bg-transparent p-0 shadow-none fw-medium" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
              />
            </div>
            <select className="form-select form-select-sm border-0 bg-light px-3 rounded-pill fw-bold" style={{ width: '130px', fontSize: '0.8rem' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="All">All Status</option>
              <option>Pending</option>
              <option>In Progress</option>
              <option>Resolved</option>
            </select>
            <select className="form-select form-select-sm border-0 bg-light px-3 rounded-pill fw-bold" style={{ width: '130px', fontSize: '0.8rem' }} value={tagFilter} onChange={e => setTagFilter(e.target.value)}>
              <option value="All">All Tags</option>
              <option value="spam">Spam</option>
              <option value="duplicate">Duplicate</option>
              <option value="irrelevant">Irrelevant</option>
            </select>
            <select className="form-select form-select-sm border-0 bg-light px-3 rounded-pill fw-bold" style={{ width: '130px', fontSize: '0.8rem' }} value={trustFilter} onChange={e => setTrustFilter(e.target.value)}>
              <option value="All">All Trust</option>
              <option value="Low Trust">Low Trust</option>
              <option value="Manual Check">Manual Check</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-5 text-center"><div className="spinner-border text-dark border-4"></div></div>
        ) : filteredComplaints.length === 0 ? (
          <div className="py-5 text-center text-muted">
             <FiInbox size={40} className="mb-3 opacity-20" />
             <div className="fw-bold opacity-40">No records found in active queue.</div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle custom-admin-table">
              <thead>
                <tr className="text-muted" style={{ fontSize: '0.7rem', letterSpacing: '1.5px', borderBottom: '2px solid #F9FAFB' }}>
                  <th className="border-0 px-4 pb-3">CASE IDENTIFIER</th>
                  <th className="border-0 pb-3">CATEGORY</th>
                  <th className="border-0 pb-3">TRUST</th>
                  <th className="border-0 pb-3">STATUS</th>
                  <th className="border-0 px-4 pb-3 text-end">OPERATIONS</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredComplaints.map((c, i) => (
                    <motion.tr 
                      key={c._id} 
                      initial={{ opacity: 0, x: -10 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => navigate(`/moderator-complaints?id=${c._id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="px-4 py-4">
                        <div className="d-flex align-items-center gap-2">
                           <div className="fw-black text-dark" style={{ fontSize: '0.95rem' }}>{c.title}</div>
                           {c.reportTag && c.reportTag !== 'clean' && (
                              <span className="px-2 py-0 rounded text-white fw-black text-uppercase" style={{ fontSize: '0.5rem', background: c.reportTag === 'spam' ? '#FF3B30' : '#FF7A45' }}>{c.reportTag}</span>
                           )}
                        </div>
                        <div className="text-muted small fw-medium mt-1">{new Date(c.createdAt).toLocaleDateString()} • REF: #{c._id.slice(-6).toUpperCase()}</div>
                      </td>
                      <td>
                        <span className="px-3 py-1 rounded-pill bg-light text-dark fw-black" style={{ fontSize: '0.65rem' }}>{c.category.toUpperCase()}</span>
                      </td>
                      <td>
                         <div className="d-flex align-items-center gap-2">
                            <div className="flex-grow-1 bg-light rounded-pill overflow-hidden" style={{ width: '60px', height: '6px' }}>
                               <div style={{ width: `${(c.trustScore || 0) * 100}%`, height: '100%', background: (c.trustScore || 0) < 0.4 ? '#FF3B30' : (c.trustScore || 0) < 0.7 ? '#FFCC00' : '#34C759' }}></div>
                            </div>
                            <span className="fw-black small" style={{ fontSize: '0.7rem' }}>{Math.round((c.trustScore || 0) * 100)}%</span>
                         </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: statusMeta[c.status]?.color || '#000' }}></div>
                          <span className="fw-black text-dark" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>{c.status.toUpperCase()}</span>
                        </div>
                      </td>
                      <td className="px-4 text-end">
                        <motion.button 
                          whileHover={{ scale: 1.1, background: '#000', color: '#fff' }}
                          className="btn btn-sm rounded-circle d-inline-flex align-items-center justify-content-center"
                          style={{ width: '38px', height: '38px', background: '#F9FAFB' }}
                        >
                          <FiChevronRight />
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Global CSS for admin table styling */}
      <style>{`
        .fw-black { font-weight: 900; }
        .custom-admin-table tbody tr {
          transition: all 0.2s ease-in-out;
          border-bottom: 1px solid #F9FAFB;
        }
        .custom-admin-table tbody tr:hover {
          background-color: #F9FAFB !important;
          transform: scale(1.005);
        }
        .custom-admin-table thead th {
           padding-top: 1rem;
        }
        @media (max-width: 991px) {
           .display-6 { font-size: 1.5rem !important; }
        }
      `}</style>
    </motion.div>
  );
};

export default ModeratorDashboard;
