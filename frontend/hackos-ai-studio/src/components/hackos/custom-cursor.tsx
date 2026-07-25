import { useEffect, useRef } from "react";

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Disable on touch devices
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    let frameId: number;

    const onMouseMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.left = `${mx}px`;
        dotRef.current.style.top = `${my}px`;
      }
      if (glowRef.current) {
        glowRef.current.style.left = `${mx}px`;
        glowRef.current.style.top = `${my}px`;
      }
    };

    const loop = () => {
      rx += (mx - rx) * 0.15;
      ry += (my - ry) * 0.15;
      if (ringRef.current) {
        ringRef.current.style.left = `${rx}px`;
        ringRef.current.style.top = `${ry}px`;
      }
      frameId = requestAnimationFrame(loop);
    };

    window.addEventListener("mousemove", onMouseMove);
    loop();

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <>
      <div
        ref={glowRef}
        className="pointer-events-none fixed z-[1] h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform duration-300 ease-out hidden sm:block"
        style={{
          background: "radial-gradient(circle, rgba(0,255,102,0.05) 0%, transparent 70%)",
        }}
      />
      <div
        ref={ringRef}
        className="pointer-events-none fixed z-[9998] h-[40px] w-[40px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand/40 hidden sm:block"
      />
      <div
        ref={dotRef}
        className="pointer-events-none fixed z-[9999] h-[12px] w-[12px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand mix-blend-screen hidden sm:block"
      />
    </>
  );
}
