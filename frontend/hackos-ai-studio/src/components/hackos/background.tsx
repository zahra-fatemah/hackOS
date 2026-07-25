import { motion } from "framer-motion";
import { useEffect, useState } from "react";

/** Ambient background: gradient mesh + floating orbs + subtle grid. Framer-based, SSR-safe. */
export function AmbientBackground({ grid = true }: { grid?: boolean }) {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {grid && <div className="absolute inset-0 hackos-grid opacity-60" />}
      <motion.div
        className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(closest-side, oklch(0.72 0.19 295 / 0.35), transparent)" }}
        animate={{ y: [0, 30, 0], x: [0, 20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/3 -right-40 h-[560px] w-[560px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(closest-side, oklch(0.78 0.15 220 / 0.30), transparent)" }}
        animate={{ y: [0, -25, 0], x: [0, -15, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-40 left-1/3 h-[520px] w-[520px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(closest-side, oklch(0.75 0.22 340 / 0.28), transparent)" }}
        animate={{ y: [0, 20, 0], x: [0, 25, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

export function MouseGlow() {
  const [pos, setPos] = useState({ x: 50, y: 50 });
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setPos({ x: (e.clientX / window.innerWidth) * 100, y: (e.clientY / window.innerHeight) * 100 });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 transition-opacity duration-500"
      style={{
        background: `radial-gradient(300px circle at ${pos.x}% ${pos.y}%, rgba(0,255,102,0.05), transparent 60%)`,
      }}
    />
  );
}

export function Particles({ count = 24 }: { count?: number }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return null;
  const dots = Array.from({ length: count });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {dots.map((_, i) => {
        const size = 2 + Math.random() * 4;
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        const delay = Math.random() * 6;
        const dur = 8 + Math.random() * 10;
        return (
          <motion.span
            key={i}
            className="absolute rounded-full"
            style={{
              width: size,
              height: size,
              left: `${left}%`,
              top: `${top}%`,
              background: "oklch(0.9 0.05 280 / 0.7)",
              boxShadow: "0 0 12px oklch(0.72 0.19 295 / 0.6)",
            }}
            animate={{ y: [0, -40, 0], opacity: [0.2, 1, 0.2] }}
            transition={{ duration: dur, delay, repeat: Infinity, ease: "easeInOut" }}
          />
        );
      })}
    </div>
  );
}
