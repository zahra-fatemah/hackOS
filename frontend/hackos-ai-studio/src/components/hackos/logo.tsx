import { motion } from "framer-motion";

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <motion.div
        initial={{ rotate: -20, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative grid place-items-center rounded-xl bg-gradient-brand ring-brand"
        style={{ width: size + 8, height: size + 8 }}
      >
        <div className="absolute inset-[2px] rounded-[10px] bg-background/70 backdrop-blur" />
        <svg
          width={size - 4}
          height={size - 4}
          viewBox="0 0 24 24"
          fill="none"
          className="relative z-10"
        >
          <path
            d="M4 4v16M20 4v16M4 12h16M9 8l3-4 3 4M9 16l3 4 3-4"
            stroke="url(#g)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="24" y2="24">
              <stop offset="0%" stopColor="#c4b5fd" />
              <stop offset="50%" stopColor="#67e8f9" />
              <stop offset="100%" stopColor="#f9a8d4" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>
      <div className="leading-none">
        <div className="text-[15px] font-semibold tracking-tight">
          HackOS <span className="text-gradient">AI</span>
        </div>
      </div>
    </div>
  );
}
