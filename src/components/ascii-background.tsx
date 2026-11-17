"use client";

import { useEffect, useRef } from "react";

export default function AsciiBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let lastTime = -1;

    const updateFrame = () => {
      if (video.readyState < 1 || !Number.isFinite(video.duration)) return;

      const runway = video.closest(".hero-runway") as HTMLElement | null;
      const hero = video.closest(".hero-section") as HTMLElement | null;
      const start = runway ? runway.getBoundingClientRect().top + window.scrollY : 0;
      const distance = Math.max(1, (runway?.offsetHeight ?? window.innerHeight) - window.innerHeight);
      const progress = reducedMotion ? 0 : Math.min(1, Math.max(0, (window.scrollY - start) / distance));
      hero?.style.setProperty("--hero-progress", String(progress));
      const lastFrameTime = Math.max(0, video.duration - 1 / 30);
      const time = Math.round(progress * lastFrameTime * 30) / 30;

      if (time === lastTime) return;
      lastTime = time;
      video.currentTime = time;
    };

    const requestFrame = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        updateFrame();
      });
    };

    video.pause();
    video.addEventListener("loadedmetadata", requestFrame);
    video.addEventListener("loadeddata", requestFrame);
    if (!reducedMotion) {
      window.addEventListener("scroll", requestFrame, { passive: true });
      window.addEventListener("resize", requestFrame);
    }
    requestFrame();

    return () => {
      cancelAnimationFrame(frame);
      video.removeEventListener("loadedmetadata", requestFrame);
      video.removeEventListener("loadeddata", requestFrame);
      window.removeEventListener("scroll", requestFrame);
      window.removeEventListener("resize", requestFrame);
    };
  }, []);

  return (
    <div className="ascii-backdrop" aria-hidden="true">
      <video
        ref={videoRef}
        className="ascii-backdrop-video"
        src="/ascii-art-scroll.mp4"
        poster="/ascii-art-poster.webp"
        preload="auto"
        muted
        playsInline
        tabIndex={-1}
      />
    </div>
  );
}
