import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import 'bootstrap/dist/css/bootstrap.min.css';
import TiltedCard from '../../components/ui/TiltedCard';
import SplitText from '../../components/ui/SplitText';
import Navbar from '../../components/Navbar';

const slides = [
  { image: "https://images.unsplash.com/photo-1584931423298-c576fda54bd2?q=80&w=2070&auto=format&fit=crop", title: "Clean City Drive", category: "Sanitation" },
  { image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2070&auto=format&fit=crop", title: "Public Park Restoration", category: "Infrastructure" },
  { image: "https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=2000&auto=format&fit=crop", title: "Smart Lighting Initiative", category: "Safety" },
  { image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=2070&auto=format&fit=crop", title: "Waste Management Hub", category: "Sustainability" },
  { image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=1974&auto=format&fit=crop", title: "Community Forum", category: "Engagement" },
];

const Landing = () => {
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setSlideIndex((prev) => (prev + 1) % slides.length), 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ backgroundColor: '#ffffff', color: '#1a1a1a', fontFamily: '"Inter", sans-serif', overflowX: 'hidden' }}>
      
      <Navbar />

      {/* Hero Section */}
      <section id="home" style={{ height: '100vh', position: 'relative', overflow: 'hidden', backgroundColor: '#000' }}>
        <AnimatePresence>
          <motion.div key={slideIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.5 }}
            style={{ position: 'absolute', inset: 0, backgroundImage: `url(${slides[slideIndex].image})`, backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0 }}>
          </motion.div>
        </AnimatePresence>

        <div className="container h-100 d-flex align-items-center" style={{ position: 'relative', zIndex: 10, paddingTop: '120px' }}>
          <div className="row w-100">
            <div className="col-lg-10">
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                <div className="mb-4 d-flex align-items-center gap-3">
                  <span style={{ backgroundColor: '#FF7A45', color: '#fff', padding: '5px 15px', borderRadius: '50px', fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase' }}>{slides[slideIndex].category}</span>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>{slides[slideIndex].title}</span>
                </div>
                <h1 className="fw-black mb-1" style={{ color: '#fff', fontSize: 'clamp(3.5rem, 10vw, 8.5rem)', lineHeight: '0.85', letterSpacing: '-0.04em', textTransform: 'uppercase', textShadow: '0 2px 15px rgba(0,0,0,0.8), 0 0 5px rgba(0,0,0,0.5)' }}>
                  <SplitText text="REPORT." />
                </h1>
                <h1 className="fw-black mb-1" style={{ color: '#fff', fontSize: 'clamp(3.5rem, 10vw, 8.5rem)', lineHeight: '0.85', letterSpacing: '-0.04em', textTransform: 'uppercase', textShadow: '0 2px 15px rgba(0,0,0,0.8), 0 0 5px rgba(0,0,0,0.5)' }}>
                  <SplitText text="TRACK." />
                </h1>
                <h1 className="fw-black mb-4" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 'clamp(3.5rem, 10vw, 8.5rem)', lineHeight: '0.85', letterSpacing: '-0.04em', textTransform: 'uppercase', textShadow: '0 2px 15px rgba(0,0,0,0.5)' }}>
                  <SplitText text="RESOLVE." />
                </h1>
                <motion.p className="mb-5" style={{ fontSize: '1.25rem', color: '#fff', maxWidth: '600px', lineHeight: '1.6', fontWeight: '500', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1 }}>
                  Elevating civic engagement through transparent tracking.
                </motion.p>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Indicators */}
        <div style={{ position: 'absolute', right: '50px', bottom: '50px', zIndex: 20, display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'flex-end' }}>
          {slides.map((_, i) => (
            <div key={i} onClick={() => setSlideIndex(i)} 
                 style={{ height: i === slideIndex ? '40px' : '10px', width: '6px', backgroundColor: i === slideIndex ? '#FF7A45' : 'rgba(0,0,0,0.1)', borderRadius: '10px', transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)', cursor: 'pointer' }}></div>
          ))}
        </div>
      </section>

      {/* Capabilities */}
      <section id="features" style={{ padding: '8rem 0', backgroundColor: '#ffffff' }}>
        <div className="container">
          <div className="row mb-5 justify-content-center text-center">
            <div className="col-lg-8">
              <h2 className="fw-black mb-3" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', color: '#000' }}>
                <SplitText text="OUR CAPABILITIES" />
              </h2>
            </div>
          </div>
          <div className="row g-4">
            {[
              { img: "https://images.unsplash.com/photo-1596524430615-b46475ddff6e?q=80&w=2070", title: "Instant Reporting" },
              { img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426", title: "Live Tracking" },
              { img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070", title: "Smart Insights" }
            ].map((cap, i) => (
              <motion.div className="col-md-4" key={i}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}>
                <TiltedCard imageSrc={cap.img} altText={cap.title} captionText={cap.title} containerHeight="450px" containerWidth="100%" imageHeight="450px" imageWidth="100%" rotateAmplitude={10} scaleOnHover={1.05} showMobileWarning={false} showTooltip displayOverlayContent overlayContent={<p style={{ color: '#fff', fontWeight: '700' }}>{cap.title}</p>} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <footer style={{ padding: '6rem 0 3rem', backgroundColor: '#f8f9fa' }}>
        <div className="container text-center">
          <h3 className="fw-black mb-4">SAMAAJ<span style={{ color: '#FF7A45' }}>.</span></h3>
          <p style={{ color: '#999' }}>&copy; 2026 Samaaj Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
