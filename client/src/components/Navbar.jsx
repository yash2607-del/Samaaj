import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css'; // Move relevant navbar styles here
import { FiUser, FiLogOut } from 'react-icons/fi';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } });

  useEffect(() => {
    const handleSectionScroll = () => {
      const sections = ['home', 'features', 'about'];
      let current = 'home';
      for (let id of sections) {
        const el = document.getElementById(id);
        if (el && window.scrollY + 150 >= el.offsetTop) {
          current = id;
        }
      }
      setActiveSection(current);
    };

    const handleNavbarScroll = () => {
      const nav = document.querySelector('.navbar-custom');
      if (window.scrollY > 50) {
        nav.classList.add('navbar-scrolled');
      } else {
        nav.classList.remove('navbar-scrolled');
      }
    };

    window.addEventListener('scroll', handleSectionScroll);
    window.addEventListener('scroll', handleNavbarScroll);
    return () => {
      window.removeEventListener('scroll', handleSectionScroll);
      window.removeEventListener('scroll', handleNavbarScroll);
    };
  }, []);

  useEffect(() => {
    const onAuthChanged = () => setUser(() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } });
    window.addEventListener('authChanged', onAuthChanged);
    window.addEventListener('storage', onAuthChanged);
    return () => {
      window.removeEventListener('authChanged', onAuthChanged);
      window.removeEventListener('storage', onAuthChanged);
    };
  }, []);

  return (
    <nav className="navbar navbar-expand-lg navbar-custom bg-black/50 backdrop-blur-md p-4 rounded fixed-top">
      <div className="container">
        <a className="navbar-brand text-golden fw-bold display-4" href="#home">Samaaj</a>
        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-controls="navbarNav"
          aria-expanded={isOpen}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className={`collapse navbar-collapse ${isOpen ? 'show' : ''}`} id="navbarNav">
          <ul className="navbar-nav ms-auto d-flex align-items-center">
            {['home', 'features', 'about'].map((section) => (
              <li className="nav-item" key={section}>
                <a
                  href={`#${section}`}
                  className={`nav-link nav-link-custom ${activeSection === section ? 'active' : ''}`}
                  onClick={() => setIsOpen(false)}
                >
                  {section.charAt(0).toUpperCase() + section.slice(1)}
                </a>
              </li>
            ))}
            {/* show login/signup when not authenticated, otherwise show profile + logout */}
            {user ? (
              <>
                <li className="nav-item d-flex align-items-center me-2">
                  <Link to={/moderator/i.test((user.role||'').toLowerCase()) ? '/moderator-profile' : '/user-profile'} className="btn btn-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                    <FiUser />
                  </Link>
                </li>
                <li className="nav-item">
                  <LogoutButton />
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link to="/signup" className="nav-link nav-link-custom" onClick={() => setIsOpen(false)}>
                    Signup
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/login" className="nav-link nav-link-custom" onClick={() => setIsOpen(false)}>
                    Login
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );

const LogoutButton = () => {
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/logout`, { method: 'POST', credentials: 'include' });
    } catch (e) {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    // notify other components
    window.dispatchEvent(new Event('authChanged'));
    navigate('/');
  };
  return (
    <button className="btn btn-outline-light ms-2" onClick={handleLogout} title="Logout">
      <FiLogOut />
    </button>
  );
};
};

export default Navbar;
