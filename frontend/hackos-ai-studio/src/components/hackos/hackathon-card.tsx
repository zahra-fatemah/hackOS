import { motion } from "framer-motion";
import { Calendar, MapPin, Trophy, Users } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { Hackathon } from "@/data/mock";
import { Badge } from "@/components/ui/badge";

export function HackathonCard({ h, index = 0 }: { h: Hackathon; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="group glass relative overflow-hidden rounded-2xl"
    >
      <div className="relative h-32 overflow-hidden" style={{ background: h.banner }}>
        <div className="absolute inset-0 opacity-30 mix-blend-overlay hackos-grid" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-card/90 to-transparent" />
        <div className="absolute right-3 top-3 flex gap-1.5">
          {h.trending && (
            <Badge className="border-white/20 bg-white/15 text-white backdrop-blur">
              Trending
            </Badge>
          )}
          <Badge variant="secondary" className="bg-black/40 text-white backdrop-blur">
            {h.mode}
          </Badge>
        </div>
      </div>
      <div className="space-y-3 p-5">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {h.organizer}
          </div>
          <h3 className="mt-1 text-lg font-semibold tracking-tight">{h.name}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">{h.tagline}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{h.startDate}</div>
          <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{h.location}</div>
          <div className="flex items-center gap-1.5"><Trophy className="h-3.5 w-3.5" />{h.prizePool}</div>
          <div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{h.participants.toLocaleString()}</div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {h.tracks.slice(0, 3).map((t) => (
            <span
              key={t}
              className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>
        <Link
          to="/participant/hackathon/$id"
          params={{ id: h.id }}
          className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-white/5 px-4 py-2 text-sm font-medium transition group-hover:bg-gradient-brand group-hover:text-white"
        >
          View details →
        </Link>
      </div>
    </motion.div>
  );
}
