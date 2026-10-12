import { useEffect, useRef } from "react";

interface Ripple {
  x: number;
  y: number;
  born: number;
}

const LIFETIME_MS = 2600;
const MAX_RADIUS = 240;
// bounds on the wait before an ambient ripple drops on its own
const AMBIENT_MIN_MS = 3500;
const AMBIENT_MAX_MS = 7000;

/**
 * Fixed decorative canvas behind the app. Draws an expanding ring on click and
 * one at a random spot on an ambient timer. The ring color is the --ripple theme
 * token, so it follows the light/dark toggle.
 */
export function PondRipples() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) return;

    let dpr = window.devicePixelRatio || 1;
    const resize = () => {
      dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };
    resize();
    window.addEventListener("resize", resize);

    const ripples: Ripple[] = [];
    let raf = 0;
    let ambientTimer = 0;

    // monotonic clock so a ring's age is stable across frames
    const now = () => performance.now();

    const spawn = (x: number, y: number) => {
      ripples.push({ x, y, born: now() });
      if (ripples.length > 24) ripples.shift();
    };

    const onClick = (e: PointerEvent) => spawn(e.clientX, e.clientY);
    window.addEventListener("pointerdown", onClick);

    const scheduleAmbient = () => {
      const wait =
        AMBIENT_MIN_MS + Math.random() * (AMBIENT_MAX_MS - AMBIENT_MIN_MS);
      ambientTimer = window.setTimeout(() => {
        spawn(
          Math.random() * window.innerWidth,
          Math.random() * window.innerHeight,
        );
        scheduleAmbient();
      }, wait);
    };
    scheduleAmbient();

    const draw = () => {
      const t = now();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);
      // the canvas color is var(--ripple), read here so a theme switch applies mid-ring
      if (ripples.length > 0) ctx.strokeStyle = getComputedStyle(canvas).color;
      ctx.lineWidth = 2.4;

      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        const age = (t - r.born) / LIFETIME_MS;
        if (age >= 1) {
          ripples.splice(i, 1);
          continue;
        }
        const radius = MAX_RADIUS * (1 - Math.pow(1 - age, 3));
        ctx.globalAlpha = Math.sin(age * Math.PI) * 0.28;
        ctx.beginPath();
        ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(ambientTimer);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointerdown", onClick);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 text-[var(--ripple)]"
    />
  );
}
