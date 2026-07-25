import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, GlassCard } from "@/components/hackos/section";
import { participantProfile } from "@/data/mock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Github, Linkedin, Link as LinkIcon, FileText, Activity } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/store/auth";

export const Route = createFileRoute("/participant/profile")({
  head: () => ({
    meta: [
      { title: "Profile · HackOS AI" },
      { name: "description", content: "Manage your participant profile." },
      { property: "og:title", content: "Profile · HackOS AI" },
      { property: "og:description", content: "Manage your participant profile on HackOS AI." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { email } = useAuth();
  const [activity, setActivity] = useState<any>(null);

  useEffect(() => {
    if (email) {
      fetch(`http://localhost:5000/api/profile?email=${email}&role=participant`)
        .then(res => res.json())
        .then(data => {
            if (data.status === "success") {
                setActivity(data.data);
            }
        })
        .catch(err => console.error("Failed to fetch activity:", err));
    }
  }, [email]);

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Account" title="Profile" subtitle="Update your public hackathon profile." />

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="p-6 text-center bg-card border border-border rounded-2xl">
          <div className="mx-auto relative grid h-24 w-24 place-items-center rounded-full">
            <div className="absolute inset-[-2px] rounded-full animate-[spin-slow_2s_linear_infinite]" style={{ background: 'conic-gradient(#00FF66, #0F3D24, #00FF66)' }} />
            <div className="absolute inset-1 rounded-full bg-card" />
            <div className="relative z-10 text-2xl font-semibold text-foreground">
              {participantProfile.avatar}
            </div>
          </div>
          <div className="mt-4 text-lg font-semibold">{participantProfile.name}</div>
          <div className="text-sm text-muted-foreground">{email || participantProfile.email}</div>
          <div className="mt-2 text-xs text-muted-foreground">{participantProfile.department} · {participantProfile.year}</div>
          <Button variant="outline" className="mt-4 w-full border-border bg-accent text-brand hover:bg-accent/80 hover:text-brand">Change photo</Button>
        </div>

        <div className="space-y-6">
          {activity && (
            <div className="p-6 bg-card border border-border rounded-2xl">
              <div className="flex items-center gap-2 mb-4 text-sm font-medium">
                <Activity className="h-4 w-4 text-brand" /> Live Activity Stats
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="glass rounded-xl p-4 text-center">
                  <div className="text-3xl font-semibold text-white">{activity.hackathons_joined}</div>
                  <div className="text-xs text-muted-foreground mt-1">Hackathons Joined</div>
                </div>
                <div className="glass rounded-xl p-4 text-center">
                  <div className="text-3xl font-semibold text-white">{activity.meals_claimed}</div>
                  <div className="text-xs text-muted-foreground mt-1">Meals Claimed</div>
                </div>
              </div>
            </div>
          )}

          <div className="p-6 bg-card border border-border rounded-2xl">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Name" defaultValue={participantProfile.name} />
              <Field label="Email" defaultValue={email || participantProfile.email} />
              <Field label="Phone" defaultValue={participantProfile.phone} />
              <Field label="College" defaultValue={participantProfile.college} />
              <Field label="GitHub" icon={Github} defaultValue={participantProfile.github} />
              <Field label="LinkedIn" icon={Linkedin} defaultValue={participantProfile.linkedin} />
              <Field label="Portfolio" icon={LinkIcon} defaultValue={participantProfile.portfolio} />
            </div>
            <div className="mt-4 space-y-1.5">
              <Label>Skills</Label>
              <Textarea defaultValue={participantProfile.skills.join(", ")} className="min-h-[80px]" />
            </div>
            <div className="mt-4 space-y-1.5">
              <Label>Resume</Label>
              <div className="glass flex items-center justify-between rounded-xl p-3 text-sm">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/5">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium">aditi_rao_resume.pdf</div>
                    <div className="text-xs text-muted-foreground">Uploaded Jul 15 · 342KB</div>
                  </div>
                </div>
                <Button variant="outline" className="border-white/10 bg-white/5" size="sm">Replace</Button>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" className="border-border bg-accent text-brand hover:bg-accent/80 hover:text-brand">Cancel</Button>
              <Button onClick={() => toast.success("Profile saved")} className="bg-gradient-brand text-foreground hover:opacity-90 hover:animate-[glow-pulse_2s_infinite]">
                Save changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  defaultValue,
  icon: Icon,
}: {
  label: string;
  defaultValue: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />}
        <Input 
          defaultValue={defaultValue} 
          className={`bg-muted border-border focus-visible:border-brand focus-visible:ring-0 focus-visible:shadow-[0_0_0_2px_rgba(0,255,102,0.15)] transition-all duration-200 ${Icon ? "pl-10" : ""}`} 
        />
      </div>
    </div>
  );
}
