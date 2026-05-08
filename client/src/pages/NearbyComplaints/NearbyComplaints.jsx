import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { filterByCategory, filterByStatus, searchComplaints } from "../../utils/filters";
import API from "../../api/api.js";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiCheckCircle, FiClock, 
  FiSearch, FiFilter, FiAlertCircle, 
  FiInbox, FiThumbsUp, FiThumbsDown,
  FiChevronRight, FiX, FiActivity, FiMap
} from 'react-icons/fi';
import { MapPin } from 'lucide-react';

const categories = ["All", "Sanitization", "Cleanliness", "Electricity", "Road", "Water", "Public Safety"];

const NearbyComplaints = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [userDistrict, setUserDistrict] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const profileRes = await API.get("/profile", { headers: { Authorization: `Bearer ${token}` } });
        setUserDistrict(profileRes.data.user?.location || "Your Area");
        const response = await API.get("/api/complaints", { params: { scope: 'district' } });
        setComplaints(response.data?.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredComplaints = useMemo(() => {
    let list = filterByCategory(complaints, category);
    list = searchComplaints(list, search);
    return list;
  }, [complaints, category, search]);

  const statusMeta = {
    Pending: { color: "#FF7A45", bg: "rgba(255,122,69,0.1)", icon: FiClock },
    "In Progress": { color: "#007AFF", bg: "rgba(0,122,255,0.1)", icon: FiActivity },
    Resolved: { color: "#34C759", bg: "rgba(52,199,89,0.1)", icon: FiCheckCircle },
    Rejected: { color: "#FF3B30", bg: "rgba(255,59,48,0.1)", icon: FiAlertCircle }
  };

  return (
    <div className="flex-grow-1 px-lg-5 px-3 py-5" style={{ background: '#F9FAFB' }}>
      
      {/* Header */}
      <header className="mb-5 d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3">
        <div>
          <div className="d-flex align-items-center gap-2 mb-2">
            <MapPin className="text-danger" size={20} />
            <span className="text-muted fw-bold small text-uppercase" style={{ letterSpacing: '1px' }}>{userDistrict}</span>
          </div>
          <h1 className="fw-black mb-1 text-dark" style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', letterSpacing: '-2px', lineHeight: '1' }}>
            NEARBY ISSUES<span style={{ color: '#FF7A45' }}>.</span>
          </h1>
          <p className="text-muted fw-medium">Crowdsourced reports from your local community feed.</p>
        </div>
        
        <div className="d-flex gap-2">
           <div className="input-group input-group-sm bg-white rounded-pill px-3 py-2 shadow-sm border border-light" style={{ width: '280px' }}>
              <FiSearch className="text-muted mt-1 me-2" />
              <input type="text" placeholder="Search locale..." className="form-control border-0 bg-transparent shadow-none p-0 fw-medium" value={search} onChange={e => setSearch(e.target.value)} />
           </div>
        </div>
      </header>

      {/* Category Filter */}
      <div className="d-flex gap-2 overflow-auto pb-4 mb-4 scrollbar-hidden">
        {categories.map(cat => (
          <button 
            key={cat} 
            className={`btn px-4 py-2 rounded-pill fw-bold small transition-all ${category === cat ? 'bg-dark text-white' : 'bg-white text-muted border border-light shadow-sm'}`}
            onClick={() => setCategory(cat)}
          >
            {cat.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Main Feed */}
      <div className="row g-4">
        {loading ? (
          <div className="col-12 py-5 text-center"><div className="spinner-border text-dark"></div></div>
        ) : filteredComplaints.length === 0 ? (
          <div className="col-12 py-5 text-center">
            <FiInbox size={48} className="text-muted mb-3 opacity-20" />
            <div className="fw-bold text-muted">No reports found in this area.</div>
          </div>
        ) : (
          filteredComplaints.map((c, i) => (
            <motion.div 
              key={c._id} className="col-lg-6 col-xl-4"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            >
              <div 
                className="card h-100 border-0 shadow-sm overflow-hidden hover-lift transition-all" 
                style={{ borderRadius: '32px', background: '#fff', border: '1px solid rgba(0,0,0,0.04)' }}
                onClick={() => setSelectedComplaint(c)}
              >
                <div className="position-relative" style={{ height: '220px' }}>
                  <img 
                    src={c.photo ? (c.photo.startsWith('data:') ? c.photo : `${import.meta.env.VITE_API_BASE_URL}/${c.photo.replace(/^\//, '')}`) : '/placeholder.jpg'} 
                    className="w-100 h-100" style={{ objectFit: 'cover' }} 
                    alt={c.title} 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/placeholder.jpg';
                    }}
                  />
                  <div className="position-absolute top-0 end-0 m-3 d-flex flex-column gap-2 align-items-end">
                    <div className="px-3 py-2 rounded-pill d-flex align-items-center gap-2 shadow-lg" 
                         style={{ background: '#fff', color: statusMeta[c.status]?.color || '#000', fontWeight: '800', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                      {React.createElement(statusMeta[c.status]?.icon || FiClock, { size: 14 })} {c.status}
                    </div>
                    {c.mlReviewStatus && (
                      <div className="px-3 py-2 rounded-pill shadow-lg text-white d-flex align-items-center gap-1" 
                           style={{ 
                             background: c.mlReviewStatus === 'Verified by AI' ? '#34C759' : 
                                         c.mlReviewStatus === 'Flagged for Manual Check' ? '#FF3B30' : '#FF7A45', 
                             fontWeight: '800', 
                             fontSize: '0.65rem', 
                             textTransform: 'uppercase',
                             letterSpacing: '0.5px'
                           }}>
                        {c.mlReviewStatus === 'Verified by AI' && <FiCheckCircle size={10} />}
                        {c.mlReviewStatus === 'Flagged for Manual Check' && <FiAlertCircle size={10} />}
                        {c.mlReviewStatus}
                      </div>
                    )}
                  </div>
                </div>
                <div className="card-body p-4">
                  <div className="d-flex gap-2 mb-3">
                    <span className="px-2 py-1 rounded bg-light small fw-black" style={{ fontSize: '0.6rem' }}>{c.category.toUpperCase()}</span>
                    <span className="text-muted small fw-bold">{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h5 className="fw-black mb-3 text-dark text-truncate">{c.title}</h5>
                  <div className="d-flex align-items-center justify-content-between pt-3 border-top border-light">
                     <div className="d-flex gap-3">
                        <div className="small d-flex align-items-center gap-1 text-muted fw-bold"><FiThumbsUp /> {c.likes?.length || 0}</div>
                        <div className="small d-flex align-items-center gap-1 text-muted fw-bold"><FiThumbsDown /> {c.dislikes?.length || 0}</div>
                     </div>
                     <FiChevronRight className="text-muted" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Simplified Detail Modal */}
      <AnimatePresence>
        {selectedComplaint && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-4"
            style={{ background: 'rgba(0,0,0,0.8)', zIndex: 2000, backdropFilter: 'blur(10px)' }}
            onClick={() => setSelectedComplaint(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-white" style={{ maxWidth: '600px', width: '100%', borderRadius: '40px', overflow: 'hidden' }}
              onClick={e => e.stopPropagation()}
            >
               <img 
                 src={selectedComplaint.photo ? (selectedComplaint.photo.startsWith('data:') ? selectedComplaint.photo : `${import.meta.env.VITE_API_BASE_URL}/${selectedComplaint.photo.replace(/^\//, '')}`) : '/placeholder.jpg'} 
                 className="w-100" style={{ height: '300px', objectFit: 'cover' }} 
                 onError={(e) => {
                   e.target.onerror = null;
                   e.target.src = '/placeholder.jpg';
                 }}
               />
               <div className="p-5">
                  <h3 className="fw-black mb-2">{selectedComplaint.title}</h3>
                  <p className="text-muted mb-4">{selectedComplaint.description}</p>
                  <div className="d-flex align-items-center gap-3">
                    <div className="px-3 py-2 rounded-pill fw-black" style={{ background: statusMeta[selectedComplaint.status]?.bg, color: statusMeta[selectedComplaint.status]?.color, fontSize: '0.8rem' }}>
                      {selectedComplaint.status}
                    </div>
                    <button className="btn btn-dark rounded-pill px-4 py-2 fw-black small" onClick={() => setSelectedComplaint(null)}>CLOSE</button>
                  </div>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .fw-black { font-weight: 900; }
        .hover-lift { transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); cursor: pointer; }
        .hover-lift:hover { transform: translateY(-10px); }
        .scrollbar-hidden::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default NearbyComplaints;
