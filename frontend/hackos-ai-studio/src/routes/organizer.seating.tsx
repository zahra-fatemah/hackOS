import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Grid3x3, Download, MapPin } from "lucide-react";
import { PageHeader, GlassCard } from "@/components/hackos/section";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/store/auth";
import { motion } from "framer-motion";

export const Route = createFileRoute("/organizer/seating")({
  head: () => ({
    meta: [{ title: "Smart Seating Map · HackOS AI" }],
  }),
  component: SeatingMap,
});

type SeatAssignment = {
  table_number: string;
  seat_number: string;
  team_id: string;
  judge_id: string;
  participant_id: string;
  registration_id: string;
};

type SeatingResult = {
  hackathon_id: string;
  generated_at: string;
  hall_name: string;
  rows: number;
  columns: number;
  tables: number;
  total_capacity: number;
  occupied_seats: number;
  available_seats: number;
  assignments?: SeatAssignment[];
};

const teamColors = [
  "bg-blue-500 shadow-blue-500/40 border border-blue-400",
  "bg-emerald-500 shadow-emerald-500/40 border border-emerald-400",
  "bg-purple-500 shadow-purple-500/40 border border-purple-400",
  "bg-amber-500 shadow-amber-500/40 border border-amber-400",
  "bg-pink-500 shadow-pink-500/40 border border-pink-400",
  "bg-cyan-500 shadow-cyan-500/40 border border-cyan-400",
  "bg-rose-500 shadow-rose-500/40 border border-rose-400",
  "bg-indigo-500 shadow-indigo-500/40 border border-indigo-400",
];

const getTeamColor = (teamId: string) => {
  if (!teamId) return "bg-white/20 border border-white/30 text-white shadow-white/10"; // Individuals
  let hash = 0;
  for (let i = 0; i < teamId.length; i++) hash = teamId.charCodeAt(i) + ((hash << 5) - hash);
  return teamColors[Math.abs(hash) % teamColors.length] + " text-white shadow-lg";
};

const getInitials = (name: string) => {
  if (!name) return "?";
  const parts = name.split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const containerVariant = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariant = {
  hidden: { opacity: 0, scale: 0.8, y: 20 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 15 } }
};

function SeatingMap() {
  const email = useAuth((s) => s.email);
  const [hackathonId, setHackathonId] = useState<string | null>(null);
  const [tablesCount, setTablesCount] = useState(6);
  const [tableCapacity, setTableCapacity] = useState(8);
  const [hallName, setHallName] = useState("Main Hall");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SeatingResult | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);

  useEffect(() => {
    fetch("http://192.168.1.67:5000/api/hackathons")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data.length > 0) {
          const hid = json.data[0].id || json.data[0]._id;
          setHackathonId(hid);
          fetchCurrent(hid);
        }
      })
      .catch(console.error);

    if (email) {
      fetch(`http://192.168.1.67:5000/api/organizer/participants?organizer_email=${email}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success) setParticipants(json.data);
        })
        .catch(console.error);
    }
  }, [email]);

  const fetchCurrent = (hid: string) => {
    fetch(`http://192.168.1.67:5000/api/seating/${hid}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setResult(json.data);
        }
      })
      .catch(console.error);
  };

  const handleGenerate = async () => {
    if (!hackathonId) {
      toast.error("No hackathon selected");
      return;
    }

    setLoading(true);
    const columns = Math.ceil(Math.sqrt(tablesCount));
    const rows = Math.ceil(tablesCount / columns);

    try {
      const res = await fetch("http://192.168.1.67:5000/api/generate-seating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hackathon_id: hackathonId,
          hall_name: hallName || "Main Hall",
          rows,
          columns,
          tables: tablesCount,
          seats_per_table: tableCapacity,
          generated_by: "Organizer"
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Seating map generated successfully");
        fetchCurrent(hackathonId);
      } else {
        toast.error(json.message || "Failed to generate seating");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const utilizationPct = result ? Math.round((result.occupied_seats / result.total_capacity) * 100) : 0;
  const seatsPerTableConfig = result ? Math.floor(result.total_capacity / result.tables) : tableCapacity;
  
  // Calculate grid columns dynamically based on math so it looks like a real room
  const gridColsClass = result ? `grid-cols-1 md:grid-cols-2 lg:grid-cols-${result.columns > 4 ? 4 : result.columns}` : 'grid-cols-1 md:grid-cols-3';

  const getParticipantName = (pid: string) => {
    const p = participants.find((x) => x.participant_id === pid);
    return p ? p.full_name : "Unknown Participant";
  };

  const tablesMap = new Map<string, SeatAssignment[]>();
  if (result?.assignments) {
    for (const a of result.assignments) {
      if (!tablesMap.has(a.table_number)) {
        tablesMap.set(a.table_number, []);
      }
      tablesMap.get(a.table_number)!.push(a);
    }
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-start">
        <PageHeader
          eyebrow="AI Optimizer"
          title="Live Seating Map"
          subtitle="Visualize the physical seating layout with colorful, team-based chair allocations."
        />
        {result && (
          <Button 
            variant="outline" 
            className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 mt-4"
            onClick={() => window.open(`http://192.168.1.67:5000/api/export-seating/${hackathonId}`, "_blank")}
          >
            <Download className="mr-2 h-4 w-4" />
            Export to Excel
          </Button>
        )}
      </div>

      <GlassCard className="grid gap-4 p-6 md:grid-cols-4 items-end">
        <div className="space-y-1.5 md:col-span-1">
          <Label>Room / Hall Name</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              className="pl-9" 
              value={hallName} 
              onChange={(e) => setHallName(e.target.value)} 
              placeholder="e.g. Main Hall" 
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Number of Tables</Label>
          <Input type="number" value={tablesCount} onChange={(e) => setTablesCount(+e.target.value || 1)} min={1} />
        </div>
        <div className="space-y-1.5">
          <Label>Capacity per Table</Label>
          <Input type="number" value={tableCapacity} onChange={(e) => setTableCapacity(+e.target.value || 1)} min={1} />
        </div>
        <div className="md:col-span-1">
          <Button
            onClick={handleGenerate}
            disabled={loading || !hackathonId}
            className="w-full bg-gradient-brand text-white hover:opacity-90"
          >
            <Grid3x3 className="mr-2 h-4 w-4" />
            {loading ? "Optimizing Layout..." : "Generate Seating Map"}
          </Button>
        </div>
      </GlassCard>

      {result && (
        <div className="space-y-12">
          {/* Key Metrics */}
          <div className="flex flex-col md:flex-row gap-4">
            <GlassCard className="flex-1 p-6 flex flex-col items-center justify-center border-emerald-500/20">
              <div className="text-3xl font-bold text-emerald-400">{utilizationPct}%</div>
              <div className="text-sm text-muted-foreground mt-1">Room Utilization</div>
            </GlassCard>
            <GlassCard className="flex-1 p-6 flex flex-col items-center justify-center border-blue-500/20">
              <div className="text-3xl font-bold text-blue-400">{result.occupied_seats}</div>
              <div className="text-sm text-muted-foreground mt-1">Seated Hackers</div>
            </GlassCard>
            <GlassCard className="flex-1 p-6 flex flex-col items-center justify-center border-amber-500/20">
              <div className="text-3xl font-bold text-amber-400">{result.available_seats}</div>
              <div className="text-sm text-muted-foreground mt-1">Available Chairs</div>
            </GlassCard>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-widest uppercase text-white/50 mb-8 flex items-center justify-center gap-4">
              <div className="h-px bg-white/10 w-24"></div>
              {result.hall_name}
              <div className="h-px bg-white/10 w-24"></div>
            </h2>
          </div>

          {/* Graphical Map */}
          <motion.div 
            variants={containerVariant} 
            initial="hidden" 
            animate="show" 
            className={`grid ${gridColsClass} gap-12 max-w-7xl mx-auto`}
          >
            {Array.from({ length: result.tables }).map((_, i) => {
              const tId = `T${(i + 1).toString().padStart(2, '0')}`;
              const assignments = tablesMap.get(tId) || [];
              
              // Map assignments into a fixed array of length `seatsPerTableConfig`
              const chairs = new Array(seatsPerTableConfig).fill(null);
              assignments.forEach(a => {
                const sNum = parseInt(a.seat_number.replace(/\D/g, ''));
                if (!isNaN(sNum) && sNum > 0 && sNum <= seatsPerTableConfig) {
                  chairs[sNum - 1] = a;
                } else {
                  // Fallback if parsing fails or index is out of bounds
                  const emptyIdx = chairs.findIndex(c => c === null);
                  if (emptyIdx !== -1) chairs[emptyIdx] = a;
                }
              });

              const half = Math.ceil(chairs.length / 2);
              const topRow = chairs.slice(0, half);
              const bottomRow = chairs.slice(half);

              return (
                <motion.div variants={itemVariant} key={tId} className="flex flex-col items-center gap-3">
                  
                  {/* Top Chairs */}
                  <div className="flex gap-3">
                    {topRow.map((seat, idx) => (
                      <Chair key={`top-${idx}`} seat={seat} index={idx + 1} getParticipantName={getParticipantName} />
                    ))}
                  </div>

                  {/* Table Surface */}
                  <div className="w-full max-w-[300px] h-20 bg-white/5 rounded-2xl border-2 border-white/10 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
                    <span className="font-bold text-2xl text-white/40 tracking-widest relative z-10">{tId}</span>
                    <span className="text-[10px] text-white/20 uppercase font-medium mt-1 relative z-10">{assignments.length}/{seatsPerTableConfig} filled</span>
                  </div>

                  {/* Bottom Chairs */}
                  <div className="flex gap-3">
                    {bottomRow.map((seat, idx) => (
                      <Chair key={`bottom-${idx}`} seat={seat} index={half + idx + 1} getParticipantName={getParticipantName} />
                    ))}
                  </div>

                </motion.div>
              );
            })}
          </motion.div>

        </div>
      )}
    </div>
  );
}

// Chair Component with Tooltip
function Chair({ seat, index, getParticipantName }: { seat: SeatAssignment | null, index: number, getParticipantName: (id: string) => string }) {
  return (
    <motion.div 
      whileHover={seat ? { scale: 1.15, y: -2 } : {}}
      className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs relative group cursor-help transition-colors
        ${seat ? getTeamColor(seat.team_id) : 'bg-white/5 border-2 border-dashed border-white/10 text-white/10'}`}
    >
      {seat ? getInitials(getParticipantName(seat.participant_id)) : index}
      
      {/* Tooltip */}
      {seat && (
        <div className="absolute bottom-full mb-3 hidden group-hover:block w-max max-w-[200px] p-3 bg-zinc-950 border border-white/10 rounded-xl shadow-2xl z-50 text-left pointer-events-none">
          <div className="font-bold text-white text-sm truncate">{getParticipantName(seat.participant_id)}</div>
          <div className="text-xs text-zinc-400 mt-1 truncate">Team: <span className="text-zinc-200 font-medium">{seat.team_id || "Individual"}</span></div>
          <div className="text-xs text-zinc-400 mt-0.5">Seat: <span className="text-zinc-200 font-medium">{seat.seat_number}</span></div>
          {seat.judge_id && (
            <div className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 mt-2 bg-indigo-500/10 inline-block px-2 py-0.5 rounded">
              Judge: {seat.judge_id}
            </div>
          )}
          {/* Tooltip Arrow */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-zinc-950 border-r border-b border-white/10 rotate-45"></div>
        </div>
      )}
    </motion.div>
  );
}
