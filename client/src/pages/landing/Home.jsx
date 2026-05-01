import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FiUser, FiLogOut, FiArrowRight } from 'react-icons/fi';
import './landing.css';

const Home = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const raw = localStorage.getItem('user');
  const user = raw ? JSON.parse(raw) : null;
  const role = (user?.role || '').toLowerCase();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    <div style={{ minHeight: '100vh', backgroundColor: '#050505', color: '#f3f3f3', fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
      
      {/* Lagom-inspired Navbar */}
      <nav className={`navbar navbar-expand-lg fixed-top ${scrolled ? 'bg-black shadow-sm' : 'bg-transparent'}`} style={{ padding: scrolled ? '1rem 0' : '2rem 0', transition: 'all 0.4s ease' }}>
        <div className="container">
          <a className="navbar-brand fw-bold" href="#home" style={{ fontSize: '2rem', color: '#f3f3f3', letterSpacing: '-1px' }}>
            Samaaj<span style={{ color: '#FFB347' }}>.</span>
          </a>
          <div className="d-flex ms-auto align-items-center gap-3">
            {user && (
              <>
                <Link to={/moderator/i.test(role) ? '/moderator-profile' : '/user-profile'} className="btn d-flex align-items-center justify-content-center" style={{ backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #333', width: '44px', height: '44px', borderRadius: '50%', transition: 'all 0.3s ease' }} title="Profile">
                  <FiUser />
                </Link>
                <button className="btn" onClick={handleLogout} style={{ backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #333', width: '44px', height: '44px', borderRadius: '50%', transition: 'all 0.3s ease' }} title="Logout">
                  <FiLogOut />
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: '100px', position: 'relative', overflow: 'hidden' }}>
        <div className="container position-relative z-1">
          <div className="row">
            <div className="col-12 col-lg-10">
              <h1 className="fw-bolder mb-4" style={{ fontSize: 'clamp(3rem, 8vw, 7.5rem)', lineHeight: '0.9', letterSpacing: '-0.04em', color: '#ffffff' }}>
                {role === 'moderator' ? 'MANAGE.' : 'REPORT.'}<br/>
                {role === 'moderator' ? 'VERIFY.' : 'TRACK.'}<br/>
                <span style={{ color: '#FFB347' }}>{role === 'moderator' ? 'RESOLVE.' : 'RESOLVE.'}</span>
              </h1>
              <p className="mb-5" style={{ fontSize: 'clamp(1.2rem, 2vw, 1.8rem)', color: '#a0a0a0', maxWidth: '700px', lineHeight: '1.4', fontWeight: '300' }}>
                {role === 'moderator'
                  ? 'Access your moderation dashboard. Manage, verify, and seamlessly route issues raised by citizens in your assigned areas.'
                  : 'Elevating civic engagement. Report local issues and drive real-time community transformation through transparent tracking.'}
              </p>
              <div className="d-flex gap-4 flex-wrap">
                {role !== 'moderator' && (
                  <Link to="/complaint" className="btn btn-lg d-flex align-items-center gap-2" style={{ backgroundColor: '#FFB347', color: '#050505', borderRadius: '50px', padding: '1rem 2.5rem', fontWeight: '600', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    File Complaint <FiArrowRight />
                  </Link>
                )}
                <Link to={role === 'moderator' ? '/moderator-complaints' : '/dashboard'} className="btn btn-lg px-4" style={{ backgroundColor: 'transparent', color: '#f3f3f3', border: '1px solid #444', borderRadius: '50px', padding: '1rem 2.5rem', fontWeight: '500', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {role === 'moderator' ? 'Manage Complaints' : 'Track Issues'}
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(255,179,71,0.06) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%', zIndex: 0, pointerEvents: 'none' }}></div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '2rem 0', backgroundColor: '#000', borderTop: '1px solid #1a1a1a' }}>
        <div className="container d-flex flex-column flex-md-row justify-content-between align-items-center text-center">
          <p className="mb-0" style={{ color: '#666', fontSize: '0.9rem' }}>&copy; 2026 Samaaj Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
