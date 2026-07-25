import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, Download, Grid3x3 } from "lucide-react";
import { PageHeader, GlassCard } from "@/components/hackos/section";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/store/auth";
import { useEffect } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const Route = createFileRoute("/organizer/seating")({
  head: () => ({
    meta: [
      { title: "Smart Seating · HackOS AI" },
      { name: "description", content: "AI-generated seat maps for teams with search and export." },
      { property: "og:title", content: "Smart Seating · HackOS AI" },
      { property: "og:description", content: "Colored interactive seat maps for teams." },
    ],
  }),
  component: Seating,
});

const TEAM_COLORS = [
  "oklch(0.72 0.19 295)",
  "oklch(0.78 0.15 220)",
  "oklch(0.75 0.22 340)",
  "oklch(0.78 0.16 75)",
  "oklch(0.72 0.16 155)",
  "oklch(0.72 0.19 25)",
  "oklch(0.72 0.19 200)",
  "oklch(0.72 0.19 130)",
];

type Seat = { row: number; col: number; team: string; member: string; number: number };

function Seating() {
  const [rooms, setRooms] = useState(2);
  const [rows, setRows] = useState(6);
  const [cols, setCols] = useState(8);
  const [name, setName] = useState("Main Hall");
  const [active, setActive] = useState(0);
  const [generated, setGenerated] = useState(true);
  const [q, setQ] = useState("");
  
  const email = useAuth((s) => s.email);
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

  const uniqueTeams = useMemo(() => {
    const ts = new Set(participants.map(p => p.college || p.university || "Independent"));
    return Array.from(ts);
  }, [participants]);

  const layout = useMemo<Seat[][]>(() => {
    if (!generated || participants.length === 0) return [];
    const all: Seat[] = [];
    
    // Distribute participants to seats
    let idx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (idx >= participants.length) break;
        const p = participants[idx];
        const team = p.college || p.university || "Independent";
        all.push({ row: r, col: c, team: team, member: p.full_name, number: idx + 1 });
        idx++;
      }
    }
    // split by room
    const per = Math.ceil(all.length / rooms);
    if (per === 0) return [];
    return Array.from({ length: rooms }).map((_, i) => all.slice(i * per, (i + 1) * per));
  }, [rows, cols, rooms, generated, participants]);

  const teamColor = (team: string) => {
    const idx = uniqueTeams.indexOf(team);
    return TEAM_COLORS[Math.max(0, idx) % TEAM_COLORS.length];
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Room map"
        title="Smart seating"
        subtitle="Auto-generate seat assignments — hover any seat to see the team."
        actions={
          <Button className="bg-gradient-brand text-white hover:opacity-90" onClick={() => toast.success("Layout exported")}>
            <Download className="mr-2 h-4 w-4" /> Export layout
          </Button>
        }
      />

      <GlassCard className="grid gap-4 p-6 md:grid-cols-6">
        <div className="space-y-1.5 md:col-span-2">
          <Label>Room name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5"><Label>Rooms</Label><Input type="number" value={rooms} onChange={(e) => setRooms(+e.target.value || 1)} /></div>
        <div className="space-y-1.5"><Label>Rows</Label><Input type="number" value={rows} onChange={(e) => setRows(+e.target.value || 1)} /></div>
        <div className="space-y-1.5"><Label>Columns</Label><Input type="number" value={cols} onChange={(e) => setCols(+e.target.value || 1)} /></div>
        <div className="flex items-end">
          <Button
            onClick={() => { setGenerated(true); toast.success("Seating generated"); }}
            className="w-full bg-gradient-brand text-white hover:opacity-90"
          >
            <Grid3x3 className="mr-2 h-4 w-4" /> Generate
          </Button>
        </div>
      </GlassCard>

      <div className="glass rounded-2xl p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-1">
            {Array.from({ length: rooms }).map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`relative rounded-xl px-4 py-1.5 text-sm ${active === i ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {active === i && (
                  <motion.div layoutId="room-pill" className="absolute inset-0 -z-10 rounded-xl bg-gradient-brand-soft ring-1 ring-white/10" />
                )}
                {name} · {i + 1}
              </button>
            ))}
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search team or seat…" className="h-9 pl-10" />
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/5 bg-black/20 p-6">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full border border-white/10 bg-white/5 px-6 py-1 text-[11px] uppercase tracking-widest text-muted-foreground">
              Stage
            </div>
          </div>
          <TooltipProvider delayDuration={80}>
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35 }}
                className="grid gap-1.5"
                style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
              >
                {(layout[active] ?? []).map((s, i) => {
                  const highlighted =
                    q &&
                    (s.team.toLowerCase().includes(q.toLowerCase()) ||
                      String(s.number).includes(q));
                  return (
                    <Tooltip key={i}>
                      <TooltipTrigger asChild>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.6 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.003 }}
                          whileHover={{ scale: 1.15, zIndex: 10 }}
                          className="relative aspect-square cursor-pointer rounded-md ring-1 ring-white/10"
                          style={{
                            background: teamColor(s.team),
                            opacity: q ? (highlighted ? 1 : 0.15) : 0.9,
                            boxShadow: highlighted ? "0 0 0 2px #fff" : undefined,
                          }}
                        >
                          <span className="absolute inset-0 grid place-items-center text-[9px] font-semibold text-white/90">
                            {s.number}
                          </span>
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent className="border-white/10 bg-background">
                        <div className="text-xs">
                          <div className="font-medium">{s.team}</div>
                          <div className="text-muted-foreground">{s.member} · Seat {s.number}</div>
                          <div className="text-muted-foreground">Room {active + 1}</div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </TooltipProvider>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
          {uniqueTeams.slice(0, 8).map((team, i) => (
            <div key={team} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
              <span className="h-2 w-2 rounded-full" style={{ background: TEAM_COLORS[i % TEAM_COLORS.length] }} />
              {team}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
