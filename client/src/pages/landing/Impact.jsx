import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiCheckCircle, FiUsers, FiMapPin } from 'react-icons/fi';
import Navbar from '../../components/Navbar';
import SplitText from '../../components/ui/SplitText';

const Impact = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const metrics = [
    { num: "12,400+", label: "Issues Resolved", icon: <FiCheckCircle /> },
    { num: "45,000+", label: "Active Citizens", icon: <FiUsers /> },
    { num: "92%", label: "Resolution Rate", icon: <FiTrendingUp /> },
    { num: "180+", label: "Neighborhoods", icon: <FiMapPin /> }
  ];

  return (
    <div style={{ backgroundColor: '#ffffff', color: '#1a1a1a', fontFamily: '"Inter", sans-serif', minHeight: '100vh' }}>
      
      <Navbar />

      <section className="py-5" style={{ paddingTop: '150px' }}>
        <div className="container mt-5 pt-5">
          <div className="row justify-content-center text-center mb-5">
            <div className="col-lg-10">
              <motion.span 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ color: '#FF7A45', fontWeight: '800', fontSize: '0.9rem', letterSpacing: '4px', textTransform: 'uppercase' }}>Real-World Impact</motion.span>
              <h1 className="fw-black mt-3 mb-4" style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', lineHeight: '1', letterSpacing: '-0.04em', color: '#000' }}>
                <SplitText text="TRANSFORMING" /> <br/> 
                <span style={{ color: 'transparent', WebkitTextStroke: '1px #000' }}>
                  <SplitText text="CITIES TOGETHER" delay={0.05} />
                </span>
              </h1>
            </div>
          </div>

          <div className="row g-4 py-5">
            {metrics.map((m, i) => (
              <motion.div className="col-md-3" key={i}
                          initial={{ opacity: 0, scale: 0.9 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.1 }}>
                <div style={{ background: '#f8f9fa', border: '1px solid rgba(0,0,0,0.05)', padding: '3rem 2rem', borderRadius: '32px', textAlign: 'center' }}>
                  <div className="mb-3" style={{ fontSize: '2rem', color: '#FF7A45' }}>{m.icon}</div>
                  <h2 className="fw-black mb-1" style={{ fontSize: '3.5rem', letterSpacing: '-2px', color: '#000' }}>{m.num}</h2>
                  <p style={{ color: '#666', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.8rem', fontWeight: '800' }}>{m.label}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="row py-5 mt-5 align-items-center">
            <motion.div className="col-lg-6 order-lg-2"
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1 }}>
              <img src="https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=2000" alt="Impact" style={{ width: '100%', borderRadius: '40px', boxShadow: '0 30px 60px rgba(0,0,0,0.05)' }} />
            </motion.div>
            <div className="col-lg-6 pe-lg-5 mt-5 mt-lg-0 order-lg-1">
              <h2 className="fw-black mb-4" style={{ fontSize: '3rem', letterSpacing: '-1px', color: '#000' }}>
                <SplitText text="Actionable Transparency." textAlign="left" />
              </h2>
              <motion.p style={{ fontSize: '1.2rem', color: '#444', lineHeight: '1.8', fontWeight: '300' }}
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}>
                Every report on Samaaj is a data point for progress. We've seen neighborhoods go from neglected to flourishing in just months. By tracking the resolution lifecycle, we hold departments accountable and celebrate local wins.
              </motion.p>
              <div className="mt-5">
                {[1, 2, 3].map((step, idx) => (
                  <motion.div key={step} className="d-flex align-items-center gap-4 mb-4"
                              initial={{ opacity: 0, x: -20 }}
                              whileInView={{ opacity: 1, x: 0 }}
                              viewport={{ once: true }}
                              transition={{ delay: idx * 0.2 }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,122,69,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF7A45', fontWeight: '800' }}>{step}</div>
                    <p className="mb-0" style={{ color: '#555', fontWeight: '500' }}>
                      {step === 1 ? "Report identified issues in seconds." : step === 2 ? "Moderators verify and route to departments." : "Watch your community transform live."}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-5 text-center" style={{ borderTop: '1px solid rgba(0,0,0,0.05)', background: '#f8f9fa' }}>
        <p style={{ color: '#999', fontSize: '0.9rem' }}>&copy; 2026 Samaaj Platform. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Impact;
