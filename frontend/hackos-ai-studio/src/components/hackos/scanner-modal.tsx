import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ShieldAlert, KeyRound, ScanLine } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/store/auth";
import { toast } from "sonner";
import { Scanner } from '@yudiel/react-qr-scanner';

export type ScanState =
  | { kind: "closed" }
  | { kind: "gate" }
  | { kind: "selector" }
  | { kind: "scanner"; subType: string | null }
  | { kind: "success"; name: string; subType: string | null }
  | { kind: "duplicate"; name: string; subType: string | null; at: string | null }
  | { kind: "invalid" };

interface ScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scanType: "entry" | "food" | "workshop" | "prize";
  options?: string[];
  optionsLabel?: string;
  icon?: React.ComponentType<{ className?: string }>;
  onSuccess?: () => void;
}

export function ScannerModal({ open, onOpenChange, scanType, options, optionsLabel, icon: Icon, onSuccess }: ScannerModalProps) {
  const email = useAuth((s) => s.email);
  const scanCode = useAuth((s) => s.scanCode);
  const [state, setState] = useState<ScanState>({ kind: "closed" });
  const [code, setCode] = useState("");
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (open && state.kind === "closed") {
      setState({ kind: "gate" });
      setCode("");
      setErr(false);
    } else if (!open) {
      setState({ kind: "closed" });
    }
  }, [open]);

  const verify = () => {
    if (code.trim().toUpperCase() === scanCode?.toUpperCase()) {
      if (options && options.length > 0) {
        setState({ kind: "selector" });
      } else {
        setState({ kind: "scanner", subType: null });
      }
    } else {
      setErr(true);
      toast.error("Access denied", { description: "The scan code is incorrect." });
    }
  };

  const handleScan = async (text: string, subType: string | null) => {
    if (state.kind !== "scanner") return;
    try {
      const qr_payload = JSON.parse(text);
      const res = await fetch("http://192.168.1.67:5000/api/organizer/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr_payload, scan_type: scanType, sub_type: subType, organizer_email: email })
      });
      const json = await res.json();

      if (res.status === 400 && json.status === "invalid_qr") {
        setState({ kind: "invalid" });
      } else if (json.success) {
        setState({ kind: "success", name: json.data.name, subType });
        if (onSuccess) onSuccess();
      } else if (res.status === 409) {
        setState({ kind: "duplicate", name: json.errors[0].name, subType, at: json.errors[0].at });
      } else {
        toast.error(json.message || "An error occurred");
        setState({ kind: "closed" });
        onOpenChange(false);
      }
    } catch (e) {
      console.error(e);
      setState({ kind: "invalid" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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

          {state.kind === "selector" && (
            <motion.div key="selector" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="p-8">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-brand">
                {Icon ? <Icon className="h-6 w-6 text-white" /> : <ScanLine className="h-6 w-6 text-white" />}
              </div>
              <div className="text-center text-lg font-semibold">{optionsLabel || "Select Option"}</div>
              <p className="mt-1 text-center text-sm text-muted-foreground">
                What are you scanning for?
              </p>
              <div className="mt-6 flex flex-col gap-3 max-h-[40vh] overflow-y-auto pr-2">
                {options?.map(opt => (
                  <Button key={opt} onClick={() => setState({ kind: "scanner", subType: opt })} variant="outline" className="h-14 justify-start px-6 text-lg border-white/10 bg-white/5 hover:bg-white/10 hover:text-white">
                    {opt}
                  </Button>
                ))}
              </div>
            </motion.div>
          )}

          {state.kind === "scanner" && (
            <ScannerView subType={state.subType} onScan={(text) => handleScan(text, state.subType)} />
          )}

          {state.kind === "success" && (
            <ResultView
              ok
              name={state.name}
              subType={state.subType}
              scanType={scanType}
              onDone={() => { setState({ kind: "closed" }); onOpenChange(false); }}
            />
          )}
          {state.kind === "duplicate" && (
            <ResultView
              ok={false}
              name={state.name}
              subType={state.subType}
              scanType={scanType}
              at={state.at}
              onDone={() => { setState({ kind: "closed" }); onOpenChange(false); }}
            />
          )}
          {state.kind === "invalid" && (
            <ResultView
              ok={false}
              invalid
              name="Unknown"
              subType={null}
              scanType={scanType}
              onDone={() => { setState({ kind: "closed" }); onOpenChange(false); }}
            />
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

function ScannerView({ subType, onScan }: { subType: string | null, onScan: (text: string) => void }) {
  return (
    <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8">
      <div className="text-center text-sm text-muted-foreground">Scanning {subType ? `for ${subType}` : ""}</div>
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

function ResultView({ ok, invalid, name, subType, scanType, at, onDone }: { ok: boolean; invalid?: boolean; name: string; subType: string | null; scanType: string; at?: string | null; onDone: () => void }) {

  const getActionName = () => {
    if (scanType === "entry") return "Entry";
    if (scanType === "food") return subType || "Meal";
    if (scanType === "workshop") return `Workshop: ${subType}`;
    if (scanType === "prize") return `Prize: ${subType}`;
    return "Action";
  };

  const action = getActionName();

  useEffect(() => {
    if (invalid) toast.error("Invalid or unrecognized QR code");
    else if (ok) toast.success(`${action} confirmed for ${name}`);
    else toast.error(`Duplicate scan — ${action} already recorded`);
  }, [ok, invalid, name, action]);

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
        {invalid ? "Invalid QR Code" : ok ? `${action} confirmed` : `${action} already recorded`}
      </div>
      <div className="mt-1 text-sm text-muted-foreground">
        {invalid ? "This QR code is not valid for this event." : `${name} · ${action}`}
      </div>
      {!ok && !invalid && at && (
        <div className="mt-1 text-xs text-red-300/80">
          Already scanned at {new Date(at).toLocaleTimeString()}
        </div>
      )}
      <Button
        onClick={onDone}
        className={`mt-6 h-11 rounded-xl px-8 ${ok && !invalid ? "bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30" : "bg-red-500/20 text-red-100 hover:bg-red-500/30"}`}
      >
        Done
      </Button>
    </motion.div>
  );
}
