import React, { useRef } from 'react';
import './Card.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Card = ({ cards }) => {
  const containerRef = useRef(null);
  const cardRefs = useRef([]);

  return (
    <div className="card-stack-wrapper">
      <div className="card-stack-container" ref={containerRef}>
        {cards.map((card, index) => (
          <article
            className="card-stack"
            key={card.id}
            ref={(el) => (cardRefs.current[index] = el)}
            style={{ zIndex: cards.length - index }}
          >
            <img src={card.image} alt={card.title} className="card-img" />
            <h3 className="card-title">{card.title}</h3>
            <p className="card-description">{card.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
};

export default Card;
