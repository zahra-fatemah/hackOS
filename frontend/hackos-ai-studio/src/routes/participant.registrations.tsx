import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, GlassCard } from "@/components/hackos/section";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useAuth } from "@/store/auth";
import { QrCode } from "lucide-react";

export const Route = createFileRoute("/participant/registrations")({
  head: () => ({
    meta: [
      { title: "My Registrations · HackOS AI" },
      { name: "description", content: "Your hackathon registrations." },
      { property: "og:title", content: "My Registrations · HackOS AI" },
      { property: "og:description", content: "All of your hackathon registrations." },
    ],
  }),
  component: Registrations,
});

function Registrations() {
  const email = useAuth((s) => s.email);
  const [realRegs, setRealRegs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!email) return;
    fetch(`http://192.168.1.67:5000/api/profile?email=${email}&role=participant`)
      .then((res) => res.json())
      .then(async (res) => {
        if (res.success && res.data.registrations) {
          const regs = res.data.registrations;
          const enhanced = await Promise.all(
            regs.map(async (r: any) => {
              try {
                const hRes = await fetch(`http://192.168.1.67:5000/api/hackathon/${r.hackathon_id}`);
                const hJson = await hRes.json();
                return { ...r, hackathonTitle: hJson.success ? hJson.data.title : "Unknown Hackathon" };
              } catch {
                return { ...r, hackathonTitle: "Unknown Hackathon" };
              }
            })
          );
          setRealRegs(enhanced);
        }
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, [email]);

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="History" title="My registrations" subtitle="All hackathons you've registered for." />
      <div className="overflow-hidden bg-card border border-border rounded-2xl">
        <div className="grid grid-cols-6 gap-4 border-b border-border bg-card px-6 py-3 text-[0.72rem] font-mono uppercase tracking-[0.1em] text-muted-foreground">
          <div className="col-span-2">Hackathon</div>
          <div>Team</div>
          <div>Reg ID</div>
          <div className="text-center">Status</div>
          <div className="text-right">Actions</div>
        </div>
        {loading ? (
          <div className="p-16 flex items-center justify-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-brand animate-[pulse-dot_1s_ease-in-out_infinite]" />
            <div className="h-2 w-2 rounded-full bg-brand animate-[pulse-dot_1s_ease-in-out_0.2s_infinite]" />
            <div className="h-2 w-2 rounded-full bg-brand animate-[pulse-dot_1s_ease-in-out_0.4s_infinite]" />
          </div>
        ) : realRegs.length === 0 ? (
          <div className="p-16 text-center text-sm text-muted-foreground relative overflow-hidden">
            <div className="absolute inset-0 hackos-grid" />
            <div className="relative z-10">No registrations found.</div>
          </div>
        ) : (
          realRegs.map((r, i) => (
            <motion.div
              key={r.id || r._id || i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="grid grid-cols-6 items-center gap-4 border-b border-border px-6 py-4 text-sm last:border-0 border-l-2 border-l-transparent transition-colors hover:border-l-brand hover:bg-accent/50"
            >
              <div className="col-span-2 min-w-0">
                <div className="truncate font-medium">{r.hackathonTitle}</div>
                <div className="text-xs text-muted-foreground">{new Date(r.created_at || Date.now()).toLocaleDateString()}</div>
              </div>
              <div className="truncate">{r.team_name || "Solo"}</div>
              <div className="font-mono text-xs text-muted-foreground truncate">{r.registration_id}</div>
              <div className="text-center">
                <Badge
                  className={
                    r.registration_status === "registered"
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-amber-500/15 text-amber-300"
                  }
                >
                  {r.registration_status}
                </Badge>
              </div>
              <div className="text-right">
                <Link
                  to={`/participant/qr?participantId=${r.id}`}
                  onClick={() => console.log("View QR clicked! Passing ID:", r.id, "Full registration object:", r)}
                  className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-accent px-3 text-xs font-medium text-brand transition-colors hover:bg-accent/80 hover:shadow-[0_0_12px_rgba(0,255,102,0.2)]"
                >
                  <QrCode className="mr-1.5 h-3.5 w-3.5" />
                  View QR
                </Link>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
