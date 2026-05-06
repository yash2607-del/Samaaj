import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import "./TiltedCard.css";

export default function TiltedCard({
  imageSrc,
  altText,
  captionText,
  containerHeight = "300px",
  containerWidth = "300px",
  imageHeight = "300px",
  imageWidth = "300px",
  rotateAmplitude = 15,
  scaleOnHover = 1.1,
  showMobileWarning = true,
  showTooltip = true,
  displayOverlayContent = false,
  overlayContent = null,
}) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(
    mouseYSpring,
    [-0.5, 0.5],
    [rotateAmplitude, -rotateAmplitude]
  );
  const rotateY = useTransform(
    mouseXSpring,
    [-0.5, 0.5],
    [-rotateAmplitude, rotateAmplitude]
  );

  const handleMouseMove = (e) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        height: containerHeight,
        width: containerWidth,
        perspective: "1000px",
      }}
      className="tilted-card-container"
    >
      <motion.div
        style={{
          height: imageHeight,
          width: imageWidth,
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        whileHover={{ scale: scaleOnHover }}
        className="tilted-card-inner"
      >
        <img
          src={imageSrc}
          alt={altText}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: "15px",
          }}
        />

        {displayOverlayContent && overlayContent && (
          <div className="tilted-card-overlay">
            {overlayContent}
          </div>
        )}

        {showTooltip && captionText && (
          <motion.div
            style={{
              position: "absolute",
              bottom: "10px",
              left: "50%",
              x: "-50%",
              z: "50px",
            }}
            className="tilted-card-caption"
          >
            {captionText}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
