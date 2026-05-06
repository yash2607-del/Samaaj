import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { motion } from 'framer-motion';
import { FiArrowRight, FiTarget, FiHeart, FiShield } from 'react-icons/fi';
import Navbar from '../../components/Navbar';
import SplitText from '../../components/ui/SplitText';

const About = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div style={{ backgroundColor: '#ffffff', color: '#1a1a1a', fontFamily: '"Inter", sans-serif', minHeight: '100vh' }}>
      
      <Navbar />

      <section className="py-5" style={{ paddingTop: '150px !important', marginTop: '50px' }}>
        <div className="container mt-5 pt-5">
          <div className="row justify-content-center text-center mb-5">
            <div className="col-lg-10">
              <motion.span 
                initial={{ opacity: 0, letterSpacing: '0px' }}
                animate={{ opacity: 1, letterSpacing: '4px' }}
                style={{ color: '#FF7A45', fontWeight: '800', fontSize: '0.9rem', textTransform: 'uppercase' }}>Our Story</motion.span>
              <h1 className="fw-black mt-3 mb-4" style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', lineHeight: '1', letterSpacing: '-0.04em', color: '#000' }}>
                <SplitText text="REDEFINING" /> <br/> 
                <span style={{ color: 'transparent', WebkitTextStroke: '1px #000' }}>
                  <SplitText text="CIVIC CONTRACTS" delay={0.05} />
                </span>
              </h1>
              <motion.p style={{ fontSize: '1.4rem', color: '#555', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6', fontWeight: '300' }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}>
                Samaaj was born out of a simple realization: the distance between a citizen's grievance and a government's action was too wide. We built a bridge.
              </motion.p>
            </div>
          </div>

          <div className="row g-5 py-5">
            {[
              { icon: <FiTarget />, title: "Our Mission", desc: "To empower every citizen with the tools to demand accountability and drive community transformation in real-time." },
              { icon: <FiHeart />, title: "Our Vision", desc: "A world where urban infrastructure and public services are responsive, transparent, and built on collective action." },
              { icon: <FiShield />, title: "Our Values", desc: "Transparency, integrity, and community-first governance. We believe data can heal cities." }
            ].map((item, i) => (
              <motion.div className="col-md-4" key={i}
                          initial={{ opacity: 0, y: 30 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.2 }}>
                <div style={{ background: '#f8f9fa', border: '1px solid rgba(0,0,0,0.05)', padding: '3.5rem 2.5rem', borderRadius: '32px', height: '100%' }}>
                  <div className="mb-4" style={{ fontSize: '2.5rem', color: '#FF7A45' }}>{item.icon}</div>
                  <h4 className="fw-black mb-3" style={{ fontSize: '1.8rem', color: '#000' }}>{item.title}</h4>
                  <p style={{ color: '#666', lineHeight: '1.7', fontSize: '1.1rem' }}>{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="row py-5 mt-5 align-items-center">
            <motion.div className="col-lg-6"
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}>
              <img src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2070" alt="Collaboration" style={{ width: '100%', borderRadius: '40px', boxShadow: '0 30px 60px rgba(0,0,0,0.05)' }} />
            </motion.div>
            <div className="col-lg-6 ps-lg-5 mt-5 mt-lg-0">
              <h2 className="fw-black mb-4" style={{ fontSize: '3rem', letterSpacing: '-1px', color: '#000' }}>
                <SplitText text="Built by the People." textAlign="left" />
              </h2>
              <motion.p style={{ fontSize: '1.2rem', color: '#444', lineHeight: '1.8', fontWeight: '300' }}
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}>
                We are a team of urban planners, engineers, and citizens who believe that technology is the key to fixing urban decay. Samaaj isn't just an app; it's a movement towards a smarter, cleaner future.
              </motion.p>
              <motion.div className="mt-4"
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}>
                <Link to="/signup" className="btn btn-lg px-5 py-3" style={{ backgroundColor: '#000', color: '#fff', fontWeight: '800', borderRadius: '50px', fontSize: '1rem', textTransform: 'uppercase' }}>Join Us <FiArrowRight /></Link>
              </motion.div>
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

export default About;
