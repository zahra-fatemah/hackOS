import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-8">
      <div>
        {eyebrow && (
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mb-2 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/5 px-3 py-1 text-[0.68rem] font-mono tracking-[0.2em] uppercase text-brand"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-brand animate-[pulse-dot_1.5s_ease-in-out_infinite]" />
            {eyebrow}
          </motion.div>
        )}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="text-3xl font-bold tracking-[-0.03em] text-foreground md:text-[34px]"
        >
          {title}
        </motion.h1>
        {subtitle && (
          <motion.p 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mt-1 max-w-2xl text-sm text-muted-foreground"
          >
            {subtitle}
          </motion.p>
        )}
      </div>
      {actions && (
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.9, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-wrap gap-2"
        >
          {actions}
        </motion.div>
      )}
    </div>
  );
}

export function GlassCard({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("glass rounded-2xl", className)}>{children}</div>;
}
