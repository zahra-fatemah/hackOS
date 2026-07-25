import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Coffee, Utensils, Moon, ScanLine, Check, X, ShieldAlert, KeyRound } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { PageHeader, GlassCard } from "@/components/hackos/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuth } from "@/store/auth";

export const Route = createFileRoute("/organizer/food")({
  head: () => ({
    meta: [
      { title: "Food Management · HackOS AI" },
      { name: "description", content: "Track meal claims with QR scanning and live analytics." },
      { property: "og:title", content: "Food Management · HackOS AI" },
      { property: "og:description", content: "QR-protected meal management." },
    ],
  }),
  component: Food,
});

type ScanState =
  | { kind: "closed" }
  | { kind: "gate" }
  | { kind: "meal_selector" }
  | { kind: "scanner"; meal: string }
  | { kind: "success"; name: string; meal: string }
  | { kind: "duplicate"; name: string; meal: string }
  | { kind: "invalid" };

function Food() {
  const email = useAuth((s) => s.email);
  const scanCode = useAuth((s) => s.scanCode);
  const [state, setState] = useState<ScanState>({ kind: "closed" });
  const [code, setCode] = useState("");
  const [err, setErr] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [stats, setStats] = useState({
    breakfast: { claimed: 0, total: 0 },
    lunch: { claimed: 0, total: 0 },
    dinner: { claimed: 0, total: 0 },
    recent: [] as any[],
  });

  const fetchStats = () => {
    if (!email) return;
    fetch(`http://localhost:5000/api/organizer/food-stats?organizer_email=${email}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) setStats(json.data);
      })
      .catch(console.error);
      
    fetch(`http://localhost:5000/api/organizer/participants?organizer_email=${email}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) setParticipants(json.data);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchStats();
  }, [email]);

  const openGate = () => { setState({ kind: "gate" }); setCode(""); setErr(false); };

  const verify = () => {
    if (code.trim().toUpperCase() === scanCode.toUpperCase()) {
      setState({ kind: "meal_selector" });
    } else {
      setErr(true);
      toast.error("Access denied", { description: "The scan code is incorrect." });
    }
  };

  const handleScan = async (text: string, meal: string) => {
    if (state.kind !== "scanner") return;
    try {
      const qr_payload = JSON.parse(text);
      const res = await fetch("http://localhost:5000/api/organizer/scan-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr_payload, meal })
      });
      const json = await res.json();
      
      if (res.status === 400 && json.status === "invalid_qr") {
        setState({ kind: "invalid" });
      } else if (json.success) {
        setState({ kind: "success", name: json.data.name, meal: json.data.meal });
      } else if (res.status === 409) {
        setState({ kind: "duplicate", name: json.errors[0].name, meal: json.errors[0].meal });
      } else {
        toast.error(json.message || "An error occurred");
        setState({ kind: "closed" });
      }
      fetchStats();
    } catch (e) {
      console.error(e);
      setState({ kind: "invalid" });
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Live counters"
        title="Food management"
        subtitle="QR-protected meal claims with duplicate detection."
        actions={
          <Button onClick={openGate} className="bg-gradient-brand text-white hover:opacity-90">
            <ScanLine className="mr-2 h-4 w-4" /> Open scanner
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MealCard icon={Coffee} label="Breakfast" claimed={stats.breakfast.claimed} total={stats.breakfast.total} tone="brand-2" />
        <MealCard icon={Utensils} label="Lunch" claimed={stats.lunch.claimed} total={stats.lunch.total} tone="brand" />
        <MealCard icon={Moon} label="Dinner" claimed={stats.dinner.claimed} total={stats.dinner.total} tone="brand-3" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2 p-6">
          <div className="text-sm font-medium">Claims throughout the day</div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={foodStats.timeline}>
                <defs>
                  <linearGradient id="fg" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.75 0.22 340)" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="oklch(0.75 0.22 340)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="oklch(1 0 0 / 0.05)" vertical={false} />
                <XAxis dataKey="time" stroke="oklch(0.7 0 0)" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis stroke="oklch(0.7 0 0)" tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip contentStyle={{ background: "oklch(0.20 0.018 265)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12 }} />
                {/* Timeline data is mock, as tracking over day requires chronological generation which we don't do for this quick test */}
                <Area type="monotone" dataKey="claimed" stroke="oklch(0.75 0.22 340)" strokeWidth={2} fill="url(#fg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="text-sm font-medium">Recent scans</div>
          <div className="mt-3 space-y-2">
            {stats.recent.map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass flex items-center gap-3 rounded-xl p-3"
              >
                <div className={`grid h-8 w-8 place-items-center rounded-full ${r.status === "ok" ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}>
                  {r.status === "ok" ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.meal} · {r.time}</div>
                </div>
                {r.status === "duplicate" && <span className="text-[10px] text-red-300">DUPLICATE</span>}
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </div>

      <Dialog open={state.kind !== "closed"} onOpenChange={(o) => !o && setState({ kind: "closed" })}>
        <DialogContent className="max-w-lg rounded-3xl border-white/10 bg-background/95 p-0 backdrop-blur-xl">
          <AnimatePresence mode="wait">
            {state.kind === "gate" && (
              <motion.div key="gate" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="p-8">
                <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-brand">
                  <KeyRound className="h-6 w-6 text-white" />
                </div>
                <div className="text-center text-lg font-semibold">Organizer scan code</div>
                <p className="mt-1 text-center text-sm text-muted-foreground">
                  Enter your event's scan code to unlock the QR scanner.
                </p>
                <div className="mt-6 space-y-2">
                  <Input
                    value={code}
                    onChange={(e) => { setCode(e.target.value); setErr(false); }}
                    placeholder="e.g. HACKOS-2026"
                    className={`h-12 text-center font-mono tracking-widest ${err ? "border-red-500/60" : ""}`}
                  />
                  {err && (
                    <div className="flex items-center justify-center gap-2 text-xs text-red-300">
                      <ShieldAlert className="h-3.5 w-3.5" /> Access denied — wrong code.
                    </div>
                  )}
                  <div className="text-center text-[11px] text-muted-foreground">
                    Hint (dev): <span className="font-mono">{scanCode}</span>
                  </div>
                </div>
                <Button onClick={verify} className="mt-6 h-11 w-full rounded-xl bg-gradient-brand text-white hover:opacity-90">
                  Verify & open scanner
                </Button>
              </motion.div>
            )}

            {state.kind === "meal_selector" && (
              <motion.div key="meal_selector" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="p-8">
                <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-brand">
                  <Utensils className="h-6 w-6 text-white" />
                </div>
                <div className="text-center text-lg font-semibold">Select Meal Type</div>
                <p className="mt-1 text-center text-sm text-muted-foreground">
                  Which meal are you scanning for?
                </p>
                <div className="mt-6 flex flex-col gap-3">
                  {["Breakfast", "Lunch", "Dinner"].map(m => (
                    <Button key={m} onClick={() => setState({ kind: "scanner", meal: m })} variant="outline" className="h-14 justify-start px-6 text-lg border-white/10 bg-white/5 hover:bg-white/10 hover:text-white">
                      {m}
                    </Button>
                  ))}
                </div>
              </motion.div>
            )}

            {state.kind === "scanner" && (
              <ScannerView meal={state.meal} onScan={(text) => handleScan(text, state.meal)} />
            )}

            {state.kind === "success" && (
              <ResultView
                ok
                name={state.name}
                meal={state.meal}
                onDone={() => setState({ kind: "closed" })}
              />
            )}
            {state.kind === "duplicate" && (
              <ResultView
                ok={false}
                name={state.name}
                meal={state.meal}
                onDone={() => setState({ kind: "closed" })}
              />
            )}
            {state.kind === "invalid" && (
              <ResultView
                ok={false}
                invalid
                name="Unknown"
                meal=""
                onDone={() => setState({ kind: "closed" })}
              />
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MealCard({
  icon: Icon,
  label,
  claimed,
  total,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  claimed: number;
  total: number;
  tone: "brand" | "brand-2" | "brand-3";
}) {
  const pct = total === 0 ? 0 : Math.round((claimed / total) * 100);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass relative overflow-hidden rounded-2xl p-6"
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-2xl opacity-60"
        style={{ background: `var(--color-${tone})` }}
      />
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/5">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="text-xl font-semibold">{claimed.toLocaleString()} <span className="text-sm text-muted-foreground">/ {total.toLocaleString()}</span></div>
        </div>
        <div className="ml-auto text-2xl font-semibold text-gradient">{pct}%</div>
      </div>
      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
        <motion.div initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} transition={{ duration: 1 }} className="h-full bg-gradient-brand" />
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
        <span>{claimed.toLocaleString()} claimed</span>
        <span>{(total - claimed).toLocaleString()} remaining</span>
      </div>
    </motion.div>
  );
}

import { Scanner } from '@yudiel/react-qr-scanner';

function ScannerView({ meal, onScan }: { meal: string, onScan: (text: string) => void }) {
  return (
    <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8">
      <div className="text-center text-sm text-muted-foreground">Scanning for {meal}</div>
      <div className="relative mx-auto mt-4 aspect-square w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-black">
        <Scanner
          onScan={(result) => {
            if (result && result.length > 0) {
              onScan(result[0].rawValue);
            }
          }}
          components={{
            audio: false,
            onOff: false,
            torch: false,
            zoom: false,
            finder: false
          }}
          styles={{ container: { width: "100%", height: "100%" } }}
        />
        <div className="absolute inset-8 rounded-xl border-2 border-white/40 pointer-events-none" />
        {/* corners */}
        {["top-6 left-6", "top-6 right-6", "bottom-6 left-6", "bottom-6 right-6"].map((p, i) => (
          <div key={i} className={`absolute ${p} h-6 w-6 border-brand pointer-events-none`} style={{
            borderTopWidth: i < 2 ? 3 : 0,
            borderBottomWidth: i >= 2 ? 3 : 0,
            borderLeftWidth: i % 2 === 0 ? 3 : 0,
            borderRightWidth: i % 2 === 1 ? 3 : 0,
          }} />
        ))}
        <motion.div
          className="absolute left-8 right-8 h-1 rounded-full bg-gradient-brand pointer-events-none"
          style={{ boxShadow: "0 0 24px oklch(0.72 0.19 295 / 0.8)" }}
          animate={{ top: ["12%", "88%", "12%"] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <div className="mt-4 text-center text-xs text-muted-foreground animate-pulse">Scanning…</div>
    </motion.div>
  );
}

function ResultView({ ok, invalid, name, meal, onDone }: { ok: boolean; invalid?: boolean; name: string; meal: string; onDone: () => void }) {
  useEffect(() => {
    if (invalid) toast.error("Invalid or unrecognized QR code");
    else if (ok) toast.success(`${meal} claimed for ${name}`);
    else toast.error(`Duplicate scan — ${meal} already claimed`);
  }, [ok, invalid, name, meal]);
  return (
    <motion.div
      key="res"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className={`p-10 text-center`}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 12 }}
        className={`mx-auto grid h-24 w-24 place-items-center rounded-full ${ok && !invalid ? "bg-emerald-500/20" : "bg-red-500/20"}`}
      >
        {ok && !invalid ? <Check className="h-12 w-12 text-emerald-300" /> : <X className="h-12 w-12 text-red-300" />}
      </motion.div>
      <div className="mt-6 text-2xl font-semibold">
        {invalid ? "Invalid QR Code" : ok ? "Meal successfully claimed" : "Meal already claimed"}
      </div>
      <div className="mt-1 text-sm text-muted-foreground">
        {invalid ? "This QR code is not valid for this event." : `${name} · ${meal}`}
      </div>
      <Button
        onClick={onDone}
        className={`mt-6 h-11 rounded-xl px-8 ${ok && !invalid ? "bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30" : "bg-red-500/20 text-red-100 hover:bg-red-500/30"}`}
      >
        Done
      </Button>
    </motion.div>
  );
}
