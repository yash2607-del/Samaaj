import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css'; // Move relevant navbar styles here

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

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

  return (
    <nav className="navbar navbar-expand-lg navbar-custom fixed-top">
      <div className="container">
        <a className="navbar-brand text-golden fw-bold" href="#home">Samaaj</a>
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
          <ul className="navbar-nav ms-auto">
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
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
