import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './landing.css';
import img1 from '../../assets/img1.jpg';
import ImageSlider from '../../components/ImageSlider';
import Card from '../../components/Card';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const Landing = () => {
  const cards = [
    { id: 1, image: img1, title: 'Real-Time Issue Reporting', description: 'Allow citizens to report problems (e.g., potholes, garbage, street lights) with location, photos, and descriptions — directly from their devices.' },
    { id: 2, image: img1, title: 'Location-Based Tracking', description: 'Users can view issues on a map, filter by category or status, and track progress in real time using geotagged submissions.' },
    { id: 3, image: img1, title: 'Verified Moderator Dashboard', description: 'Moderators can review, verify, and assign issues to concerned departments through a secure dashboard with role-based access.' },
    { id: 4, image: img1, title: 'Community Transparency', description: 'Showcase resolved and in-progress issues to build trust, accountability, and encourage citizen participation.' },
  ];

  return (
    <>
      <Navbar />

      <section id="home" className="hero-section position-relative">
        <ImageSlider />
        <div className="hero-text text-center">
          <div className="overlay">
            <h1 className="display-4 text-golden fw-bold">Welcome to Samaaj</h1>
            <h3 className="text-white ">Raise . Resolve . Reform</h3>
          </div>
        </div>
      </section>

      <section id="features" className="features-section bg-white py-5 text-white">
        <div className="container">
          <h2 className="text-center mb-5 text-golden">Features</h2>
          <Card cards={cards} />
        </div>
      </section>

      <section id="about" className="about-section d-flex justify-content-center align-items-center bg-light text-golden py-5">
        <div className="text-center">
          <h2 className="mb-4">About Us</h2>
          <p className="lead text-dark">
Samaaj – Bridging Citizens and Solutions for a Better Community.
Samaaj is more than just a civic issue reporting platform—it’s a bridge between citizens and the change they wish to see. With a simple, user-friendly interface, Samaaj empowers individuals to voice their concerns, report local issues, and track progress transparently. Moderators respond in real-time, ensuring accountability and swift resolution. By fostering active community participation and streamlined communication, Samaaj brings people and solutions together to build cleaner, safer, and more responsive neighborhoods.
          </p>
        </div>
      </section>

      <section id="contact" className="contact-section d-flex justify-content-center align-items-center">
        <div className="contact-card text-center">
          <h2 className="mb-3 text-golden">Stay Connected</h2>
          <p className="mb-4 text-light">Enter your email and we’ll get back to you.</p>
          <form>
            <input
              type="email"
              className="form-control mb-3 mx-auto"
              placeholder="Enter your email"
              required
            />
            <button type="submit" className="contact-btn">
              Submit
            </button>
          </form>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default Landing;
