import { useEffect, useRef, useState } from "react";
import { motion, useInView, useAnimation } from "framer-motion";

export default function SplitText({
  text = "",
  className = "",
  delay = 0.05,
  duration = 0.5,
  ease = "easeOut",
  splitType = "chars", // "chars" or "words"
  from = { opacity: 0, y: 20 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = "0px",
  textAlign = "center",
  onLetterAnimationComplete,
}) {
  const controls = useAnimation();
  const ref = useRef(null);
  const inView = useInView(ref, { threshold, margin: rootMargin, once: true });

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [inView, controls]);

  const items = splitType === "chars" ? text.split("") : text.split(" ");

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: delay,
      },
    },
  };

  const itemVariants = {
    hidden: from,
    visible: {
      ...to,
      transition: {
        duration,
        ease,
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ display: "inline-block", textAlign }}
      variants={containerVariants}
      initial="hidden"
      animate={controls}
    >
      {items.map((item, index) => (
        <motion.span
          key={index}
          variants={itemVariants}
          style={{ display: "inline-block", whiteSpace: "pre" }}
          onAnimationComplete={() => {
            if (index === items.length - 1 && onLetterAnimationComplete) {
              onLetterAnimationComplete();
            }
          }}
        >
          {item}
          {splitType === "words" && index !== items.length - 1 && " "}
        </motion.span>
      ))}
    </motion.div>
  );
}
