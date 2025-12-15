import React from 'react';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FiCheckCircle, FiMapPin, FiUsers, FiTrendingUp } from 'react-icons/fi';
import img1 from '../../assets/img1.jpg';
import img2 from '../../assets/img2.jpg';
import img3 from '../../assets/img3.jpg';
import img4 from '../../assets/img4.jpg';

const Landing = () => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Minimalist Navbar */}
      <nav className="navbar navbar-expand-lg bg-white sticky-top" style={{ padding: '1.2rem 0', borderBottom: '1px solid #e0e0e0' }}>
        <div className="container">
          <a className="navbar-brand fw-bold" href="#home" style={{ fontSize: '1.4rem', color: '#FFB347', letterSpacing: '-0.5px' }}>
            Samaaj
          </a>
          <button
            className="navbar-toggler border-0"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
            style={{ boxShadow: 'none' }}
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav mx-auto align-items-lg-center">
              <li className="nav-item">
                <a 
                  className="nav-link px-4" 
                  href="#features" 
                  style={{ color: '#616161', fontWeight: '400', fontSize: '0.95rem', transition: 'transform 0.2s ease' }}
                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  Features
                </a>
              </li>
              <li className="nav-item">
                <a 
                  className="nav-link px-4" 
                  href="#about" 
                  style={{ color: '#616161', fontWeight: '400', fontSize: '0.95rem', transition: 'transform 0.2s ease' }}
                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  About
                </a>
              </li>
              <li className="nav-item">
                <a 
                  className="nav-link px-4" 
                  href="#contact" 
                  style={{ color: '#616161', fontWeight: '400', fontSize: '0.95rem', transition: 'transform 0.2s ease' }}
                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  Contact
                </a>
              </li>
            </ul>
            <div className="d-flex gap-2 align-items-center mt-2 mt-lg-0">
              <Link 
                to="/login" 
                className="btn px-4 py-2" 
                style={{ 
                  backgroundColor: 'transparent',
                  border: '1px solid #FFB347',
                  color: '#616161',
                  fontWeight: '500',
                  fontSize: '0.95rem',
                  borderRadius: '6px',
                  transition: 'transform 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                Login
              </Link>
              <Link 
                to="/signup" 
                className="btn px-4 py-2" 
                style={{ 
                  backgroundColor: 'transparent',
                  border: '1px solid #FFB347',
                  color: '#2c2c2c',
                  fontWeight: '500',
                  fontSize: '0.95rem',
                  borderRadius: '6px',
                  transition: 'transform 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="py-5" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', minHeight: '90vh', display: 'flex', alignItems: 'center' }}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 text-center text-lg-start mb-5 mb-lg-0">
              <h1 className="display-3 fw-bold mb-4" style={{ color: '#1a1a1a', lineHeight: '1.2' }}>
                Report. Track. Resolve.
              </h1>
              <p className="lead mb-4" style={{ color: '#616161', fontSize: '1.25rem' }}>
                Your civic issues matter. With Samaaj, report local problems, track progress in real-time, 
                and help build a better community together.
              </p>
              <div className="d-flex gap-3 justify-content-center justify-content-lg-start">
                <Link to="/signup" className="btn btn-lg px-5 py-3" style={{ backgroundColor: '#FFB347', color: 'white', border: 'none', borderRadius: '30px', fontWeight: '600' }}>
                  Complaint
                </Link>
                <Link to="/login" className="btn btn-lg btn-outline-secondary px-5 py-3" style={{ borderRadius: '30px', fontWeight: '600' }}>
                  Resolve
                </Link>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="position-relative">
                <div id="heroCarousel" className="carousel slide shadow-lg" data-bs-ride="carousel" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                  <div className="carousel-indicators">
                    <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="0" className="active" aria-current="true" aria-label="Slide 1"></button>
                    <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="1" aria-label="Slide 2"></button>
                    <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="2" aria-label="Slide 3"></button>
                  </div>
                  <div className="carousel-inner">
                    <div className="carousel-item active">
                      <img 
                        src={img1} 
                        className="d-block w-100" 
                        alt="Community Issue" 
                        style={{ height: '500px', objectFit: 'cover' }}
                      />
                    </div>
                    <div className="carousel-item">
                      <img 
                        src={img2} 
                        className="d-block w-100" 
                        alt="Civic Problem" 
                        style={{ height: '500px', objectFit: 'cover' }}
                      />
                    </div>
                    <div className="carousel-item">
                      <img 
                        src={img3} 
                        className="d-block w-100" 
                        alt="Local Issue" 
                        style={{ height: '500px', objectFit: 'cover' }}
                      />
                    </div>
                  </div>
                  <button className="carousel-control-prev" type="button" data-bs-target="#heroCarousel" data-bs-slide="prev">
                    <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                    <span className="visually-hidden">Previous</span>
                  </button>
                  <button className="carousel-control-next" type="button" data-bs-target="#heroCarousel" data-bs-slide="next">
                    <span className="carousel-control-next-icon" aria-hidden="true"></span>
                    <span className="visually-hidden">Next</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-5 bg-white">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold mb-3" style={{ color: '#1a1a1a' }}>Key Features</h2>
            <p className="text-muted" style={{ fontSize: '1.1rem' }}>
              Everything you need to report and track civic issues
            </p>
          </div>
          <div className="row g-4">
            <div className="col-md-6 col-lg-3">
              <div className="card border-0 shadow-sm h-100 p-4 text-center" style={{ borderRadius: '15px' }}>
                <div className="mb-3">
                  <div className="rounded-circle d-inline-flex align-items-center justify-content-center" 
                       style={{ width: '70px', height: '70px', backgroundColor: '#FFF8F0' }}>
                    <FiMapPin style={{ color: '#FFB347', fontSize: '30px' }} />
                  </div>
                </div>
                <h5 className="fw-bold mb-3" style={{ color: '#1a1a1a' }}>Real-Time Reporting</h5>
                <p className="text-muted">
                  Report issues instantly with photos, location, and detailed descriptions from your device.
                </p>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="card border-0 shadow-sm h-100 p-4 text-center" style={{ borderRadius: '15px' }}>
                <div className="mb-3">
                  <div className="rounded-circle d-inline-flex align-items-center justify-content-center" 
                       style={{ width: '70px', height: '70px', backgroundColor: '#E3F2FD' }}>
                    <FiTrendingUp style={{ color: '#2196F3', fontSize: '30px' }} />
                  </div>
                </div>
                <h5 className="fw-bold mb-3" style={{ color: '#1a1a1a' }}>Progress Tracking</h5>
                <p className="text-muted">
                  Track your complaints in real-time and get updates on resolution progress.
                </p>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="card border-0 shadow-sm h-100 p-4 text-center" style={{ borderRadius: '15px' }}>
                <div className="mb-3">
                  <div className="rounded-circle d-inline-flex align-items-center justify-content-center" 
                       style={{ width: '70px', height: '70px', backgroundColor: '#E8F5E9' }}>
                    <FiUsers style={{ color: '#4CAF50', fontSize: '30px' }} />
                  </div>
                </div>
                <h5 className="fw-bold mb-3" style={{ color: '#1a1a1a' }}>Community Focus</h5>
                <p className="text-muted">
                  See nearby issues in your community and collaborate for better solutions.
                </p>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="card border-0 shadow-sm h-100 p-4 text-center" style={{ borderRadius: '15px' }}>
                <div className="mb-3">
                  <div className="rounded-circle d-inline-flex align-items-center justify-content-center" 
                       style={{ width: '70px', height: '70px', backgroundColor: '#FFF8F0' }}>
                    <FiCheckCircle style={{ color: '#FFB347', fontSize: '30px' }} />
                  </div>
                </div>
                <h5 className="fw-bold mb-3" style={{ color: '#1a1a1a' }}>Verified Actions</h5>
                <p className="text-muted">
                  Moderators verify and route issues to relevant departments for quick resolution.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-5" style={{ backgroundColor: '#f8f9fa' }}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 mb-4 mb-lg-0">
              <h2 className="fw-bold mb-4" style={{ color: '#1a1a1a' }}>About Samaaj</h2>
              <p className="lead mb-4" style={{ color: '#424242' }}>
                Bridging Citizens and Solutions for a Better Community
              </p>
              <p style={{ color: '#616161', lineHeight: '1.8' }}>
                Samaaj is more than just a civic issue reporting platform—it's a bridge between citizens 
                and the change they wish to see. With a simple, user-friendly interface, Samaaj empowers 
                individuals to voice their concerns, report local issues, and track progress transparently.
              </p>
              <p style={{ color: '#616161', lineHeight: '1.8' }}>
                Moderators respond in real-time, ensuring accountability and swift resolution. By fostering 
                active community participation and streamlined communication, Samaaj brings people and 
                solutions together to build cleaner, safer, and more responsive neighborhoods.
              </p>
            </div>
            <div className="col-lg-6">
              <div className="row g-3">
                <div className="col-6">
                  <div className="card border-0 shadow-sm p-4 text-center" style={{ borderRadius: '15px', backgroundColor: '#FFF8F0' }}>
                    <h3 className="fw-bold mb-2" style={{ color: '#FFB347' }}>1000+</h3>
                    <p className="mb-0" style={{ color: '#616161' }}>Issues Resolved</p>
                  </div>
                </div>
                <div className="col-6">
                  <div className="card border-0 shadow-sm p-4 text-center" style={{ borderRadius: '15px', backgroundColor: '#E8F5E9' }}>
                    <h3 className="fw-bold mb-2" style={{ color: '#4CAF50' }}>500+</h3>
                    <p className="mb-0" style={{ color: '#616161' }}>Active Users</p>
                  </div>
                </div>
                <div className="col-6">
                  <div className="card border-0 shadow-sm p-4 text-center" style={{ borderRadius: '15px', backgroundColor: '#E3F2FD' }}>
                    <h3 className="fw-bold mb-2" style={{ color: '#2196F3' }}>50+</h3>
                    <p className="mb-0" style={{ color: '#616161' }}>Moderators</p>
                  </div>
                </div>
                <div className="col-6">
                  <div className="card border-0 shadow-sm p-4 text-center" style={{ borderRadius: '15px', backgroundColor: '#F3E5F5' }}>
                    <h3 className="fw-bold mb-2" style={{ color: '#9C27B0' }}>24/7</h3>
                    <p className="mb-0" style={{ color: '#616161' }}>Support</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-5 bg-white">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="card border-0 shadow-lg p-5" style={{ borderRadius: '20px' }}>
                <div className="text-center mb-4">
                  <h2 className="fw-bold mb-3" style={{ color: '#1a1a1a' }}>Stay Connected</h2>
                  <p style={{ color: '#616161', fontSize: '1.1rem' }}>
                    Enter your email and we'll get back to you with updates, news, and more.
                  </p>
                </div>
                <form className="d-flex flex-column flex-sm-row gap-3">
                  <input
                    type="email"
                    className="form-control form-control-lg"
                    placeholder="Enter your email"
                    required
                    style={{ borderRadius: '12px', border: '2px solid #e0e0e0' }}
                  />
                  <button 
                    type="submit" 
                    className="btn btn-lg px-5"
                    style={{ backgroundColor: '#FFB347', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '600', whiteSpace: 'nowrap' }}
                  >
                    Submit
                  </button>
                </form>
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

export default Landing;
