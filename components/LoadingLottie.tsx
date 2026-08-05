"use client";

import Lottie from "lottie-react";
import loadingAnimation from "@/public/assets/loadingassetlottiefile.json";

interface LoadingLottieProps {
  size?: number;
}

export function LoadingLottie({ size = 88 }: LoadingLottieProps) {
  return (
    <div
      className="mx-auto flex items-center justify-center opacity-90"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Lottie
        animationData={loadingAnimation}
        loop
        autoplay
        style={{ width: size, height: size }}
      />
    </div>
  );
}
