import React from 'react';
import { motion } from 'framer-motion';

const BlurText = ({
  text = '',
  delay = 50,
  className = '',
  animateBy = 'words', // 'words' or 'letters'
  direction = 'top', // 'top' or 'bottom'
  onAnimationComplete,
}) => {
  const elements = animateBy === 'words' ? text.split(' ') : text.split('');
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: delay / 1000,
        onComplete: onAnimationComplete
      }
    }
  };

  const childVariants = {
    hidden: { 
      opacity: 0, 
      filter: 'blur(10px)',
      y: direction === 'top' ? -20 : 20 
    },
    visible: { 
      opacity: 1, 
      filter: 'blur(0px)',
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  return (
    <motion.div
      className={`d-inline-flex flex-wrap ${className}`}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {elements.map((el, i) => (
        <motion.span
          key={i}
          variants={childVariants}
          style={{ display: 'inline-block', whiteSpace: 'pre' }}
        >
          {el === '' ? ' ' : el}
          {animateBy === 'words' && i < elements.length - 1 && ' '}
        </motion.span>
      ))}
    </motion.div>
  );
};

export default BlurText;
