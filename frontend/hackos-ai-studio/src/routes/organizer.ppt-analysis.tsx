import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, Check, X, Award, Cpu, Layers } from "lucide-react";
import { PageHeader, GlassCard } from "@/components/hackos/section";
import { AiDropzone } from "@/components/hackos/dropzone";
import { AiProcessing } from "@/components/hackos/ai-processing";
import { pptResult } from "@/data/mock";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/organizer/ppt-analysis")({
  head: () => ({
    meta: [
      { title: "AI PPT Analysis · HackOS AI" },
      { name: "description", content: "AI analysis of submitted decks with judge recommendation." },
      { property: "og:title", content: "AI PPT Analysis · HackOS AI" },
      { property: "og:description", content: "Detect domain, tech stack and match the best judge." },
    ],
  }),
  component: Ppt,
});

function Ppt() {
  const [state, setState] = useState<"idle" | "processing" | "done">("idle");

  const start = () => {
    setState("processing");
    setTimeout(() => {
      setState("done");
      toast.success("Analysis complete");
    }, 2600);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Judging copilot"
        title="AI PPT analysis"
        subtitle="Upload any submission deck — HackOS scores it and recommends a judge."
      />

      <AnimatePresence mode="wait">
        {state === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AiDropzone
              accept={{ "application/pdf": [".pdf"], "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"] }}
              hint="PPTX or PDF · analysis takes ~10 seconds"
              onFile={start}
            />
          </motion.div>
        )}

        {state === "processing" && (
          <motion.div key="proc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AiProcessing label="Grading the submission" />
          </motion.div>
        )}

        {state === "done" && (
          <motion.div key="done" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <GlassCard className="lg:col-span-2 relative overflow-hidden p-6">
                <div className="absolute inset-0 -z-10 opacity-40" style={{ background: "var(--gradient-brand-soft)" }} />
                <div className="flex items-center gap-2 text-xs text-brand">
                  <Sparkles className="h-3.5 w-3.5" /> HackOS AI Analysis
                </div>
                <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Detected domain</div>
                    <div className="text-3xl font-semibold tracking-tight">{pptResult.domain}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Confidence</div>
                    <div className="text-3xl font-semibold text-emerald-300">{pptResult.confidence}%</div>
                    <div className="mt-1 h-1.5 w-40 overflow-hidden rounded-full bg-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pptResult.confidence}%` }}
                        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full bg-gradient-brand"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <Insight icon={Layers} title="Problem statement" body={pptResult.problem} />
                  <Insight icon={Cpu} title="Tech stack" body={pptResult.techStack.join(" · ")} />
                  <Insight icon={Sparkles} title="Innovation" body={pptResult.innovation} />
                  <Insight icon={Award} title="Business idea" body={pptResult.business} />
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">AI Summary</div>
                  <p className="mt-1 text-sm">{pptResult.summary}</p>
                </div>
              </GlassCard>

              <div className="space-y-6">
                <GlassCard className="relative overflow-hidden p-6">
                  <div className="text-[11px] uppercase tracking-wider text-brand">Recommended judge</div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-brand text-lg font-semibold text-white ring-brand">
                      {pptResult.judge.name.split(" ").map((s) => s[0]).join("")}
                    </div>
                    <div>
                      <div className="text-base font-semibold">{pptResult.judge.name}</div>
                      <div className="text-xs text-muted-foreground">{pptResult.judge.expertise}</div>
                    </div>
                  </div>
                  <div className="mt-5">
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Match score</span>
                      <span className="font-semibold text-emerald-300">{pptResult.judge.match}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pptResult.judge.match}%` }}
                        transition={{ duration: 1.2 }}
                        className="h-full bg-gradient-brand"
                      />
                    </div>
                  </div>
                  <Button className="mt-5 w-full bg-gradient-brand text-white hover:opacity-90">
                    Assign judge
                  </Button>
                </GlassCard>

                <GlassCard className="p-6">
                  <div className="text-sm font-medium">Section coverage</div>
                  <div className="mt-3 space-y-2">
                    {pptResult.present.map((s) => (
                      <div key={s} className="flex items-center gap-2 text-sm text-emerald-300">
                        <Check className="h-4 w-4" /> {s}
                      </div>
                    ))}
                    {pptResult.missing.map((s) => (
                      <div key={s} className="flex items-center gap-2 text-sm text-red-300">
                        <X className="h-4 w-4" /> {s} <Badge className="ml-auto bg-red-500/15 text-red-300">Missing</Badge>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setState("idle")} className="border-white/10 bg-white/5">
                Analyze another
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Insight({ icon: Icon, title, body }: { icon: React.ComponentType<{ className?: string }>; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {title}
      </div>
      <div className="mt-2 text-sm">{body}</div>
    </div>
  );
}
