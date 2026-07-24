"use client";

import { useEffect, useRef } from "react";

/**
 * Full-screen animated dot grid, fixed behind all content. Dots brighten
 * and grow near the cursor. Reads colors from the existing theme CSS
 * variables, so it automatically matches light/dark mode with no extra work.
 * No new dependencies — plain Canvas API.
 */
export function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let mouseX = -9999;
    let mouseY = -9999;
    const SPACING = 34;
    const RADIUS = 130; // how far the cursor's influence reaches

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * devicePixelRatio;
      canvas.height = height * devicePixelRatio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(devicePixelRatio, devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    const handleMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseleave", () => {
      mouseX = -9999;
      mouseY = -9999;
    });

    const getDotColor = () => {
      const style = getComputedStyle(document.documentElement);
      return style.getPropertyValue("--color-ink-light").trim() || "107 99 87";
    };

    let raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const colorRgb = getDotColor();

      for (let x = SPACING / 2; x < width; x += SPACING) {
        for (let y = SPACING / 2; y < height; y += SPACING) {
          const dx = x - mouseX;
          const dy = y - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const influence = Math.max(0, 1 - dist / RADIUS);

          const baseOpacity = 0.12;
          const opacity = baseOpacity + influence * 0.55;
          const size = 1 + influence * 2.2;

          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${colorRgb.replace(/\s+/g, ",")}, ${opacity})`;
          ctx.fill();
        }
      }

      if (!prefersReducedMotion) {
        raf = requestAnimationFrame(draw);
      }
    };
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}