import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, GlassCard } from "@/components/hackos/section";
import { registrations } from "@/data/mock";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export const Route = createFileRoute("/participant/registrations")({
  head: () => ({
    meta: [
      { title: "My Registrations · HackOS AI" },
      { name: "description", content: "Your hackathon registrations." },
      { property: "og:title", content: "My Registrations · HackOS AI" },
      { property: "og:description", content: "All of your hackathon registrations." },
    ],
  }),
  component: () => (
    <div className="space-y-8">
      <PageHeader eyebrow="History" title="My registrations" subtitle="All hackathons you've registered for." />
      <GlassCard className="overflow-hidden">
        <div className="grid grid-cols-5 gap-4 border-b border-white/5 px-6 py-3 text-[11px] uppercase tracking-wider text-muted-foreground">
          <div className="col-span-2">Hackathon</div>
          <div>Team</div>
          <div>Reg ID</div>
          <div className="text-right">Status</div>
        </div>
        {registrations.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="grid grid-cols-5 gap-4 border-b border-white/5 px-6 py-4 text-sm last:border-0 hover:bg-white/[0.02]"
          >
            <div className="col-span-2">
              <div className="font-medium">{r.hackathon}</div>
              <div className="text-xs text-muted-foreground">{r.date}</div>
            </div>
            <div>{r.team}</div>
            <div className="font-mono text-xs text-muted-foreground">{r.id}</div>
            <div className="text-right">
              <Badge
                className={
                  r.status === "Confirmed"
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "bg-amber-500/15 text-amber-300"
                }
              >
                {r.status}
              </Badge>
            </div>
          </motion.div>
        ))}
      </GlassCard>
    </div>
  ),
});
