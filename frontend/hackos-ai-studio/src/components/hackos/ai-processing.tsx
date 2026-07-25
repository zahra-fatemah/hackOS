import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

const steps = [
  "Reading document…",
  "Extracting entities…",
  "Analyzing structure…",
  "Cross-referencing skills…",
  "Composing draft…",
  "Finalizing output…",
];

export function AiProcessing({ label = "AI is thinking" }: { label?: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % steps.length), 900);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="glass relative flex flex-col items-center justify-center rounded-2xl px-8 py-12 text-center">
      <div className="relative">
        <div className="absolute inset-0 animate-pulse-ring rounded-full" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          className="grid h-16 w-16 place-items-center rounded-full bg-gradient-brand"
        >
          <Sparkles className="h-7 w-7 text-white" />
        </motion.div>
      </div>
      <div className="mt-6 text-sm text-muted-foreground">{label}</div>
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-2 text-base font-medium"
      >
        {steps[i]}
      </motion.div>
      <div className="mt-6 h-1 w-56 overflow-hidden rounded-full bg-white/5">
        <motion.div
          className="h-full bg-gradient-brand"
          initial={{ width: "10%" }}
          animate={{ width: ["10%", "85%", "40%", "95%"] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}
