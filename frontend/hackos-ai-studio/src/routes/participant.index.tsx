import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Sparkles, Ticket, Trophy, Users } from "lucide-react";
import { PageHeader, GlassCard } from "@/components/hackos/section";
import { StatCard } from "@/components/hackos/stat-card";
import { HackathonCard } from "@/components/hackos/hackathon-card";
import { hackathons, registrations } from "@/data/mock";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/participant/")({
  head: () => ({
    meta: [
      { title: "Dashboard · HackOS AI" },
      { name: "description", content: "Your hackathon dashboard — upcoming events, registrations and AI insights." },
      { property: "og:title", content: "Participant Dashboard · HackOS AI" },
      { property: "og:description", content: "Your hackathon dashboard on HackOS AI." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const upcoming = hackathons.slice(0, 3);
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Welcome back"
        title="Ready for your next hack?"
        subtitle="Track registrations, discover events, and jump back into your active hackathons."
        actions={
          <Link to="/participant/explore">
            <Button className="bg-gradient-brand text-white hover:opacity-90">
              <Sparkles className="mr-2 h-4 w-4" /> Explore hackathons
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={Ticket} label="Active regs" value={2} delta="2 upcoming" />
        <StatCard icon={Trophy} label="Wins" value={3} delta="Top 5% globally" accent="brand-2" />
        <StatCard icon={Users} label="Teammates" value={8} delta="+2 this month" accent="brand-3" />
        <StatCard icon={Sparkles} label="AI credits" value={480} suffix=" left" delta="Refill on 1st" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Upcoming for you</div>
              <div className="text-xs text-muted-foreground">Personalized picks based on your skills.</div>
            </div>
            <Link to="/participant/explore" className="text-xs text-brand hover:underline">See all →</Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {upcoming.slice(0, 2).map((h, i) => <HackathonCard key={h.id} h={h} index={i} />)}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="text-sm font-medium">Your registrations</div>
          <div className="mt-4 space-y-3">
            {registrations.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-xl p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{r.hackathon}</div>
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
                <div className="mt-1 text-xs text-muted-foreground">
                  {r.team} · {r.id}
                </div>
              </motion.div>
            ))}
          </div>
          <Link to="/participant/qr">
            <Button variant="outline" className="mt-4 w-full rounded-xl border-white/10 bg-white/5">
              Open my QR pass
            </Button>
          </Link>
        </GlassCard>
      </div>
    </div>
  );
}
