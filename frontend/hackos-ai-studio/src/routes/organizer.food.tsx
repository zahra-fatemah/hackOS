import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Coffee, Utensils, Moon, ScanLine, Check, X } from "lucide-react";
import { PageHeader } from "@/components/hackos/section";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "@/store/auth";
import { ScannerModal } from "@/components/hackos/scanner-modal";

// Mock timeline data since our endpoints just return arrays of recent
const foodStats = {
  timeline: [
    { time: "08:00", claimed: 10 },
    { time: "10:00", claimed: 45 },
    { time: "12:00", claimed: 120 },
    { time: "14:00", claimed: 80 },
    { time: "18:00", claimed: 150 },
    { time: "20:00", claimed: 90 },
  ]
};

export const Route = createFileRoute("/organizer/food")({
  head: () => ({
    meta: [
      { title: "Food Management · HackOS AI" },
      { name: "description", content: "Track meal claims with QR scanning and live analytics." },
      { property: "og:title", content: "Food Management · HackOS AI" },
      { property: "og:description", content: "QR-protected meal management." },
    ],
  }),
  component: Food,
});



function Food() {
  const email = useAuth((s) => s.email);
  const scanCode = useAuth((s) => s.scanCode);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [stats, setStats] = useState({
    breakfast: { claimed: 0, total: 0 },
    lunch: { claimed: 0, total: 0 },
    dinner: { claimed: 0, total: 0 },
    recent: [] as any[],
  });

  const fetchStats = () => {
    if (!email) return;
    fetch(`http://localhost:5000/api/organizer/food-stats?organizer_email=${email}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) setStats(json.data);
      })
      .catch(console.error);
      
    fetch(`http://localhost:5000/api/organizer/participants?organizer_email=${email}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) setParticipants(json.data);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchStats();
  }, [email]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Live counters"
        title="Food management"
        subtitle="QR-protected meal claims with duplicate detection."
        actions={
          <Button onClick={() => setScannerOpen(true)} className="bg-gradient-brand text-white hover:opacity-90">
            <ScanLine className="mr-2 h-4 w-4" /> Open scanner
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MealCard icon={Coffee} label="Breakfast" claimed={stats.breakfast.claimed} total={stats.breakfast.total} tone="brand-2" />
        <MealCard icon={Utensils} label="Lunch" claimed={stats.lunch.claimed} total={stats.lunch.total} tone="brand" />
        <MealCard icon={Moon} label="Dinner" claimed={stats.dinner.claimed} total={stats.dinner.total} tone="brand-3" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2 p-6">
          <div className="text-sm font-medium">Claims throughout the day</div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={foodStats.timeline}>
                <defs>
                  <linearGradient id="fg" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.75 0.22 340)" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="oklch(0.75 0.22 340)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="oklch(1 0 0 / 0.05)" vertical={false} />
                <XAxis dataKey="time" stroke="oklch(0.7 0 0)" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis stroke="oklch(0.7 0 0)" tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip contentStyle={{ background: "oklch(0.20 0.018 265)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12 }} />
                {/* Timeline data is mock, as tracking over day requires chronological generation which we don't do for this quick test */}
                <Area type="monotone" dataKey="claimed" stroke="oklch(0.75 0.22 340)" strokeWidth={2} fill="url(#fg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="text-sm font-medium">Recent scans</div>
          <div className="mt-3 space-y-2">
            {stats.recent.map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass flex items-center gap-3 rounded-xl p-3"
              >
                <div className={`grid h-8 w-8 place-items-center rounded-full ${r.status === "ok" ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}>
                  {r.status === "ok" ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.meal} · {r.time}</div>
                </div>
                {r.status === "duplicate" && <span className="text-[10px] text-red-300">DUPLICATE</span>}
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </div>

      <ScannerModal
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        scanType="food"
        options={["Breakfast", "Lunch", "Dinner"]}
        optionsLabel="Select Meal Type"
        icon={Utensils}
        onSuccess={fetchStats}
      />
    </div>
  );
}

function MealCard({
  icon: Icon,
  label,
  claimed,
  total,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  claimed: number;
  total: number;
  tone: "brand" | "brand-2" | "brand-3";
}) {
  const pct = total === 0 ? 0 : Math.round((claimed / total) * 100);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass relative overflow-hidden rounded-2xl p-6"
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-2xl opacity-60"
        style={{ background: `var(--color-${tone})` }}
      />
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/5">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="text-xl font-semibold">{claimed.toLocaleString()} <span className="text-sm text-muted-foreground">/ {total.toLocaleString()}</span></div>
        </div>
        <div className="ml-auto text-2xl font-semibold text-gradient">{pct}%</div>
      </div>
      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
        <motion.div initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} transition={{ duration: 1 }} className="h-full bg-gradient-brand" />
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
        <span>{claimed.toLocaleString()} claimed</span>
        <span>{(total - claimed).toLocaleString()} remaining</span>
      </div>
    </motion.div>
  );
}


