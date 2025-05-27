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
    { id: 1, image: img1, title: 'Card Title 1', description: 'This is the first card description.' },
    { id: 2, image: img1, title: 'Card Title 2', description: 'This is the second card description.' },
    { id: 3, image: img1, title: 'Card Title 3', description: 'This is the third card description.' },
    { id: 4, image: img1, title: 'Card Title 4', description: 'This is the fourth card description.' },
  ];

  return (
    <>
      <Navbar />

      <section id="home" className="hero-section position-relative">
        <ImageSlider />
        <div className="hero-text text-center">
          <div className="overlay">
            <h1 className="display-4 text-golden fw-bold">Welcome to Samaaj</h1>
            <p className="lead text-white">Empowering communities through technology</p>
          </div>
        </div>
      </section>

      <section id="features" className="features-section py-5 text-white">
        <div className="container">
          <h2 className="text-center mb-5 text-golden">Features</h2>
          <Card cards={cards} />
        </div>
      </section>

      <section id="about" className="about-section d-flex justify-content-center align-items-center bg-light text-golden vh-100">
        <div className="text-center">
          <h2 className="mb-4">About Us</h2>
          <p className="lead text-dark">
            Samaaj is a platform dedicated to community development using modern digital tools and collaboration.
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
