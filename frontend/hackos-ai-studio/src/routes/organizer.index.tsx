import { createFileRoute, Link } from "@tanstack/react-router";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell } from "recharts";
import { motion } from "framer-motion";
import { Sparkles, Users, Utensils, FileText, ArrowUpRight } from "lucide-react";
import { PageHeader, GlassCard } from "@/components/hackos/section";
import { StatCard } from "@/components/hackos/stat-card";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/store/auth";

export const Route = createFileRoute("/organizer/")({
  head: () => ({
    meta: [
      { title: "Command Center · HackOS AI" },
      { name: "description", content: "Real-time analytics and controls for your hackathon operations." },
      { property: "og:title", content: "Organizer Command Center · HackOS AI" },
      { property: "og:description", content: "Real-time analytics and controls." },
    ],
  }),
  component: Dashboard,
});

const COLORS = ["oklch(0.72 0.19 295)", "oklch(0.78 0.15 220)", "oklch(0.75 0.22 340)", "oklch(0.78 0.16 75)", "oklch(0.72 0.16 155)"];

function Dashboard() {
  const email = useAuth((s) => s.email);
  const [stats, setStats] = useState({
    hackathons: 0,
    participants: 0,
    mealsClaimed: 0,
    pptsUploaded: 0,
  });
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [trackData, setTrackData] = useState<any[]>([]);
  const [recentAct, setRecentAct] = useState<any[]>([]);
  
  useEffect(() => {
    if (!email) return;
    
    fetch(`http://localhost:5000/api/organizer/dashboard-stats?organizer_email=${email}`)
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          setStats({
            hackathons: res.data.hackathons,
            participants: res.data.participants,
            mealsClaimed: res.data.mealsClaimed,
            pptsUploaded: res.data.pptsUploaded
          });
          // Reverse weekly data so chronological order is displayed in AreaChart
          setWeeklyData([...res.data.weekly].reverse());
          setTrackData(res.data.tracks);
          setRecentAct(res.data.recentActivity);
        }
      })
      .catch(console.error);
  }, [email]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Live"
        title="Command center"
        subtitle="Everything happening across your hackathons — in one glance."
        actions={
          <Link to="/organizer/create">
            <Button className="bg-gradient-brand text-white hover:opacity-90">
              <Sparkles className="mr-2 h-4 w-4" /> Create with AI
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={Sparkles} label="Hackathons" value={stats.hackathons} delta="Active" />
        <StatCard icon={Users} label="Participants" value={stats.participants} delta="Total" accent="brand-2" />
        <StatCard icon={Utensils} label="Meals claimed" value={stats.mealsClaimed} delta="Live" accent="brand-3" />
        <StatCard icon={FileText} label="PPTs uploaded" value={stats.pptsUploaded} delta="AI-graded" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Registrations & meals</div>
              <div className="text-xs text-muted-foreground">Rolling 7-day view</div>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: "oklch(0.72 0.19 295)" }} /> Registrations</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: "oklch(0.78 0.15 220)" }} /> Meals</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.72 0.19 295)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="oklch(0.72 0.19 295)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.78 0.15 220)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="oklch(0.78 0.15 220)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="oklch(1 0 0 / 0.05)" vertical={false} />
                <XAxis dataKey="day" stroke="oklch(0.7 0 0)" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis stroke="oklch(0.7 0 0)" tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.20 0.018 265)",
                    border: "1px solid oklch(1 0 0 / 0.1)",
                    borderRadius: 12,
                  }}
                />
                <Area type="monotone" dataKey="registrations" stroke="oklch(0.72 0.19 295)" strokeWidth={2} fill="url(#g1)" />
                <Area type="monotone" dataKey="meals" stroke="oklch(0.78 0.15 220)" strokeWidth={2} fill="url(#g2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="text-sm font-medium">Track distribution</div>
          <div className="mt-2 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={trackData}
                  dataKey="value"
                  innerRadius={44}
                  outerRadius={72}
                  paddingAngle={4}
                  stroke="none"
                >
                  {trackData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 space-y-2 text-xs">
            {trackData.map((t: any, i: number) => (
              <div key={t.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i] }} />
                  {t.name}
                </span>
                <span className="text-muted-foreground">{t.value}%</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm font-medium">Recent activity</div>
          <Button variant="ghost" size="sm" className="text-xs">
            View all <ArrowUpRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
        <div className="space-y-2">
          {recentAct.map((a: any, i: number) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass flex items-center gap-3 rounded-xl p-3"
            >
              <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-brand text-[10px] font-semibold text-white">
                {a.actor.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1 text-sm">
                <span className="font-medium">{a.actor}</span>{" "}
                <span className="text-muted-foreground">{a.action}</span>{" "}
                <span className="font-medium">{a.target}</span>
              </div>
              <div className="text-xs text-muted-foreground">{a.time}</div>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
