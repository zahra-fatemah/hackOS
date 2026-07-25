import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Download, Maximize2, Share2 } from "lucide-react";
import { useState, useEffect } from "react";
import { PageHeader, GlassCard } from "@/components/hackos/section";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export const Route = createFileRoute("/participant/qr")({
  head: () => ({
    meta: [
      { title: "My QR Pass · HackOS AI" },
      { name: "description", content: "Your beautiful QR pass for your hackathon." },
      { property: "og:title", content: "My QR Pass · HackOS AI" },
      { property: "og:description", content: "Show this QR at the entrance and food counters." },
    ],
  }),
  component: MyQr,
});

function MyQr() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState(false);
  const [full, setFull] = useState(false);

  const participantId = new URLSearchParams(window.location.search).get("participantId");

  useEffect(() => {
    if (!participantId) {
      setError(true);
      return;
    }
    
    fetch(`http://localhost:5000/api/participant/${participantId}`)
      .then(res => res.json())
      .then(res => {
        if (res.success) {
           fetch(`http://localhost:5000/api/hackathon/${res.data.hackathon_id}`)
             .then(hRes => hRes.json())
             .then(hRes => {
               if (hRes.success) {
                 setData({ participant: res.data, hackathon: hRes.data });
               } else {
                 setError(true);
               }
             });
        } else {
           setError(true);
        }
      })
      .catch(() => setError(true));
  }, [participantId]);

  if (error) return <div className="py-20 text-center">Failed to load QR pass.</div>;
  if (!data) return <div className="py-20 text-center text-muted-foreground">Loading QR pass...</div>;

  const p = data.participant;
  const h = data.hackathon;
  const qrUrl = `http://localhost:5000/${p.qr_code}`;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Your pass"
        title="Show this at the door"
        subtitle="Your entry, meals and workshops — all in one QR."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong relative mx-auto w-full max-w-md overflow-hidden rounded-3xl p-6"
        >
          <div className="absolute inset-x-0 top-0 h-40 opacity-70" style={{ background: "linear-gradient(to bottom right, #1a1a2e, #0f0f1f)" }} />
          <div className="absolute inset-0 hackos-grid opacity-20" />
          <div className="relative">
            <div className="text-[11px] uppercase tracking-wider text-white/80">{h.title}</div>
            <div className="mt-1 text-lg font-semibold text-white">{p.full_name}</div>
            <div className="text-xs text-white/80">{p.college} · {p.registration_id}</div>
          </div>
          <div className="relative mt-20 grid place-items-center rounded-2xl bg-white p-5">
            <img src={qrUrl} alt="QR Pass" className="h-full w-full object-contain mix-blend-multiply" />
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <div>Issued {new Date(p.created_at).toLocaleDateString()}</div>
            <div>HackOS AI</div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Button onClick={() => toast.success("Downloading pass…")} variant="outline" className="border-white/10 bg-white/5">
              <Download className="mr-1.5 h-4 w-4" /> Save
            </Button>
            <Button onClick={() => setFull(true)} variant="outline" className="border-white/10 bg-white/5">
              <Maximize2 className="mr-1.5 h-4 w-4" /> Full
            </Button>
            <Button onClick={() => toast.success("Link copied")} className="bg-gradient-brand text-white hover:opacity-90">
              <Share2 className="mr-1.5 h-4 w-4" /> Share
            </Button>
          </div>
        </motion.div>

        <GlassCard className="p-6">
          <div className="text-sm font-medium">What this pass unlocks</div>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            {[
              "Entry & check-in scanning",
              "Meal claims (breakfast/lunch/dinner)",
              "Workshop attendance",
              "Prize distribution verification",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand" />
                {t}
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>

      <Dialog open={full} onOpenChange={setFull}>
        <DialogContent className="max-w-md rounded-3xl border-white/10 bg-background p-8">
          <div className="grid place-items-center rounded-2xl bg-white p-6">
            <img src={qrUrl} alt="QR Pass" className="h-full w-full object-contain mix-blend-multiply" />
          </div>
          <div className="text-center text-sm text-muted-foreground">Tap anywhere to close</div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
