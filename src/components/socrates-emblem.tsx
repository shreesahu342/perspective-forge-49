import { useEffect, useRef, useState } from "react";
import socratesLogo from "@/assets/socrates-logo.png";

/**
 * Socrates emblem with realistic eyes that track the cursor.
 *
 * The bust image has empty dark eye sockets — we render the eyeballs
 * (white sclera + red glowing iris + black pupil) as DOM overlays positioned
 * over those sockets. The whole eyeball rotates toward the cursor like a
 * real eye, with the pupil constrained inside the sclera.
 *
 * Eye socket positions on the 1024x1024 image (as % of wrapper):
 *   left  socket center ≈ (40%, 37.5%), width ≈ 11%
 *   right socket center ≈ (58%, 37.5%), width ≈ 11%
 */
const EYE_LEFT = { cx: 40.0, cy: 37.5 };   // %
const EYE_RIGHT = { cx: 58.0, cy: 37.5 };  // %
const EYE_WIDTH = 9.5;                     // % of wrapper (sclera diameter)
const EYE_HEIGHT = 5.5;                    // % of wrapper (sclera vertical)
const PUPIL_TRAVEL = 0.28;                 // fraction of eye radius the pupil can move

export function SocratesEmblem() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [gaze, setGaze] = useState({ lx: 0, ly: 0, rx: 0, ry: 0 });

  useEffect(() => {
    let raf = 0;
    let target = { lx: 0, ly: 0, rx: 0, ry: 0 };
    let current = { lx: 0, ly: 0, rx: 0, ry: 0 };

    function compute(eyePctX: number, eyePctY: number, mouseX: number, mouseY: number) {
      const el = wrapRef.current;
      if (!el) return { x: 0, y: 0 };
      const rect = el.getBoundingClientRect();
      const eyeX = rect.left + (rect.width * eyePctX) / 100;
      const eyeY = rect.top + (rect.height * eyePctY) / 100;
      const dx = mouseX - eyeX;
      const dy = mouseY - eyeY;
      const dist = Math.hypot(dx, dy) || 1;
      // Normalize, then scale by eye dimensions × travel fraction.
      const radiusX = (rect.width * EYE_WIDTH) / 200; // half-width in px
      const radiusY = (rect.height * EYE_HEIGHT) / 200;
      // Ease so distant cursors max out, near cursors are linear.
      const intensity = Math.min(1, dist / 220);
      return {
        x: (dx / dist) * radiusX * PUPIL_TRAVEL * 2 * intensity,
        y: (dy / dist) * radiusY * PUPIL_TRAVEL * 2 * intensity,
      };
    }

    function onMove(e: MouseEvent) {
      const l = compute(EYE_LEFT.cx, EYE_LEFT.cy, e.clientX, e.clientY);
      const r = compute(EYE_RIGHT.cx, EYE_RIGHT.cy, e.clientX, e.clientY);
      target = { lx: l.x, ly: l.y, rx: r.x, ry: r.y };
    }

    function tick() {
      // Smooth lerp toward target for organic motion.
      const ease = 0.18;
      current = {
        lx: current.lx + (target.lx - current.lx) * ease,
        ly: current.ly + (target.ly - current.ly) * ease,
        rx: current.rx + (target.rx - current.rx) * ease,
        ry: current.ry + (target.ry - current.ry) * ease,
      };
      setGaze(current);
      raf = requestAnimationFrame(tick);
    }

    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
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

      {/* Eye overlay layer — positioned in the same coordinate space as the image */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        <Eye cx={EYE_LEFT.cx} cy={EYE_LEFT.cy} dx={gaze.lx} dy={gaze.ly} />
        <Eye cx={EYE_RIGHT.cx} cy={EYE_RIGHT.cy} dx={gaze.rx} dy={gaze.ry} />
      </div>

      {/* Rotating accent */}
      <div className="absolute inset-0 rounded-full border-t-2 border-claret/40 animate-[spin_20s_linear_infinite] z-30 pointer-events-none" />
    </div>
  );
}

function Eye({ cx, cy, dx, dy }: { cx: number; cy: number; dx: number; dy: number }) {
  return (
    <div
      className="absolute"
      style={{
        left: `${cx - EYE_WIDTH / 2}%`,
        top: `${cy - EYE_HEIGHT / 2}%`,
        width: `${EYE_WIDTH}%`,
        height: `${EYE_HEIGHT}%`,
      }}
    >
      {/* Sclera — almond shape suggesting eyelids */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, oklch(0.96 0.01 80) 0%, oklch(0.85 0.02 60) 70%, oklch(0.4 0.03 40) 100%)",
          borderRadius: "50%",
          boxShadow:
            "inset 0 1px 2px oklch(0.2 0.02 40 / 0.6), inset 0 -1px 1px oklch(0.2 0.02 40 / 0.3)",
        }}
      />
      {/* Iris + pupil — red glowing, follows cursor */}
      <div
        className="absolute top-1/2 left-1/2"
        style={{
          width: "55%",
          height: "85%",
          transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`,
          transition: "none",
        }}
      >
        {/* Iris glow halo */}
        <div
          className="absolute inset-[-30%] rounded-full"
          style={{
            background:
              "radial-gradient(circle, oklch(0.6 0.25 22 / 0.55) 0%, transparent 60%)",
            filter: "blur(2px)",
          }}
        />
        {/* Iris */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 35% 35%, oklch(0.75 0.22 22) 0%, oklch(0.5 0.24 22) 55%, oklch(0.3 0.18 22) 100%)",
            boxShadow:
              "0 0 8px oklch(0.6 0.25 22 / 0.9), 0 0 16px oklch(0.55 0.22 22 / 0.6)",
          }}
        />
        {/* Pupil */}
        <div
          className="absolute top-1/2 left-1/2 rounded-full bg-black"
          style={{
            width: "42%",
            height: "42%",
            transform: "translate(-50%, -50%)",
          }}
        />
        {/* Catchlight */}
        <div
          className="absolute rounded-full bg-white"
          style={{
            width: "18%",
            height: "18%",
            top: "22%",
            left: "28%",
            opacity: 0.85,
            filter: "blur(0.5px)",
          }}
        />
      </div>
    </div>
  );
}
