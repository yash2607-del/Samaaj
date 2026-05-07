import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FiUser, FiMail, FiCalendar, FiFileText, FiArrowLeft, FiActivity, FiShield } from "react-icons/fi";
import { MapPin } from "lucide-react";
import { motion } from "framer-motion";

const UserProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [complaintCount, setComplaintCount] = useState(0);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) { navigate("/login"); return; }
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(response.data.user);
        const userId = response.data.user.userId || response.data.user._id;
        const complaintsResponse = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/complaints`, {
          params: { userId },
          headers: { Authorization: `Bearer ${token}` },
        });
        setComplaintCount(complaintsResponse.data?.data?.length || 0);
      } catch (err) {
        setError("Failed to load profile");
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
          <FiArrowLeft /> BACK TO PORTAL
        </button>
        <h1 className="fw-black mb-1 text-dark" style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', letterSpacing: '-2px', lineHeight: '1' }}>
          CITIZEN IDENTITY<span style={{ color: '#FF7A45' }}>.</span>
        </h1>
        <p className="text-muted fw-medium">Verified credentials and activity overview.</p>
      </header>

      <div className="row g-4">
        {/* Profile Card */}
        <div className="col-lg-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-4 p-lg-5 shadow-sm border border-light" style={{ borderRadius: '40px' }}>
            <div className="d-flex flex-column flex-md-row align-items-center gap-4 mb-5 pb-5 border-bottom border-light">
               <div className="flex-shrink-0" style={{ width: '120px', height: '120px', borderRadius: '40px', background: '#FF7A45', display: 'flex', alignItems: 'center', justifyCenter: 'center', boxShadow: '0 20px 40px rgba(255,122,69,0.2)' }}>
                  <FiUser size={60} color="#fff" className="mx-auto" />
               </div>
               <div className="text-center text-md-start">
                  <h2 className="fw-black text-dark mb-1">{profile?.name?.toUpperCase()}</h2>
                  <div className="d-flex align-items-center justify-content-center justify-content-md-start gap-2">
                     <FiShield className="text-success" />
                     <span className="fw-bold text-muted small text-uppercase" style={{ letterSpacing: '1px' }}>Verified Contributor</span>
                  </div>
               </div>
            </div>

            <div className="row g-5">
               <div className="col-md-6">
                  <div className="small fw-black text-muted text-uppercase mb-3" style={{ letterSpacing: '1px' }}>Contact Details</div>
                  <div className="d-flex align-items-center gap-3 mb-4">
                     <div className="p-3 rounded-circle bg-light"><FiMail className="text-primary" /></div>
                     <div>
                        <div className="small text-muted fw-bold">EMAIL ADDRESS</div>
                        <div className="fw-black text-dark">{profile?.email}</div>
                     </div>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                     <div className="p-3 rounded-circle bg-light"><MapPin className="text-danger" /></div>
                     <div>
                        <div className="small text-muted fw-bold">PRIMARY REGION</div>
                        <div className="fw-black text-dark">{profile?.location || 'New Delhi'}</div>
                     </div>
                  </div>
               </div>
               
               <div className="col-md-6">
                  <div className="small fw-black text-muted text-uppercase mb-3" style={{ letterSpacing: '1px' }}>Account Status</div>
                  <div className="d-flex align-items-center gap-3 mb-4">
                     <div className="p-3 rounded-circle bg-light"><FiCalendar className="text-success" /></div>
                     <div>
                        <div className="small text-muted fw-bold">MEMBER SINCE</div>
                        <div className="fw-black text-dark">{new Date(profile?.createdAt).toLocaleDateString()}</div>
                     </div>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                     <div className="p-3 rounded-circle bg-light"><FiActivity className="text-warning" /></div>
                     <div>
                        <div className="small text-muted fw-bold">LIFETIME REPORTS</div>
                        <div className="fw-black text-dark">{complaintCount} ISSUES</div>
                     </div>
                  </div>
               </div>
            </div>
          </motion.div>
        </div>

        {/* Side Stats */}
        <div className="col-lg-4">
           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-dark p-4 p-lg-5 text-white shadow-xl h-100" style={{ borderRadius: '40px' }}>
              <FiShield size={48} className="mb-4 text-warning" />
              <h4 className="fw-black mb-3">CITIZEN REPUTATION</h4>
              <p className="text-muted small mb-5">Your reputation score is based on the accuracy and resolution rate of your reports.</p>
              
              <div className="mb-4">
                 <div className="d-flex justify-content-between small fw-black mb-2">
                    <span>TRUST LEVEL</span>
                    <span>92%</span>
                 </div>
                 <div className="progress" style={{ height: '6px', background: 'rgba(255,255,255,0.1)' }}>
                    <div className="progress-bar bg-warning" style={{ width: '92%' }}></div>
                 </div>
              </div>

              <div className="p-4 rounded-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                 <div className="small fw-black text-warning text-uppercase mb-2">Pro Tip</div>
                 <p className="small mb-0 opacity-70">Providing high-resolution photos and accurate landmarks speeds up department response times.</p>
              </div>
           </motion.div>
        </div>
      </div>

      <style>{`
        .fw-black { font-weight: 900; }
        .shadow-xl { boxShadow: 0 30px 60px rgba(0,0,0,0.12); }
      `}</style>
    </div>
  );
};

export default UserProfile;
