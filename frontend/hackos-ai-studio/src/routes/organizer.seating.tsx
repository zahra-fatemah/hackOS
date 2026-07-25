import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Grid3x3, Users, AlertTriangle, CheckCircle2, Download } from "lucide-react";
import { PageHeader, GlassCard } from "@/components/hackos/section";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/organizer/seating")({
  head: () => ({
    meta: [{ title: "Smart Seating · HackOS AI" }],
  }),
  component: Seating,
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

function Seating() {
  const [hackathonId, setHackathonId] = useState<string | null>(null);
  const [tablesCount, setTablesCount] = useState(5);
  const [tableCapacity, setTableCapacity] = useState(8);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SeatingResult | null>(null);

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
  }, []);

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
          hall_name: "Main Hall",
          rows,
          columns,
          tables: tablesCount,
          seats_per_table: tableCapacity,
          generated_by: "Organizer"
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Seating plan generated successfully");
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

  // Process data for UI
  const tablesMap = new Map<string, SeatAssignment[]>();
  if (result?.assignments) {
    for (const a of result.assignments) {
      if (!tablesMap.has(a.table_number)) {
        tablesMap.set(a.table_number, []);
      }
      tablesMap.get(a.table_number)!.push(a);
    }
  }

  const utilizationPct = result ? Math.round((result.occupied_seats / result.total_capacity) * 100) : 0;
  const seatsPerTableConfig = result ? Math.floor(result.total_capacity / result.tables) : tableCapacity;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <PageHeader
          eyebrow="AI Optimizer"
          title="Smart Seating"
          subtitle="Auto-generate optimal seat assignments maximizing space utilization."
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
        <div className="space-y-1.5">
          <Label>Number of Tables</Label>
          <Input type="number" value={tablesCount} onChange={(e) => setTablesCount(+e.target.value || 1)} min={1} />
        </div>
        <div className="space-y-1.5">
          <Label>Capacity per Table</Label>
          <Input type="number" value={tableCapacity} onChange={(e) => setTableCapacity(+e.target.value || 1)} min={1} />
        </div>
        <div className="md:col-span-2">
          <Button
            onClick={handleGenerate}
            disabled={loading || !hackathonId}
            className="w-full bg-gradient-brand text-white hover:opacity-90"
          >
            <Grid3x3 className="mr-2 h-4 w-4" />
            {loading ? "Optimizing..." : "Generate Seating Plan"}
          </Button>
        </div>
      </GlassCard>

      {result && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <GlassCard className="flex-1 p-6 flex flex-col items-center justify-center border-emerald-500/20">
              <div className="text-3xl font-bold text-emerald-400">{utilizationPct}%</div>
              <div className="text-sm text-muted-foreground mt-1">Utilization Rate</div>
            </GlassCard>
            <GlassCard className="flex-1 p-6 flex flex-col items-center justify-center border-blue-500/20">
              <div className="text-3xl font-bold text-blue-400">{result.occupied_seats}</div>
              <div className="text-sm text-muted-foreground mt-1">Seated Participants</div>
            </GlassCard>
            <GlassCard className="flex-1 p-6 flex flex-col items-center justify-center border-amber-500/20">
              <div className="text-3xl font-bold text-amber-400">{result.available_seats}</div>
              <div className="text-sm text-muted-foreground mt-1">Available Seats</div>
            </GlassCard>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: result.tables }).map((_, i) => {
              const tId = `T${(i + 1).toString().padStart(2, '0')}`;
              const assignments = tablesMap.get(tId) || [];
              const remaining = seatsPerTableConfig - assignments.length;
              
              // Find unique teams and judges assigned here
              const teams = Array.from(new Set(assignments.map(a => a.team_id).filter(Boolean)));
              const judges = Array.from(new Set(assignments.map(a => a.judge_id).filter(Boolean)));

              return (
                <GlassCard key={tId} className="p-5 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{tId}</h3>
                      <p className="text-xs text-muted-foreground">Capacity: {seatsPerTableConfig}</p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${remaining === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {remaining} seats free
                    </div>
                  </div>

                  <div className="flex-1">
                    {assignments.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 py-6">
                        <Users className="h-8 w-8 mb-2" />
                        <span className="text-sm">Empty Table</span>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Assigned Teams</div>
                          {teams.length === 0 ? (
                            <span className="text-xs text-muted-foreground">Individuals</span>
                          ) : (
                            teams.map(team => (
                              <div key={team} className="flex items-center gap-2 p-2 rounded-md bg-white/5 border border-white/5">
                                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                <span className="text-sm font-medium truncate">{team}</span>
                              </div>
                            ))
                          )}
                        </div>
                        {judges.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Assigned Judge</div>
                            {judges.map(judge => (
                              <div key={judge} className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded w-fit">
                                {judge}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
