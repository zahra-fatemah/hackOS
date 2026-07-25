import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Coffee, Utensils, Moon, ScanLine, Check, X } from "lucide-react";
import { PageHeader } from "@/components/hackos/section";
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
    fetch(`http://192.168.1.67:5000/api/organizer/food-stats?organizer_email=${email}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) setStats(json.data);
      })
      .catch(console.error);

    fetch(`http://192.168.1.67:5000/api/organizer/participants?organizer_email=${email}`)
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
        <div className="glass rounded-xl p-6 lg:col-span-2">
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
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="time" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#091B10", borderColor: "#0F3D24", borderRadius: "8px" }}
                  itemStyle={{ color: "#E1F5EC" }}
                />
                <Area type="monotone" dataKey="claimed" stroke="oklch(0.75 0.22 340)" strokeWidth={2} fillOpacity={1} fill="url(#fg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-xl p-6">
          <div className="text-sm font-medium">Recent scans</div>
          <div className="mt-4 space-y-4">
            {stats.recent.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">No recent activity</div>
            ) : (
              stats.recent.map((scan: any, i: number) => (
                <div key={i} className="flex items-center justify-between border-b border-border/40 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-brand/10 flex items-center justify-center text-brand">
                      <Utensils className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Ticket #{scan.ticketId?.substring(0, 8)}</div>
                      <div className="text-xs text-muted-foreground capitalize">{scan.mealType}</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(scan.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
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


