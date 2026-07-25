import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Download, Search, Mail } from "lucide-react";
import { PageHeader, GlassCard } from "@/components/hackos/section";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { useAuth } from "@/store/auth";

export const Route = createFileRoute("/organizer/participants")({
  head: () => ({
    meta: [
      { title: "Manage Participants · HackOS AI" },
      { name: "description", content: "Search, filter and manage participants and teams." },
      { property: "og:title", content: "Manage Participants · HackOS AI" },
      { property: "og:description", content: "Search, filter and manage participants." },
    ],
  }),
  component: Participants,
});

function Participants() {
  const email = useAuth((s) => s.email);
  const [q, setQ] = useState("");
  const [participants, setParticipants] = useState<any[]>([]);

  useEffect(() => {
    if (!email) return;
    fetch(`http://localhost:5000/api/organizer/participants?organizer_email=${email}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) setParticipants(json.data);
      })
      .catch(console.error);
  }, [email]);

  const rows = participants
    .map(p => ({
      id: p.id || p.participant_id,
      name: p.full_name,
      team: p.college || p.university || "Independent",
      track: "Participant", // fallback
      status: "Confirmed",
    }))
    .filter(
      (r) =>
        r.name.toLowerCase().includes(q.toLowerCase()) ||
        r.team.toLowerCase().includes(q.toLowerCase()),
    );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={`${rows.length} participants`}
        title="Manage participants"
        subtitle="All registrations across your active hackathons."
        actions={
          <>
            <Button variant="outline" className="border-white/10 bg-white/5">
              <Mail className="mr-2 h-4 w-4" /> Email all
            </Button>
            <Button className="bg-gradient-brand text-white hover:opacity-90">
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          </>
        }
      />

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or team…"
          className="h-11 pl-10"
        />
      </div>

      <GlassCard className="overflow-hidden">
        <div className="grid grid-cols-6 gap-4 border-b border-white/5 px-6 py-3 text-[11px] uppercase tracking-wider text-muted-foreground">
          <div className="col-span-2">Name</div>
          <div>Team</div>
          <div>Track</div>
          <div>Status</div>
          <div className="text-right">Action</div>
        </div>
        {rows.slice(0, 12).map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
            className="grid grid-cols-6 items-center gap-4 border-b border-white/5 px-6 py-3 text-sm last:border-0 hover:bg-white/[0.02]"
          >
            <div className="col-span-2 flex items-center gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-brand text-[10px] font-semibold text-white">
                {r.name.split(" ").map((s) => s[0]).join("")}
              </div>
              <div>
                <div className="font-medium">{r.name}</div>
                <div className="text-xs text-muted-foreground">{r.name.toLowerCase().replace(/[^a-z]/g, "")}@school.edu</div>
              </div>
            </div>
            <div className="text-muted-foreground">{r.team}</div>
            <div className="text-muted-foreground">{["AI Agents", "DevTools", "Consumer"][i % 3]}</div>
            <div>
              <Badge className="bg-emerald-500/15 text-emerald-300">Confirmed</Badge>
            </div>
            <div className="text-right">
              <Button variant="ghost" size="sm" className="text-xs">View →</Button>
            </div>
          </motion.div>
        ))}
      </GlassCard>
    </div>
  );
}
