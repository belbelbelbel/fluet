"use client";

import { useEffect, useState } from "react";

interface FlippingTextProps {
  texts: string[];
  className?: string;
  interval?: number;
}

export function FlippingText({ texts, className = "", interval = 2500 }: FlippingTextProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % texts.length);
        setTimeout(() => {
          setIsFlipping(false);
        }, 200);
      }, 300);
    }, interval);

    return () => clearInterval(timer);
  }, [texts.length, interval]);

  return (
    <span 
      className={`inline-block ${className}`} 
      style={{ 
        minWidth: "120px",
        perspective: "1000px",
      }}
    >
      <span
        key={currentIndex}
        className={`inline-block transition-all duration-500 ease-in-out ${
          isFlipping 
            ? "opacity-0 scale-y-0 -translate-y-4" 
            : "opacity-100 scale-y-100 translate-y-0"
        }`}
        style={{
          transformOrigin: "center",
          display: "inline-block",
        }}
      >
        {texts[currentIndex]}
      </span>
    </span>
  );
}

