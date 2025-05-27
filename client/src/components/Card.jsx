import React, { useEffect, useRef, useState } from 'react';
import './Card.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Card = ({ cards }) => {
  const containerRef = useRef(null);
  const cardRefs = useRef([]);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      cardRefs.current.forEach((card) => {
        if (card) {
          gsap.fromTo(
            card,
            { y: 100, opacity: 0, scale: 0.95 },
            {
              y: 0,
              opacity: 1,
              scale: 1,
              duration: 0.8,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: card,
                start: 'top 80%',
                toggleActions: 'play none none reverse',
              },
            }
          );
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, [cards]);

  return (
    <div className="card-stack-wrapper">
      <div className="card-stack-container" ref={containerRef}>
        {cards.map((card, index) => (
          <article
            className="card-stack"
            key={card.id}
            ref={(el) => (cardRefs.current[index] = el)}
            onMouseEnter={() => setHoveredCard(card)}
            onMouseLeave={() => setHoveredCard(null)}
            style={{ zIndex: cards.length - index }}
          >
            <img src={card.image} alt={card.title} className="card-img" />
            <h3 className="card-title">{card.title}</h3>
            <p className="card-description">{card.shortDescription}</p>
          </article>
        ))}
      </div>

      {hoveredCard && (
        <aside className="hovered-description">
          <h3>{hoveredCard.title}</h3>
          <p>{hoveredCard.description}</p>
        </aside>
      )}
    </div>
  );
};

export default Card;
