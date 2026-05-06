import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiMenu, FiX, FiLogOut, FiUser } from 'react-icons/fi';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch (e) { return null; }
  });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    const onAuthChanged = () => setUser(() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } });
    window.addEventListener('authChanged', onAuthChanged);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('authChanged', onAuthChanged);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/logout`, { method: 'POST', credentials: 'include' });
    } catch (e) {}
    localStorage.clear();
    window.dispatchEvent(new Event('authChanged'));
    setUser(null);
    navigate('/');
  };

  const navLinks = [
    { name: 'Services', to: '/#features' },
    { name: 'About', to: '/about' },
    { name: 'Impact', to: '/impact' },
  ];

  const role = (user?.role || '').toLowerCase();

  return (
    <nav className="fixed-top transition-all duration-700" 
         style={{ 
           top: scrolled ? '10px' : '20px',
           width: '100%',
           display: 'flex',
           justifyContent: 'center',
           zIndex: 1100,
           pointerEvents: 'none'
         }}>
      <div style={{ 
        width: '90%', 
        maxWidth: '1200px', 
        backgroundColor: scrolled ? 'rgba(255, 255, 255, 0.92)' : 'rgba(255, 255, 255, 0.4)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(0, 0, 0, 0.05)',
        borderRadius: scrolled ? '30px' : '50px',
        padding: scrolled ? '0.6rem 2.5rem' : '0.8rem 3rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: scrolled ? '0 15px 35px rgba(0,0,0,0.05)' : 'none',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: 'auto'
      }}>
        <Link className="d-flex align-items-center" to="/" style={{ color: '#000', textDecoration: 'none' }}>
          <div className="fw-black" style={{ fontSize: '1.4rem', letterSpacing: '1px' }}>SAMAAJ<span style={{ color: '#FF7A45' }}>.</span></div>
        </Link>

        {/* Desktop Links */}
        <div className="d-none d-lg-flex align-items-center gap-5">
          {navLinks.map((link) => (
            <Link key={link.name} to={link.to} 
               style={{ 
                 color: '#000', 
                 fontWeight: '700', 
                 fontSize: '0.75rem', 
                 textTransform: 'uppercase', 
                 letterSpacing: '1.5px', 
                 textDecoration: 'none',
                 opacity: location.pathname === link.to ? 1 : 0.6,
                 transition: 'opacity 0.3s' 
               }}>
              {link.name}
            </Link>
          ))}
        </div>

        <div className="d-flex gap-4 align-items-center">
          {user ? (
            <>
              <Link to={role === 'moderator' ? '/moderator-dashboard' : '/dashboard'} 
                    style={{ color: '#000', textDecoration: 'none', fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                DASHBOARD
              </Link>
              <button onClick={handleLogout} className="btn py-2 px-4" 
                      style={{ backgroundColor: '#000', color: '#fff', fontWeight: '800', fontSize: '0.7rem', textTransform: 'uppercase', borderRadius: '50px', transition: 'transform 0.2s' }}
                      onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                      onMouseLeave={e => e.target.style.transform = 'scale(1)'}>
                LOGOUT
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ color: '#000', textDecoration: 'none', fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px' }}>LOGIN</Link>
              <Link to="/signup" className="btn py-2 px-4" 
                    style={{ backgroundColor: '#000', color: '#fff', fontWeight: '800', fontSize: '0.7rem', textTransform: 'uppercase', borderRadius: '50px' }}>
                START NOW
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
