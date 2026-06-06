"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";

interface MagneticProps {
  children: React.ReactElement;
  strength?: number;
}

export default function Magnetic({ children, strength = 0.35 }: MagneticProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const { clientX, clientY } = e;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    
    // Calculate distance from center of the button
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    
    // Magnetic pull with configurable strength
    setPosition({
      x: deltaX * strength,
      y: deltaY * strength,
    });
  };

  const handleMouseLeave = () => {
    // Return to center
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      className="inline-block"
    >
      {children}
    </motion.div>
  );
}
