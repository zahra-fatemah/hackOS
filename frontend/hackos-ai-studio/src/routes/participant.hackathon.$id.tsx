import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, Trophy, Users, Sparkles } from "lucide-react";
import { hackathons } from "@/data/mock";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/hackos/section";

export const Route = createFileRoute("/participant/hackathon/$id")({
  head: ({ params }) => {
    const h = hackathons.find((x) => x.id === params.id);
    const title = h ? `${h.name} · HackOS AI` : "Hackathon · HackOS AI";
    return {
      meta: [
        { title },
        { name: "description", content: h?.tagline ?? "Hackathon details on HackOS AI." },
        { property: "og:title", content: title },
        { property: "og:description", content: h?.tagline ?? "Hackathon details on HackOS AI." },
      ],
    };
  },
  component: Details,
});

function Details() {
  const { id } = useParams({ from: "/participant/hackathon/$id" });
  const [h, setH] = useState<any>(null);

  useEffect(() => {
    fetch(`http://localhost:5000/api/hackathon/${id}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          const raw = res.data;
          setH({
            id: raw.id,
            name: raw.title || "Untitled",
            tagline: raw.theme || "Hackathon",
            banner: "linear-gradient(to bottom right, #1a1a2e, #0f0f1f)",
            organizer: "Organizer",
            startDate: raw.start_date || "",
            endDate: raw.end_date || "",
            location: raw.venue ? `${raw.venue}, ${raw.city}` : "Online",
            prizePool: raw.prize_pool || "TBA",
            participants: 0,
            description: raw.description || "",
            rules: raw.rules || [],
            tracks: raw.tracks || [],
            timeline: [],
            sponsors: raw.sponsors || [],
          });
        }
      });
  }, [id]);

  if (!h) return <div className="py-20 text-center text-muted-foreground">Loading hackathon details...</div>;

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass relative h-52 overflow-hidden rounded-3xl md:h-72"
        style={{ background: h.banner }}
      >
        <div className="absolute inset-0 hackos-grid opacity-30" />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background/95 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-white/70">{h.organizer}</div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white md:text-4xl">{h.name}</h1>
            <p className="mt-1 text-white/80">{h.tagline}</p>
          </div>
          <Link to="/participant/register/$id" params={{ id: h.id }}>
            <Button className="rounded-xl bg-white text-black hover:bg-white/90">
              <Sparkles className="mr-2 h-4 w-4" /> Register with AI
            </Button>
          </Link>
        </div>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { icon: Calendar, label: "Dates", value: `${h.startDate} → ${h.endDate}` },
          { icon: MapPin, label: "Venue", value: h.location },
          { icon: Trophy, label: "Prize pool", value: h.prizePool },
          { icon: Users, label: "Participants", value: h.participants.toLocaleString() },
        ].map((s) => (
          <GlassCard key={s.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/5">
                <s.icon className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.label}</div>
                <div className="text-sm font-medium">{s.value}</div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2 p-6">
          <h2 className="text-lg font-semibold">About</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{h.description}</p>

          <h3 className="mt-8 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Rules</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {h.rules.map((r) => (
              <li key={r} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                {r}
              </li>
            ))}
          </ul>

          <h3 className="mt-8 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Tracks</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {h.tracks.map((t) => (
              <Badge key={t} className="bg-white/5 text-foreground">{t}</Badge>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Timeline</h3>
          <ol className="mt-4 space-y-3">
            {h.timeline.map((t, i) => (
              <li key={i} className="relative pl-6">
                <span className="absolute left-0 top-1 grid h-4 w-4 place-items-center rounded-full bg-gradient-brand">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                </span>
                <div className="text-xs text-muted-foreground">{t.time}</div>
                <div className="text-sm font-medium">{t.label}</div>
              </li>
            ))}
          </ol>

          <h3 className="mt-8 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Sponsors</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {h.sponsors.map((s) => (
              <span key={s} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs">
                {s}
              </span>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
