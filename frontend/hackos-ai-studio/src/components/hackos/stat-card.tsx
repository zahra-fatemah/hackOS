import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  delta,
  accent = "brand",
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  suffix?: string;
  delta?: string;
  accent?: "brand" | "brand-2" | "brand-3";
}) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v).toLocaleString());
  useEffect(() => {
    const controls = animate(mv, value, { duration: 1.6, ease: [0.22, 1, 0.36, 1] });
    return controls.stop;
  }, [value, mv]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -3 }}
      className="glass relative overflow-hidden rounded-2xl p-5"
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-2xl opacity-60"
        style={{ background: `var(--color-${accent})` }}
      />
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/5">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-4 flex items-end gap-1">
        <motion.span className="text-3xl font-semibold tracking-tight">{rounded}</motion.span>
        {suffix && <span className="mb-1 text-muted-foreground">{suffix}</span>}
      </div>
      {delta && <div className="mt-1 text-xs text-emerald-400">{delta}</div>}
    </motion.div>
  );
}
