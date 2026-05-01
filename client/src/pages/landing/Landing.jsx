import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FiCheckCircle, FiMapPin, FiUsers, FiTrendingUp, FiArrowRight } from 'react-icons/fi';
import img1 from '../../assets/img1.jpg';
import img2 from '../../assets/img2.jpg';
import img3 from '../../assets/img3.jpg';

const Landing = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinkStyle = { color: '#555', fontWeight: '600', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', transition: 'color 0.3s ease', padding: '0 15px' };

  return (
    <div style={{ backgroundColor: '#FAF8F5', color: '#222', fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
      {/* Lagom-inspired Navbar */}
      <nav className={`navbar navbar-expand-lg fixed-top bg-white`} style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(0,0,0,0.05)', backgroundColor: '#FAF8F5 !important' }}>
        <div className="container-fluid px-4 px-lg-5">
          <a className="navbar-brand d-flex align-items-center" href="#home" style={{ color: '#222' }}>
            <div style={{ width: '30px', height: '30px', border: '3px solid #222', borderBottom: 'none', position: 'relative', marginRight: '10px' }}>
              <div style={{ position: 'absolute', top: '-10px', left: '10px', width: '15px', height: '15px', borderTop: '3px solid #222', borderRight: '3px solid #222', transform: 'rotate(-45deg)' }}></div>
            </div>
            <div>
              <div className="fw-bold" style={{ fontSize: '1.4rem', lineHeight: '1', letterSpacing: '1px' }}>SAMAAJ</div>
              <div style={{ fontSize: '0.65rem', letterSpacing: '2px', color: '#666' }}>PLATFORM</div>
            </div>
          </a>
          <button
            className="navbar-toggler border-0"
            type="button"
            onClick={() => setIsNavOpen(open => !open)}
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className={`collapse navbar-collapse ${isNavOpen ? 'show bg-white p-4 mt-3 rounded shadow-sm' : ''}`} id="navbarNav">
            <ul className="navbar-nav mx-auto align-items-lg-center">
              <li className="nav-item">
                <a className="nav-link" href="#features" style={{ ...navLinkStyle, color: '#FF7A45' }} onClick={() => setIsNavOpen(false)}>Services</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#about" style={navLinkStyle} onClick={() => setIsNavOpen(false)}>About Us</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#contact" style={navLinkStyle} onClick={() => setIsNavOpen(false)}>Contact</a>
              </li>
            </ul>
            <div className="d-flex gap-4 align-items-center mt-3 mt-lg-0">
              <div style={{ fontWeight: '600', fontSize: '0.95rem', color: '#444' }}>
                <Link to="/login" style={{ color: 'inherit', textDecoration: 'none' }}>Login</Link>
              </div>
              <div className="d-flex gap-3 text-muted">
                <span>+91 98765 43210</span>
              </div>
              <Link to="/signup" className="btn" style={{ backgroundColor: '#FF7A45', color: '#fff', fontWeight: 'bold', fontSize: '0.9rem', letterSpacing: '0.5px', padding: '0.8rem 1.8rem', borderRadius: '0' }}>
                START NOW
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" style={{ 
        height: '100vh', 
        position: 'relative', 
        overflow: 'hidden',
        backgroundImage: `url(${img1})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          pointerEvents: 'none'
        }}>
          <h1 style={{ 
            fontSize: 'clamp(5rem, 20vw, 25rem)', 
            fontWeight: '900', 
            color: '#FAF8F5', 
            margin: 0, 
            lineHeight: '0.8',
            letterSpacing: '-0.05em',
            userSelect: 'none'
          }}>
            SAMAAJ
          </h1>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{ padding: '8rem 0', backgroundColor: '#0a0a0a' }}>
        <div className="container">
          <div className="row mb-5">
            <div className="col-lg-8">
              <h2 className="fw-bolder mb-3" style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', lineHeight: '1', color: '#ffffff', letterSpacing: '-0.03em' }}>OUR CAPABILITIES</h2>
              <p style={{ fontSize: '1.4rem', color: '#888', fontWeight: '300', maxWidth: '500px' }}>Streamlined tools designed to bridge the gap between citizens and authorities.</p>
            </div>
          </div>
          <div className="row g-5">
            {[
              { icon: <FiMapPin />, title: "Real-Time Action", desc: "Report issues instantly with geolocation and media proof directly from your device." },
              { icon: <FiTrendingUp />, title: "Live Tracking", desc: "Monitor your reports as they move through resolution stages with total transparency." },
              { icon: <FiUsers />, title: "Community Driven", desc: "Engage with nearby reports, upvote critical issues, and foster local collaboration." },
              { icon: <FiCheckCircle />, title: "Verified Results", desc: "Moderators ensure accurate routing and swift resolution by relevant departments." }
            ].map((feature, idx) => (
              <div key={idx} className="col-md-6">
                <div style={{ borderTop: '1px solid #333', padding: '3rem 0', height: '100%' }}>
                  <div className="mb-4" style={{ fontSize: '2.5rem', color: '#FFB347' }}>
                    {feature.icon}
                  </div>
                  <h4 className="fw-bold mb-3" style={{ fontSize: '1.8rem', color: '#fff' }}>{feature.title}</h4>
                  <p style={{ fontSize: '1.1rem', color: '#999', lineHeight: '1.6', fontWeight: '300' }}>
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" style={{ padding: '8rem 0', backgroundColor: '#050505', borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a' }}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 mb-5 mb-lg-0">
              <h2 className="fw-bolder mb-4" style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', lineHeight: '1', color: '#ffffff', letterSpacing: '-0.03em' }}>
                BRIDGING <br/><span style={{ color: '#888' }}>THE GAP.</span>
              </h2>
            </div>
            <div className="col-lg-6">
              <p className="mb-4" style={{ fontSize: '1.4rem', color: '#ccc', lineHeight: '1.6', fontWeight: '300' }}>
                Samaaj is a modern platform that breaks down the barriers between citizens and local governance. We provide the infrastructure to turn local grievances into actionable, trackable data.
              </p>
              <p style={{ fontSize: '1.1rem', color: '#888', lineHeight: '1.8', fontWeight: '300' }}>
                Through community participation, moderated workflows, and real-time accountability, we bring people and solutions together to build cleaner, safer, and more responsive neighborhoods.
              </p>
            </div>
          </div>
          <div className="row mt-5 pt-5 g-4" style={{ borderTop: '1px solid #222' }}>
            {[
              { num: "1000+", label: "Issues Resolved" },
              { num: "500+", label: "Active Citizens" },
              { num: "50+", label: "Moderators" },
              { num: "24/7", label: "Availability" }
            ].map((stat, i) => (
              <div key={i} className="col-6 col-md-3">
                <h3 className="fw-bolder" style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', color: '#fff' }}>{stat.num}</h3>
                <p style={{ fontSize: '1rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" style={{ padding: '8rem 0', backgroundColor: '#FFB347' }}>
        <div className="container text-center">
          <h2 className="fw-bolder mb-4" style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', color: '#000', letterSpacing: '-0.03em' }}>
            STAY CONNECTED.
          </h2>
          <p className="mb-5 mx-auto" style={{ fontSize: '1.4rem', color: '#222', maxWidth: '600px', fontWeight: '500' }}>
            Join our newsletter and receive the latest updates directly in your inbox.
          </p>
          <div className="row justify-content-center">
            <div className="col-md-8 col-lg-6">
              <form className="d-flex flex-column flex-sm-row gap-3">
                <input
                  type="email"
                  className="form-control form-control-lg bg-transparent"
                  placeholder="EMAIL ADDRESS"
                  required
                  style={{ borderRadius: '0', border: 'none', borderBottom: '2px solid #000', color: '#000', boxShadow: 'none', fontWeight: '600', paddingLeft: '0' }}
                />
                <button 
                  type="submit" 
                  className="btn btn-lg px-5"
                  style={{ backgroundColor: '#000', color: '#fff', borderRadius: '50px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '4rem 0', backgroundColor: '#000', borderTop: '1px solid #1a1a1a' }}>
        <div className="container d-flex flex-column flex-md-row justify-content-between align-items-center">
          <h4 className="fw-bold mb-3 mb-md-0" style={{ color: '#fff', letterSpacing: '-1px' }}>Samaaj<span style={{ color: '#FFB347' }}>.</span></h4>
          <p className="mb-0" style={{ color: '#666', fontSize: '0.9rem' }}>&copy; 2026 Samaaj Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
