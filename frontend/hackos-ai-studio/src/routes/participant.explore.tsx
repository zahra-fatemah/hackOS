import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/components/hackos/section";
import { HackathonCard } from "@/components/hackos/hackathon-card";
// import { hackathons } from "@/data/mock";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export const Route = createFileRoute("/participant/explore")({
  head: () => ({
    meta: [
      { title: "Explore Hackathons · HackOS AI" },
      { name: "description", content: "Discover trending and upcoming hackathons on HackOS AI." },
      { property: "og:title", content: "Explore Hackathons · HackOS AI" },
      { property: "og:description", content: "Discover trending and upcoming hackathons." },
    ],
  }),
  component: Explore,
});

const filters = ["All", "Online", "In-Person", "Hybrid", "Trending", "This month"];

function Explore() {
  const [q, setQ] = useState("");
  const [f, setF] = useState("All");
  const [allHackathons, setAllHackathons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/api/hackathons")
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          const mapped = res.data.map((h: any) => ({
            id: h.id,
            name: h.title || "Untitled",
            tagline: h.theme || "Hackathon",
            banner: "linear-gradient(to bottom right, #1a1a2e, #0f0f1f)",
            organizer: "Organizer",
            startDate: h.start_date || "",
            endDate: h.end_date || "",
            location: h.venue ? `${h.venue}, ${h.city}` : "Online",
            prizePool: h.prize_pool || "TBA",
            participants: 0,
            description: h.description || "",
            rules: h.rules || [],
            tracks: h.tracks || [],
            timeline: [],
            sponsors: h.sponsors || [],
            trending: false,
            mode: h.venue ? "In-Person" : "Online"
          }));
          setAllHackathons(mapped);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const list = allHackathons.filter((h) => {
    const matchQ = h.name.toLowerCase().includes(q.toLowerCase()) || h.tracks.join(" ").toLowerCase().includes(q.toLowerCase());
    const matchF =
      f === "All" ||
      (f === "Trending" && h.trending) ||
      h.mode === f;
    return matchQ && matchF;
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Discover"
        title="Explore hackathons"
        subtitle="Filter by location, domain, and prize pool. Powered by AI recommendations."
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search hackathons, tracks, sponsors…"
            className="h-11 pl-10 bg-card border-border focus-visible:border-brand focus-visible:ring-0 focus-visible:shadow-[0_0_0_2px_rgba(0,255,102,0.1)] transition-all duration-200"
          />
        </div>
        <Button variant="outline" className="h-11 rounded-xl border-white/10 bg-white/5">
          <SlidersHorizontal className="mr-2 h-4 w-4" /> Filters
        </Button>
      </div>

      <div className="no-scrollbar -mx-2 flex gap-2 overflow-x-auto px-2">
        {filters.map((tag) => (
          <button
            key={tag}
            onClick={() => setF(tag)}
            className={`relative shrink-0 px-4 py-1.5 text-xs transition-colors duration-200 border-b-2 ${
              f === tag 
                ? "text-brand border-brand" 
                : "text-muted-foreground border-transparent hover:text-foreground"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full py-20 text-center text-muted-foreground">Loading hackathons...</div>
        ) : (
          list.map((h, i) => <HackathonCard key={h.id} h={h} index={i} />)
        )}
        {!loading && list.length === 0 && (
          <div className="glass col-span-full rounded-2xl p-16 text-center text-muted-foreground">
            No hackathons match your search.
          </div>
        )}
      </div>
    </div>
  );
}
