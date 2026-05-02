import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FiUser, FiLogOut, FiArrowRight, FiMapPin, FiTrendingUp, FiUsers, FiCheckCircle } from 'react-icons/fi';
import './landing.css';

gsap.registerPlugin(ScrollTrigger);

const Home = () => {
  const navigate = useNavigate();
  const raw = localStorage.getItem('user');
  const user = raw ? JSON.parse(raw) : null;
  const role = (user?.role || '').toLowerCase();
  
  const heroRef = useRef(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    gsap.to(heroRef.current, {
      yPercent: 30,
      ease: "none",
      scrollTrigger: {
        trigger: heroRef.current,
        start: "top top",
        end: "bottom top",
        scrub: true
      }
    });

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      lenis.destroy();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/logout`, { method: 'POST', credentials: 'include' });
    } catch (e) {}
    localStorage.clear();
    window.dispatchEvent(new Event('authChanged'));
    navigate('/');
  };

  return (
    <div style={{ backgroundColor: '#050505', color: '#FFF', fontFamily: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif', overflow: 'hidden' }}>
      
      {/* Premium Glassmorphic Navbar */}
      <nav style={{ 
        position: 'fixed', top: 0, left: 0, right: 0, 
        padding: isScrolled ? '1rem 4rem' : '1.5rem 4rem', 
        zIndex: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        backgroundColor: isScrolled ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.2)', 
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', 
        borderBottom: isScrolled ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid transparent', 
        transition: 'all 0.3s ease'
      }}>
        <div style={{ fontSize: '1.2rem', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase' }}>
          <Link to="/" style={{ color: '#FFF', textDecoration: 'none' }}>SAMAAJ.</Link>
        </div>
        
        <div className="d-none d-md-flex" style={{ gap: '2.5rem', fontWeight: '500', fontSize: '0.9rem', letterSpacing: '1px', textTransform: 'uppercase' }}>
          <a href="#services" style={{ color: '#DDD', textDecoration: 'none', transition: 'color 0.3s ease' }} onMouseOver={e => e.target.style.color = '#FFF'} onMouseOut={e => e.target.style.color = '#DDD'}>Services</a>
          <a href="#about" style={{ color: '#DDD', textDecoration: 'none', transition: 'color 0.3s ease' }} onMouseOver={e => e.target.style.color = '#FFF'} onMouseOut={e => e.target.style.color = '#DDD'}>About</a>
          <a href="#impact" style={{ color: '#DDD', textDecoration: 'none', transition: 'color 0.3s ease' }} onMouseOver={e => e.target.style.color = '#FFF'} onMouseOut={e => e.target.style.color = '#DDD'}>Impact</a>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          {user ? (
            <>
              <Link to={role === 'moderator' ? '/moderator-dashboard' : '/dashboard'} style={{ color: '#FFF', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1px' }}>Dashboard</Link>
              <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.5)', color: '#FFF', padding: '0.5rem 1.5rem', borderRadius: '50px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500', transition: 'all 0.3s ease' }} onMouseOver={e => {e.target.style.backgroundColor='#FFF'; e.target.style.color='#000'}} onMouseOut={e => {e.target.style.backgroundColor='transparent'; e.target.style.color='#FFF'}}>
                LOGOUT
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ color: '#FFF', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1px' }}>LOGIN</Link>
              <Link to="/signup" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', color: '#000', padding: '0.5rem 1.5rem', borderRadius: '50px', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', transition: 'transform 0.3s ease' }} onMouseOver={e => e.target.style.transform = 'scale(1.05)'} onMouseOut={e => e.target.style.transform = 'scale(1)'}>
                START NOW
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ height: '100vh', position: 'relative', overflow: 'hidden', backgroundColor: '#000' }}>
        <div 
          ref={heroRef}
          style={{ 
            position: 'absolute', top: '-10%', left: 0, right: 0, bottom: '-10%', 
            backgroundImage: `url('https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&q=80&w=2000')`, 
            backgroundSize: 'cover', backgroundPosition: 'center',
            opacity: 0.6
          }} 
        />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 4rem', pointerEvents: 'none' }}>
          <h1 style={{ fontSize: 'clamp(3rem, 8vw, 10rem)', fontWeight: '400', color: '#FFF', margin: 0, lineHeight: '0.9', letterSpacing: '-0.03em', textTransform: 'uppercase', pointerEvents: 'auto' }}>
            {role === 'moderator' ? 'MANAGE.' : 'REPORT.'}<br/>
            {role === 'moderator' ? 'VERIFY.' : 'TRACK.'}<br/>
            <span style={{ color: '#888' }}>{role === 'moderator' ? 'RESOLVE.' : 'RESOLVE.'}</span>
          </h1>
          <p style={{ marginTop: '2rem', fontSize: '1.2rem', color: '#CCC', maxWidth: '600px', fontWeight: '300', pointerEvents: 'auto', lineHeight: '1.6' }}>
            {role === 'moderator'
              ? 'Access your moderation dashboard. Manage, verify, and seamlessly route issues raised by citizens in your assigned areas.'
              : 'Elevating civic engagement. Report local issues and drive real-time community transformation through transparent tracking.'}
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '3rem', pointerEvents: 'auto' }}>
            {user ? (
              <>
                {role !== 'moderator' && (
                  <Link to="/complaint" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 2.5rem', backgroundColor: '#FFF', color: '#1A1A1A', textDecoration: 'none', borderRadius: '50px', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    File Complaint <FiArrowRight />
                  </Link>
                )}
                <Link to={role === 'moderator' ? '/moderator-dashboard' : '/dashboard'} style={{ display: 'inline-flex', alignItems: 'center', padding: '1rem 2.5rem', backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: '#FFF', textDecoration: 'none', borderRadius: '50px', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {role === 'moderator' ? 'Manage System' : 'Track Issues'}
                </Link>
              </>
            ) : (
              <>
                <Link to="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 2.5rem', backgroundColor: '#FFF', color: '#1A1A1A', textDecoration: 'none', borderRadius: '50px', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Join the Movement <FiArrowRight />
                </Link>
                <a href="#services" style={{ display: 'inline-flex', alignItems: 'center', padding: '1rem 2.5rem', backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: '#FFF', textDecoration: 'none', borderRadius: '50px', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Learn More
                </a>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" style={{ padding: '10rem 0', backgroundColor: '#0a0a0a' }}>
        <div className="container px-4 px-md-5">
          <div className="row mb-5">
            <div className="col-lg-8">
              <h2 className="fw-bolder mb-3" style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', lineHeight: '1', color: '#ffffff', letterSpacing: '-0.03em' }}>OUR CAPABILITIES</h2>
              <p style={{ fontSize: '1.4rem', color: '#888', fontWeight: '300', maxWidth: '500px' }}>Streamlined tools designed to bridge the gap between citizens and authorities.</p>
            </div>
          </div>
          <div className="row g-5 mt-4">
            {[
              { icon: <FiMapPin />, title: "Real-Time Action", desc: "Report issues instantly with geolocation and media proof directly from your device." },
              { icon: <FiTrendingUp />, title: "Live Tracking", desc: "Monitor your reports as they move through resolution stages with total transparency." },
              { icon: <FiUsers />, title: "Community Driven", desc: "Engage with nearby reports, upvote critical issues, and foster local collaboration." },
              { icon: <FiCheckCircle />, title: "Verified Results", desc: "Moderators ensure accurate routing and swift resolution by relevant departments." }
            ].map((feature, idx) => (
              <div key={idx} className="col-md-6">
                <div style={{ borderTop: '1px solid #333', padding: '3rem 0', height: '100%', transition: 'transform 0.3s ease' }} onMouseOver={e => e.currentTarget.style.transform='translateY(-10px)'} onMouseOut={e => e.currentTarget.style.transform='translateY(0)'}>
                  <div className="mb-4" style={{ fontSize: '2.5rem', color: '#FFF' }}>
                    {feature.icon}
                  </div>
                  <h4 className="fw-bold mb-3" style={{ fontSize: '1.8rem', color: '#fff', letterSpacing: '-0.5px' }}>{feature.title}</h4>
                  <p style={{ fontSize: '1.1rem', color: '#888', lineHeight: '1.6', fontWeight: '300' }}>
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Detail Image Break */}
      <section style={{ height: '600px', backgroundImage: `url('https://images.unsplash.com/photo-1506905925275-6a48a5b479cb?auto=format&fit=crop&q=80&w=1200')`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }} />

      {/* About & Impact Section */}
      <section id="about" style={{ padding: '10rem 0', backgroundColor: '#050505', borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a' }}>
        <div className="container px-4 px-md-5">
          <div className="row align-items-center">
            <div className="col-lg-6 mb-5 mb-lg-0">
              <h2 className="fw-bolder mb-4" style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', lineHeight: '1', color: '#ffffff', letterSpacing: '-0.03em' }}>
                BRIDGING <br/><span style={{ color: '#555' }}>THE GAP.</span>
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
          
          <div id="impact" className="row mt-5 pt-5 g-4" style={{ borderTop: '1px solid #222' }}>
            {[
              { num: "10K+", label: "Issues Resolved" },
              { num: "25K+", label: "Active Citizens" },
              { num: "150+", label: "Moderators" },
              { num: "24/7", label: "Availability" }
            ].map((stat, i) => (
              <div key={i} className="col-6 col-md-3">
                <h3 className="fw-bolder" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', color: '#fff', letterSpacing: '-2px' }}>{stat.num}</h3>
                <p style={{ fontSize: '0.9rem', color: '#666', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '600' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '6rem 4rem 4rem', backgroundColor: '#000', borderTop: '1px solid #111' }}>
        <div className="container-fluid d-flex flex-column flex-md-row justify-content-between align-items-center px-0">
          <div className="mb-4 mb-md-0">
            <h4 className="fw-bold mb-2" style={{ color: '#fff', letterSpacing: '1px', fontSize: '2rem' }}>SAMAAJ<span style={{ color: '#555' }}>.</span></h4>
            <p style={{ color: '#666', fontSize: '0.95rem', maxWidth: '300px' }}>Empowering citizens, transforming communities.</p>
          </div>
          <div className="d-flex gap-4">
            <a href="#" style={{ color: '#888', textDecoration: 'none', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Privacy</a>
            <a href="#" style={{ color: '#888', textDecoration: 'none', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Terms</a>
            <a href="#" style={{ color: '#888', textDecoration: 'none', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Contact</a>
          </div>
        </div>
        <div className="mt-5 pt-4 border-top" style={{ borderColor: '#222 !important', textAlign: 'center', color: '#444', fontSize: '0.85rem', letterSpacing: '1px' }}>
          &copy; {new Date().getFullYear()} Samaaj Platform. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Home;
