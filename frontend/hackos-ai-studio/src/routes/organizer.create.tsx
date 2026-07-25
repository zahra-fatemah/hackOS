import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, PenLine, Check } from "lucide-react";
import { PageHeader, GlassCard } from "@/components/hackos/section";
import { AiDropzone } from "@/components/hackos/dropzone";
import { AiProcessing } from "@/components/hackos/ai-processing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/store/auth";

export const Route = createFileRoute("/organizer/create")({
  head: () => ({
    meta: [
      { title: "Create Hackathon · HackOS AI" },
      { name: "description", content: "Create a new hackathon manually or with AI." },
      { property: "og:title", content: "Create Hackathon · HackOS AI" },
      { property: "og:description", content: "Drop a poster or brief — AI drafts the entire event." },
    ],
  }),
  component: Create,
});

const initial = {
  name: "",
  description: "",
  venue: "",
  date: "",
  deadline: "",
  prize: "",
  eligibility: "",
  tracks: "",
  sponsors: "",
  contact: "",
};

const aiFilled = {
  name: "Nebula AI Hack",
  description: "48-hour flagship hackathon focused on shipping production-grade AI agents across four elite tracks.",
  venue: "Moscone West · San Francisco",
  date: "Aug 22–24, 2026",
  deadline: "Aug 15, 2026",
  prize: "$120,000 total pool · $40K grand prize",
  eligibility: "Undergrad + grad students · Teams of 1–4",
  tracks: "AI Agents, Developer Tools, Robotics, Consumer AI",
  sponsors: "OpenAI, Vercel, Linear, Supabase",
  contact: "team@hackos.ai",
};

function Create() {
  const email = useAuth((s) => s.email);
  const [mode, setMode] = useState<"choice" | "manual" | "ai" | "review">("choice");
  const [processing, setProcessing] = useState(false);
  const [data, setData] = useState(initial);

  const startAi = async (file: File) => {
    setProcessing(true);
    setMode("ai");

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("http://192.168.1.67:5000/api/upload-hackathon-file", {
        method: "POST",
        body: form,
      });
      const json = await res.json();

      if (json.success) {
        const mappedData = {
          name: json.data.title || "",
          description: json.data.description || "",
          venue: json.data.venue || "",
          date: json.data.start_date ? `${json.data.start_date} - ${json.data.end_date}` : "",
          deadline: json.data.registration_deadline || "",
          prize: json.data.prize_pool || "",
          eligibility: json.data.eligibility || "",
          tracks: json.data.tracks ? json.data.tracks.join(", ") : "",
          sponsors: json.data.sponsors ? json.data.sponsors.join(", ") : "",
          contact: json.data.contact_email || "",
        };
        setData(mappedData);
        setMode("review");
        toast.success("Draft ready", { description: "AI extracted fields from your document." });
      } else {
        toast.error("Extraction failed", { description: json.message });
        setMode("choice");
      }
    } catch {
      toast.error("Could not reach backend.");
      setMode("choice");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="New event"
        title="Create a hackathon"
        subtitle="Start from scratch or drop a poster / brief — AI drafts the rest."
      />

      <AnimatePresence mode="wait">
        {mode === "choice" && (
          <motion.div
            key="choice"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid gap-4 md:grid-cols-2"
          >
            <button
              onClick={() => setMode("manual")}
              className="glass group relative overflow-hidden rounded-2xl p-8 text-left transition hover:-translate-y-1"
            >
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/5">
                <PenLine className="h-5 w-5" />
              </div>
              <div className="mt-4 text-xl font-semibold">Manual creation</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Type out fields yourself. Full control, no AI.
              </p>
            </button>
            <button
              onClick={() => setMode("ai")}
              className="glass group relative overflow-hidden rounded-2xl p-8 text-left transition hover:-translate-y-1"
            >
              <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-gradient-brand opacity-25 blur-2xl" />
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-brand">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="mt-4 flex items-center gap-2 text-xl font-semibold">
                AI creation <span className="rounded-full bg-brand/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-brand">AI</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Upload a poster, PDF, or image. HackOS drafts the entire event.
              </p>
            </button>
          </motion.div>
        )}

        {mode === "ai" && !processing && !Object.values(data).some(Boolean) && (
          <motion.div key="upload" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <AiDropzone
              accept={{ "application/pdf": [".pdf"], "image/*": [".png", ".jpg", ".jpeg"], "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"] }}
              hint="Poster, PDF, DOCX or image — AI extracts every field."
              onFile={startAi}
            />
          </motion.div>
        )}

        {mode === "ai" && processing && (
          <motion.div key="proc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AiProcessing label="Composing your hackathon draft" />
          </motion.div>
        )}

        {(mode === "review" || mode === "manual") && (
          <motion.div key="form" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            {mode === "review" && (
              <div className="mb-3 flex items-center gap-2 text-xs text-brand">
                <Sparkles className="h-3.5 w-3.5" /> AI drafted 10 fields — edit anything below.
              </div>
            )}
            <GlassCard className="p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Hackathon name" value={data.name} onChange={(v) => setData({ ...data, name: v })} />
                <Field label="Venue" value={data.venue} onChange={(v) => setData({ ...data, venue: v })} />
                <Field label="Event date" value={data.date} onChange={(v) => setData({ ...data, date: v })} />
                <Field label="Registration deadline" value={data.deadline} onChange={(v) => setData({ ...data, deadline: v })} />
                <Field label="Prize pool" value={data.prize} onChange={(v) => setData({ ...data, prize: v })} />
                <Field label="Eligibility" value={data.eligibility} onChange={(v) => setData({ ...data, eligibility: v })} />
                <Field label="Tracks (comma-separated)" value={data.tracks} onChange={(v) => setData({ ...data, tracks: v })} />
                <Field label="Sponsors" value={data.sponsors} onChange={(v) => setData({ ...data, sponsors: v })} />
                <Field label="Contact email" value={data.contact} onChange={(v) => setData({ ...data, contact: v })} />
              </div>
              <div className="mt-4 space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  value={data.description}
                  onChange={(e) => setData({ ...data, description: e.target.value })}
                  className="min-h-[120px]"
                />
              </div>
              <div className="mt-6 flex justify-between">
                <Button variant="outline" onClick={() => { setMode("choice"); setData(initial); }} className="border-white/10 bg-white/5">
                  Start over
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" className="border-white/10 bg-white/5">Save draft</Button>
                  <Button
                    onClick={async () => {
                      try {
                        const payload = {
                          title: data.name,
                          description: data.description,
                          venue: data.venue,
                          start_date: data.date.split("-")[0]?.trim() || data.date,
                          end_date: data.date.split("-")[1]?.trim() || "",
                          registration_deadline: data.deadline,
                          prize_pool: data.prize,
                          eligibility: data.eligibility,
                          tracks: data.tracks.split(",").map((t) => t.trim()).filter(Boolean),
                          sponsors: data.sponsors.split(",").map((s) => s.trim()).filter(Boolean),
                          contact_email: data.contact,
                          organizer_email: email,
                        };
                        const res = await fetch("http://192.168.1.67:5000/api/create-hackathon", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(payload),
                        });
                        const json = await res.json();
                        if (json.success) {
                          toast.success("Hackathon published!", { description: "Your event is now live." });
                          // Reset the form and go back to choices
                          setData(initial);
                          setMode("choice");
                        } else {
                          toast.error(json.message, { description: json.errors?.join(", ") });
                        }
                      } catch {
                        toast.error("Could not reach backend.");
                      }
                    }}
                    className="bg-gradient-brand text-white hover:opacity-90"
                  >
                    <Check className="mr-2 h-4 w-4" /> Publish hackathon
                  </Button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
