import React, { useEffect, useState } from "react";
import { toastError } from "../../utils/toast";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FiUser, FiMail, FiTag, FiCalendar, FiFileText, FiMapPin, FiPhone, FiShield, FiBriefcase, FiArrowLeft } from 'react-icons/fi';
import { motion } from "framer-motion";

const ModeratorProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [departmentInfo, setDepartmentInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) { navigate("/login"); return; }
        
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userData = res.data.user;
        setProfile(userData);

        const dept = userData?.department || userData?.departmentId;
        if (dept) {
          if (typeof dept === 'object' && dept.name) {
            setDepartmentInfo(dept);
          } else if (typeof dept === 'string') {
            try {
              const deptRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/complaints/departments/${dept}`);
              setDepartmentInfo(deptRes.data);
            } catch {
              setDepartmentInfo({ name: dept });
            }
          }
        }
      } catch (err) {
        toastError("Session expired");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  if (loading) return <div className="flex-grow-1 d-flex align-items-center justify-content-center py-5"><div className="spinner-border text-dark"></div></div>;

  return (
    <div className="flex-grow-1 px-lg-5 px-3 py-5" style={{ background: '#F9FAFB' }}>
      
      {/* Header */}
      <header className="mb-5">
        <button onClick={() => navigate(-1)} className="btn btn-link text-dark p-0 mb-4 text-decoration-none d-flex align-items-center gap-2 fw-bold small">
          <FiArrowLeft /> BACK TO DASHBOARD
        </button>
        <h1 className="fw-black mb-1 text-dark" style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', letterSpacing: '-2px', lineHeight: '1' }}>
          OFFICIAL PROFILE<span style={{ color: '#FF7A45' }}>.</span>
        </h1>
        <p className="text-muted fw-medium">Administrative credentials and departmental oversight.</p>
      </header>

      <div className="row g-4">
        {/* Main Info */}
        <div className="col-lg-8">
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-4 p-lg-5 shadow-sm border border-light mb-4" style={{ borderRadius: '40px' }}>
              <div className="d-flex flex-column flex-md-row align-items-center gap-4 mb-5 pb-5 border-bottom border-light">
                 <div className="flex-shrink-0" style={{ width: '120px', height: '120px', borderRadius: '40px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                    <FiUser size={60} color="#fff" />
                 </div>
                 <div className="text-center text-md-start">
                    <h2 className="fw-black text-dark mb-1">{profile?.name?.toUpperCase()}</h2>
                    <div className="d-flex align-items-center justify-content-center justify-content-md-start gap-2">
                       <FiShield className="text-primary" />
                       <span className="fw-bold text-muted small text-uppercase" style={{ letterSpacing: '1px' }}>Departmental Moderator</span>
                    </div>
                 </div>
              </div>

              <div className="row g-5">
                 <div className="col-md-6">
                    <div className="small fw-black text-muted text-uppercase mb-3" style={{ letterSpacing: '1px' }}>Official Identity</div>
                    <div className="d-flex align-items-center gap-3 mb-4">
                       <div className="p-3 rounded-circle bg-light"><FiMail className="text-primary" /></div>
                       <div>
                          <div className="small text-muted fw-bold">WORK EMAIL</div>
                          <div className="fw-black text-dark">{profile?.email}</div>
                       </div>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                       <div className="p-3 rounded-circle bg-light"><FiBriefcase className="text-success" /></div>
                       <div>
                          <div className="small text-muted fw-bold">DEPARTMENT</div>
                          <div className="fw-black text-dark">{departmentInfo?.name || 'Administrative'}</div>
                       </div>
                    </div>
                 </div>
                 
                 <div className="col-md-6">
                    <div className="small fw-black text-muted text-uppercase mb-3" style={{ letterSpacing: '1px' }}>Operational Scope</div>
                    <div className="d-flex align-items-center gap-3 mb-4">
                       <div className="p-3 rounded-circle bg-light"><FiMapPin className="text-danger" /></div>
                       <div>
                          <div className="small text-muted fw-bold">COVERAGE AREAS</div>
                          <div className="fw-black text-dark">{departmentInfo?.coverageAreas?.join(', ') || 'All Regions'}</div>
                       </div>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                       <div className="p-3 rounded-circle bg-light"><FiCalendar className="text-warning" /></div>
                       <div>
                          <div className="small text-muted fw-bold">APPOINTED SINCE</div>
                          <div className="fw-black text-dark">{new Date(profile?.createdAt).toLocaleDateString()}</div>
                       </div>
                    </div>
                 </div>
              </div>
           </motion.div>
        </div>

        {/* Action Panel */}
        <div className="col-lg-4">
           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-white p-4 p-lg-5 shadow-sm border border-light h-100" style={{ borderRadius: '40px' }}>
              <FiFileText size={48} className="mb-4 text-primary" />
              <h4 className="fw-black mb-3">ADMINISTRATIVE STATUS</h4>
              <p className="text-muted small mb-5">Your profile is locked for integrity. Contact HR for credential updates.</p>
              
              <div className="d-flex flex-column gap-3">
                 <div className="p-4 rounded-4 bg-light border border-light">
                    <div className="small fw-black text-muted text-uppercase mb-1">Active Cases</div>
                    <div className="fw-black text-dark" style={{ fontSize: '1.5rem' }}>{profile?.assignedComplaints?.length || 0}</div>
                 </div>
                 <div className="p-4 rounded-4 bg-light border border-light">
                    <div className="small fw-black text-muted text-uppercase mb-1">Authority Level</div>
                    <div className="fw-black text-primary" style={{ fontSize: '1.5rem' }}>{departmentInfo?.moderatorAuthority || 'Standard'}</div>
                 </div>
              </div>
           </motion.div>
        </div>
      </div>

      <style>{`
        .fw-black { font-weight: 900; }
      `}</style>
    </div>
  );
};

export default ModeratorProfile;
