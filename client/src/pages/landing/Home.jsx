import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FiCheckCircle, FiUsers, FiTrendingUp, FiArrowRight } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import TiltedCard from '../../components/ui/TiltedCard';
import BlurText from '../../components/ui/BlurText';
import SplitText from '../../components/ui/SplitText';
import Navbar from '../../components/Navbar';

const slides = [
  { image: "https://images.unsplash.com/photo-1584931423298-c576fda54bd2?q=80&w=2070&auto=format&fit=crop", title: "Clean City Drive", category: "Sanitation" },
  { image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2070&auto=format&fit=crop", title: "Public Park Restoration", category: "Infrastructure" },
  { image: "https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=2000&auto=format&fit=crop", title: "Smart Lighting Initiative", category: "Safety" },
  { image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=2070&auto=format&fit=crop", title: "Waste Management Hub", category: "Sustainability" },
  { image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=1974&auto=format&fit=crop", title: "Community Forum", category: "Engagement" },
];

const Home = () => {
  const [slideIndex, setSlideIndex] = useState(0);
  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch (e) { return null; }
  });

  const handleAnimationComplete = () => {
    console.log('Hero animation completed!');
  };

  useEffect(() => {
    const timer = setInterval(() => setSlideIndex((prev) => (prev + 1) % slides.length), 3000);
    return () => clearInterval(timer);
  }, []);

  const role = (user?.role || '').toLowerCase();

  return (
    <div style={{ backgroundColor: '#ffffff', color: '#1a1a1a', fontFamily: '"Inter", sans-serif', overflowX: 'hidden' }}>
      
      <Navbar />

      {/* Hero Section with Seamless Cross-fade */}
      <section id="home" style={{ height: '100vh', position: 'relative', overflow: 'hidden', backgroundColor: '#000' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={slideIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            style={{ 
              position: 'absolute', 
              inset: 0, 
              backgroundImage: `url(${slides[slideIndex].image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              zIndex: 0
            }}
          >
          </motion.div>
        </AnimatePresence>

        <div className="container h-100 d-flex align-items-center" style={{ position: 'relative', zIndex: 10, paddingTop: '120px' }}>
          <div className="row w-100">
            <div className="col-lg-10">
              <div key={slideIndex + 'content'}>
                <motion.div className="mb-4 d-flex align-items-center gap-3"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}>
                  <motion.span 
                    style={{ backgroundColor: '#FF7A45', color: '#fff', padding: '5px 15px', borderRadius: '50px', fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {slides[slideIndex].category}
                  </motion.span>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '2px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{slides[slideIndex].title}</span>
                </motion.div>

                <h1 className="fw-black mb-1" style={{ fontSize: 'clamp(3.5rem, 10vw, 8.5rem)', lineHeight: '0.85', letterSpacing: '-0.04em', textTransform: 'uppercase', color: '#fff', textShadow: '0 2px 15px rgba(0,0,0,0.8), 0 0 5px rgba(0,0,0,0.5)' }}>
                  <BlurText text={role === 'moderator' ? 'MANAGE.' : 'REPORT.'} delay={100} animateBy="letters" direction="top" />
                </h1>
                <h1 className="fw-black mb-1" style={{ fontSize: 'clamp(3.5rem, 10vw, 8.5rem)', lineHeight: '0.85', letterSpacing: '-0.04em', textTransform: 'uppercase', color: '#fff', textShadow: '0 2px 15px rgba(0,0,0,0.8), 0 0 5px rgba(0,0,0,0.5)' }}>
                  <BlurText text={role === 'moderator' ? 'VERIFY.' : 'TRACK.'} delay={100} animateBy="letters" direction="top" />
                </h1>
                <h1 className="fw-black mb-4" style={{ fontSize: 'clamp(3.5rem, 10vw, 8.5rem)', lineHeight: '0.85', letterSpacing: '-0.04em', textTransform: 'uppercase', color: '#FF7A45', textShadow: '0 2px 15px rgba(255,122,69,0.3)' }}>
                  <BlurText text="RESOLVE." delay={100} animateBy="letters" direction="top" onAnimationComplete={handleAnimationComplete} />
                </h1>
                
                <motion.p className="mb-5" style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: '#fff', maxWidth: '650px', lineHeight: '1.6', fontWeight: '500', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1, duration: 1 }}>
                  {role === 'moderator'
                    ? 'Access your moderation dashboard. Manage, verify, and seamlessly route issues raised by citizens in your assigned areas.'
                    : 'Elevating civic engagement. Report local issues and drive real-time community transformation through transparent tracking.'}
                </motion.p>
                
                <motion.div className="d-flex gap-3 flex-wrap"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.2 }}>
                  {user ? (
                    <Link to={role === 'moderator' ? '/moderator-dashboard' : '/dashboard'} 
                          className="btn btn-lg px-5 py-3 d-flex align-items-center gap-3 shadow-lg" 
                          style={{ backgroundColor: '#000', color: '#fff', fontWeight: '800', borderRadius: '50px', fontSize: '0.9rem', textTransform: 'uppercase', textDecoration: 'none' }}>
                      Go to Dashboard <FiArrowRight />
                    </Link>
                  ) : (
                    <Link to="/signup" 
                          className="btn btn-lg px-5 py-3 d-flex align-items-center gap-3 shadow-lg" 
                          style={{ backgroundColor: '#000', color: '#fff', fontWeight: '800', borderRadius: '50px', fontSize: '0.9rem', textTransform: 'uppercase', textDecoration: 'none' }}>
                      Join the Movement <FiArrowRight />
                    </Link>
                  )}
                  <a href="#features" className="btn btn-lg px-5 py-3" 
                          style={{ border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontWeight: '800', borderRadius: '50px', fontSize: '0.9rem', textTransform: 'uppercase', backdropFilter: 'blur(10px)', textDecoration: 'none' }}>
                    Learn More
                  </a>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Indicators */}
        <div style={{ position: 'absolute', right: '50px', bottom: '50px', zIndex: 20, display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'flex-end' }}>
          {slides.map((_, i) => (
            <motion.div key={i} onClick={() => setSlideIndex(i)} 
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: 1.5 + i * 0.1 }}
                 style={{ height: i === slideIndex ? '40px' : '10px', width: '6px', backgroundColor: i === slideIndex ? '#FF7A45' : 'rgba(255,255,255,0.3)', borderRadius: '10px', transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)', cursor: 'pointer' }}></motion.div>
          ))}
        </div>
      </section>

      {/* Capabilities Section */}
      <section id="features" style={{ padding: '8rem 0', backgroundColor: '#ffffff' }}>
        <div className="container">
          <div className="row mb-5 justify-content-center text-center">
            <div className="col-lg-8">
              <h2 className="fw-black mb-3" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', lineHeight: '1', letterSpacing: '-0.03em', color: '#000' }}>
                <SplitText text="OUR CAPABILITIES" threshold={0.2} />
              </h2>
              <motion.p style={{ fontSize: '1.2rem', color: '#666', maxWidth: '600px', margin: '0 auto' }}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}>
                Leveraging modern technology to bridge the gap between people and governance.
              </motion.p>
            </div>
          </div>
          <div className="row g-4">
            {[
              { img: "https://images.unsplash.com/photo-1596524430615-b46475ddff6e?q=80&w=2070", title: "Instant Reporting" },
              { img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426", title: "Transparent Tracking" },
              { img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070", title: "Civic Analytics" }
            ].map((cap, i) => (
              <motion.div className="col-md-4" key={i}
                          initial={{ opacity: 0, scale: 0.95, y: 30 }}
                          whileInView={{ opacity: 1, scale: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.2 }}>
                <TiltedCard
                  imageSrc={cap.img}
                  altText={cap.title}
                  captionText={cap.title}
                  containerHeight="450px"
                  containerWidth="100%"
                  imageHeight="450px"
                  imageWidth="100%"
                  rotateAmplitude={10}
                  scaleOnHover={1.05}
                  showMobileWarning={false}
                  showTooltip
                  displayOverlayContent
                  overlayContent={<p style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff' }}>{cap.title}</p>}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-5" style={{ background: '#f8f9fa' }}>
        <div className="container py-5">
          <div className="row mb-5 justify-content-center text-center">
            <div className="col-lg-8">
              <h2 className="fw-black mb-3" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: '#000', lineHeight: '1.1' }}>
                <SplitText text="CORE PILLARS OF SAMAAJ" />
              </h2>
              <motion.p style={{ color: '#666', fontSize: '1.1rem' }}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}>
                Empowering the community through transparency, verification, and actionable data.
              </motion.p>
            </div>
          </div>
          <div className="row g-4">
            {[
              { title: "Community Hub", desc: "Connect with neighbors and discuss local issues in a dedicated space.", icon: <FiUsers /> },
              { title: "Verified Updates", desc: "Get official information directly from local authorities and departments.", icon: <FiCheckCircle /> },
              { title: "Data Insights", desc: "Visualize civic trends and resolution metrics for your locality.", icon: <FiTrendingUp /> }
            ].map((card, i) => (
              <motion.div className="col-md-4" key={i}
                          initial={{ opacity: 0, y: 40 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.1 }}>
                <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.05)', padding: '3rem 2.5rem', borderRadius: '32px', height: '100%', transition: 'all 0.3s', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}
                     onMouseEnter={(e) => e.currentTarget.style.borderColor = '#FF7A45'}
                     onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(0,0,0,0.05)'}>
                  <div className="mb-4" style={{ fontSize: '3rem', color: '#FF7A45' }}>{card.icon}</div>
                  <h4 className="fw-black mb-3" style={{ fontSize: '1.6rem', color: '#000' }}>{card.title}</h4>
                  <p style={{ color: '#666', lineHeight: '1.7', fontSize: '1.05rem' }}>{card.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-5" style={{ background: '#ffffff' }}>
        <div className="container py-5 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
            <h2 className="fw-black mb-4" style={{ fontSize: 'clamp(2.5rem, 7vw, 4.5rem)', letterSpacing: '-2px', color: '#000', lineHeight: '1.1' }}>
              <SplitText text="READY TO MAKE A DIFFERENCE?" splitType="words" />
            </h2>
            <Link to="/signup" className="btn btn-lg px-5 py-3 shadow-xl" 
                  style={{ backgroundColor: '#000', color: '#fff', fontWeight: '800', borderRadius: '50px', fontSize: '1.1rem', textTransform: 'uppercase', textDecoration: 'none' }}>
              GET STARTED NOW
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '6rem 0 3rem', backgroundColor: '#f8f9fa', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="container text-center">
          <h3 className="fw-black mb-4" style={{ color: '#000' }}>SAMAAJ<span style={{ color: '#FF7A45' }}>.</span></h3>
          <p style={{ color: '#999', fontSize: '0.9rem' }}>&copy; 2026 Samaaj Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
