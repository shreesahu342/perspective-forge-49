import { useEffect, useRef, useState } from "react";
import socratesLogo from "@/assets/socrates-logo.png";

/**
 * Socrates emblem with eyes that track the cursor.
 *
 * The image is decorative; we overlay two pupils positioned roughly over
 * Socrates' eye sockets and translate them within a small radius based on
 * the angle from each eye's center to the cursor.
 */
export function SocratesEmblem() {
  const wrapRef = useRef<HTMLDivElement>(null);
  // Offsets are in % of the wrapper size, converted to translate values.
  const [pupils, setPupils] = useState({ lx: 0, ly: 0, rx: 0, ry: 0 });

  useEffect(() => {
    function onMove(e: MouseEvent) {
      const el = wrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();

      // Approximate eye positions on the logo (relative to wrapper).
      // These percentages are tuned for the Socrates illustration.
      const leftEye = {
        x: rect.left + rect.width * 0.40,
        y: rect.top + rect.height * 0.43,
      };
      const rightEye = {
        x: rect.left + rect.width * 0.60,
        y: rect.top + rect.height * 0.43,
      };

      const maxShift = rect.width * 0.018; // pupil travel radius in px

      const calc = (eye: { x: number; y: number }) => {
        const dx = e.clientX - eye.x;
        const dy = e.clientY - eye.y;
        const dist = Math.hypot(dx, dy) || 1;
        const clamped = Math.min(dist, 200) / 200; // ease over 200px
        return {
          x: (dx / dist) * maxShift * clamped,
          y: (dy / dist) * maxShift * clamped,
        };
      };

      const l = calc(leftEye);
      const r = calc(rightEye);
      setPupils({ lx: l.x, ly: l.y, rx: r.x, ry: r.y });
    }
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div
      ref={wrapRef}
      className="relative mx-auto w-[260px] md:w-[340px] aspect-square mb-8"
    >
      {/* Decorative rings */}
      <div className="absolute inset-0 rounded-full border border-claret/30" />
      <div className="absolute inset-3 rounded-full border border-claret/15" />
      <div className="absolute inset-6 rounded-full border border-white/5" />

      <img
        src={socratesLogo}
        alt="Socrates — patron of The Mirror"
        width={1024}
        height={1024}
        className="relative z-10 w-full h-full object-contain ember-glow"
      />

      {/* Pupils overlay */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        <span
          className="absolute block rounded-full bg-black"
          style={{
            width: "3.2%",
            height: "3.2%",
            left: "38.4%",
            top: "41.4%",
            transform: `translate(${pupils.lx}px, ${pupils.ly}px)`,
            transition: "transform 80ms linear",
            boxShadow: "0 0 6px oklch(0.55 0.22 22 / 0.8)",
          }}
        />
        <span
          className="absolute block rounded-full bg-black"
          style={{
            width: "3.2%",
            height: "3.2%",
            left: "58.4%",
            top: "41.4%",
            transform: `translate(${pupils.rx}px, ${pupils.ry}px)`,
            transition: "transform 80ms linear",
            boxShadow: "0 0 6px oklch(0.55 0.22 22 / 0.8)",
          }}
        />
      </div>

      {/* Rotating accent */}
      <div className="absolute inset-0 rounded-full border-t-2 border-claret/40 animate-[spin_20s_linear_infinite]" />
    </div>
  );
}
