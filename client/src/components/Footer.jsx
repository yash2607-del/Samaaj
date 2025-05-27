import React from 'react';
import './Footer.css'; // Move footer-specific CSS here

const Footer = () => {
  return (
    <footer className="footer-shadow py-5 mt-auto">
      <div className="container text-center">
        <p className="mb-1">&copy; {new Date().getFullYear()} YourBrand. All rights reserved.</p>
        <div>
          <a href="#home" className="text-dark mx-2 text-decoration-none">Home</a>
          <a href="#about" className="text-dark mx-2 text-decoration-none">About</a>
          <a href="#services" className="text-dark mx-2 text-decoration-none">Services</a>
          <a href="#contact" className="text-dark mx-2 text-decoration-none">Contact</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
