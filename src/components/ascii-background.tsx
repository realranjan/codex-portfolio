"use client";

import { forwardRef } from "react";
import Image from "next/image";

interface AsciiBackgroundProps {
  className?: string;
}

const AsciiBackground = forwardRef<HTMLDivElement, AsciiBackgroundProps>(
  function AsciiBackground({ className = "" }, ref) {
    return (
      <div
        className={`ascii-backdrop pointer-events-none absolute inset-0 z-0 overflow-hidden ${className}`}
        aria-hidden="true"
      >
        <div
          ref={ref}
          className="ascii-backdrop-layer absolute -inset-[6%] will-change-transform"
          style={{ opacity: 0.48, transform: "translate3d(0%, 0%, 0) scale(1.06)" }}
        >
          <Image
            src="/ascii-art-poster.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            referrerPolicy="no-referrer"
            className="object-cover object-[68%_45%] mix-blend-screen brightness-150 contrast-125"
          />
        </div>
      </div>
    );
  }
);

export default AsciiBackground;
