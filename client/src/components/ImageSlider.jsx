import React, { useState, useEffect } from 'react';
import './ImageSlider.css';
import img1 from '../assets/img1.jpg';
import img2 from '../assets/img2.jpg';
import img3 from '../assets/img3.jpg';


const images =[img1,img2,img3];

function ImageSlider() {
  const [current, setCurrent] = useState(0);
  const length = images.length;

  // Auto-slide every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent(prev => (prev === length - 1 ? 0 : prev + 1));
    }, 3000);
    return () => clearInterval(interval);
  }, [length]);

  const goToPrev = () => {
    setCurrent(current === 0 ? length - 1 : current - 1);
  };

  const goToNext = () => {
    setCurrent(current === length - 1 ? 0 : current + 1);
  };

  const goToSlide = (index) => {
    setCurrent(index);
  };

  return (
    <div className="slider">
      <button className="arrow left" onClick={goToPrev}>
        ❮
      </button>

      <img src={images[current]} alt={`Slide ${current + 1}`} className="slide-image" />

      <button className="arrow right" onClick={goToNext}>
        ❯
      </button>

      <div className="dots">
        {images.map((_, index) => (
          <span
            key={index}
            className={`dot ${current === index ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
          ></span>
        ))}
      </div>
    </div>
  );
}

export default ImageSlider;
