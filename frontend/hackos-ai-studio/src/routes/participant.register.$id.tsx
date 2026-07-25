import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { Check, ChevronRight, Sparkles, Github, Linkedin, Link as LinkIcon } from "lucide-react";
import { PageHeader, GlassCard } from "@/components/hackos/section";
import { AiDropzone } from "@/components/hackos/dropzone";
import { AiProcessing } from "@/components/hackos/ai-processing";
import { hackathons } from "@/data/mock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/participant/register/$id")({
  head: () => ({
    meta: [
      { title: "AI Registration · HackOS AI" },
      { name: "description", content: "AI-powered registration for hackathons on HackOS AI." },
      { property: "og:title", content: "AI Registration · HackOS AI" },
      { property: "og:description", content: "Drop your resume, AI does the rest." },
    ],
  }),
  component: Register,
});

const steps = ["Upload resume", "AI extraction", "Review & submit"];

function Register() {
  const { id } = useParams({ from: "/participant/register/$id" });
  const h = hackathons.find((x) => x.id === id) ?? hackathons[0];
  const [step, setStep] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [data, setData] = useState({
    name: "",
    email: "",
    phone: "",
    college: "",
    department: "",
    year: "",
    skills: [] as string[],
    github: "",
    linkedin: "",
    portfolio: ""
  });
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const onUpload = async (file: File) => {
    setProcessing(true);
    setStep(1);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("hackathon_id", id);

    try {
      const res = await fetch("http://192.168.1.67:5000/api/upload-resume", {
        method: "POST",
        body: formData,
      });
      const resData = await res.json();

      if (resData.success) {
        setData({
          name: resData.data.full_name || "",
          email: resData.data.email || "",
          phone: resData.data.phone || "",
          college: resData.data.college || "",
          department: resData.data.department || "",
          year: resData.data.year || "",
          skills: resData.data.skills || [],
          github: resData.data.github || "",
          linkedin: resData.data.linkedin || "",
          portfolio: resData.data.portfolio || ""
        });
        setStep(2);
        toast.success("Resume analyzed", { description: "Your form has been auto-filled." });
      } else {
        toast.error("Extraction failed", { description: resData.message });
        setStep(0);
      }
    } catch (err) {
      toast.error("Error", { description: "Failed to connect to the server." });
      setStep(0);
    } finally {
      setProcessing(false);
    }
  };

  const submit = async () => {
    try {
      const res = await fetch("http://192.168.1.67:5000/api/register-participant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hackathon_id: id,
          full_name: data.name,
          email: data.email,
          phone: data.phone,
          college: data.college,
          department: data.department,
          year: data.year,
          skills: data.skills,
          github: data.github,
          linkedin: data.linkedin,
          portfolio: data.portfolio,
        }),
      });
      const resData = await res.json();

      if (resData.success) {
        setDone(true);
        setTimeout(() => navigate({
          to: "/participant/qr",
          search: { participantId: resData.data.participant_id } as any
        }), 1800);
      } else {
        toast.error("Registration failed", { description: resData.message });
      }
    } catch (err) {
      toast.error("Error", { description: "Failed to connect to the server." });
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={h.name}
        title="Register with AI"
        subtitle="Drop your resume and let HackOS fill in the rest."
      />

      {/* Stepper */}
      <div className="glass flex items-center gap-1 rounded-2xl p-2 text-sm">
        {steps.map((s, i) => {
          const active = i === step;
          const complete = i < step;
          return (
            <div
              key={s}
              className={`flex flex-1 items-center gap-2 rounded-xl px-3 py-2 ${active ? "bg-gradient-brand-soft ring-1 ring-white/10" : ""
                }`}
            >
              <div
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${complete ? "bg-emerald-500/20 text-emerald-300" : active ? "bg-gradient-brand text-white" : "bg-white/5 text-muted-foreground"
                  }`}
              >
                {complete ? <Check className="h-3 w-3" /> : i + 1}
              </div>
              <span className={active ? "text-foreground" : "text-muted-foreground"}>{s}</span>
              {i < steps.length - 1 && <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground/60" />}
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="s0" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <AiDropzone
              accept={{ "application/pdf": [".pdf"], "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"] }}
              hint="PDF or DOCX up to 10 MB — HackOS will extract everything."
              onFile={onUpload}
            />
          </motion.div>
        )}

        {step === 1 && processing && (
          <motion.div key="s1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AiProcessing label="Analyzing your resume" />
          </motion.div>
        )}

        {step === 2 && !done && (
          <motion.div key="s2" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard className="p-6">
              <div className="flex items-center gap-2 text-xs text-brand">
                <Sparkles className="h-3.5 w-3.5" /> AI extracted 11 fields
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="Full name" value={data.name} onChange={(v) => setData({ ...data, name: v })} />
                <Field label="Email" value={data.email} onChange={(v) => setData({ ...data, email: v })} />
                <Field label="Phone" value={data.phone} onChange={(v) => setData({ ...data, phone: v })} />
                <Field label="College" value={data.college} onChange={(v) => setData({ ...data, college: v })} />
                <Field label="Department" value={data.department} onChange={(v) => setData({ ...data, department: v })} />
                <Field label="Year" value={data.year} onChange={(v) => setData({ ...data, year: v })} />
                <Field label="GitHub" icon={Github} value={data.github} onChange={(v) => setData({ ...data, github: v })} />
                <Field label="LinkedIn" icon={Linkedin} value={data.linkedin} onChange={(v) => setData({ ...data, linkedin: v })} />
                <Field label="Portfolio" icon={LinkIcon} value={data.portfolio} onChange={(v) => setData({ ...data, portfolio: v })} />
              </div>
              <div className="mt-4">
                <Label className="mb-1.5 block">Skills</Label>
                <Textarea
                  className="min-h-[80px]"
                  value={data.skills.join(", ")}
                  onChange={(e) => setData({ ...data, skills: e.target.value.split(",").map((x) => x.trim()) })}
                />
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setStep(0)} className="border-white/10 bg-white/5">
                  Re-upload
                </Button>
                <Button onClick={submit} className="bg-gradient-brand text-white hover:opacity-90">
                  Submit registration
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {done && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-strong relative overflow-hidden rounded-3xl p-16 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 12 }}
              className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-500/20"
            >
              <Check className="h-10 w-10 text-emerald-300" />
            </motion.div>
            <h2 className="mt-6 text-2xl font-semibold">You're in!</h2>
            <p className="mt-2 text-muted-foreground">Redirecting to your QR pass…</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />}
        <Input value={value} onChange={(e) => onChange(e.target.value)} className={Icon ? "pl-10" : ""} />
      </div>
    </div>
  );
}
