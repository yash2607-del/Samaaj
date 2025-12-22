import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FiUser, FiLogOut } from 'react-icons/fi';
import img1 from '../../assets/img1.jpg';
import img2 from '../../assets/img2.jpg';
import img3 from '../../assets/img3.jpg';
import './landing.css';

const Home = () => {
  const navigate = useNavigate();
  const raw = localStorage.getItem('user');
  const user = raw ? JSON.parse(raw) : null;
  const role = (user?.role || '').toLowerCase();

  const handleLogout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/logout`, { method: 'POST', credentials: 'include' });
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    // notify other components
    window.dispatchEvent(new Event('authChanged'));
    navigate('/');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <nav className="navbar navbar-expand-lg bg-white sticky-top" style={{ padding: '1.2rem 0', borderBottom: '1px solid #e0e0e0' }}>
        <div className="container">
          <a className="navbar-brand fw-bold" href="#home" style={{ fontSize: '1.4rem', color: '#FFB347', letterSpacing: '-0.5px' }}>
            Samaaj
          </a>
          <div className="d-flex ms-auto align-items-center gap-3">
            {user ? (
              <>
                <Link to={/moderator/i.test(role) ? '/moderator-profile' : '/user-profile'} className="btn btn-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: '44px', height: '44px' }} title="Profile">
                  <FiUser />
                </Link>
                <button className="btn btn-outline-secondary" onClick={handleLogout} title="Logout">
                  <FiLogOut />
                </button>
              </>
            ) : (
              <></>
            )}
          </div>
        </div>
      </nav>

      {/* Reuse Landing hero and sections with minor role-based tweaks */}
      <section id="home" className="py-5" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', minHeight: '90vh', display: 'flex', alignItems: 'center' }}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 text-center text-lg-start mb-5 mb-lg-0">
              <h1 className="display-3 fw-bold mb-4" style={{ color: '#1a1a1a', lineHeight: '1.2' }}>
                {role === 'moderator' ? 'Moderator Dashboard' : 'Welcome to Samaaj'}
              </h1>
              <p className="lead mb-4" style={{ color: '#616161', fontSize: '1.25rem' }}>
                {role === 'moderator'
                  ? 'Manage and verify reported issues in your assigned areas.'
                  : 'Report local problems, track progress, and help build a better community.'}
              </p>
              <div className="d-flex gap-3 justify-content-center justify-content-lg-start">
                {role !== 'moderator' && (
                  <Link to="/complaint" className="btn btn-lg px-5 py-3" style={{ backgroundColor: '#FFB347', color: 'white', border: 'none', borderRadius: '30px', fontWeight: '600' }}>
                    File Complaint
                  </Link>
                )}
                <Link to={role === 'moderator' ? '/moderator-complaints' : '/dashboard'} className="btn btn-lg btn-outline-secondary px-5 py-3" style={{ borderRadius: '30px', fontWeight: '600' }}>
                  {role === 'moderator' ? 'Manage Complaints' : 'Track Issues'}
                </Link>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="position-relative">
                <div id="heroCarousel" className="carousel slide shadow-lg" data-bs-ride="carousel" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                  <div className="carousel-inner">
                    <div className="carousel-item active">
                      <img src={img1} className="d-block w-100" alt="" style={{ height: '500px', objectFit: 'cover' }} />
                    </div>
                    <div className="carousel-item">
                      <img src={img2} className="d-block w-100" alt="" style={{ height: '500px', objectFit: 'cover' }} />
                    </div>
                    <div className="carousel-item">
                      <img src={img3} className="d-block w-100" alt="" style={{ height: '500px', objectFit: 'cover' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-4 bg-dark text-white text-center">
        <div className="container">
          <p className="mb-0">&copy; 2025 Samaaj. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
