import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, GlassCard } from "@/components/hackos/section";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/store/auth";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Activity } from "lucide-react";

export const Route = createFileRoute("/organizer/settings")({
  head: () => ({
    meta: [
      { title: "Settings · HackOS AI" },
      { name: "description", content: "Organization, theme, security and profile settings." },
      { property: "og:title", content: "Organizer Settings · HackOS AI" },
      { property: "og:description", content: "Organization, theme, security and profile settings." },
    ],
  }),
  component: Settings,
});

function Settings() {
  const { scanCode, email } = useAuth();
  const [code, setCode] = useState(scanCode);
  const [activity, setActivity] = useState<any>(null);

  useEffect(() => {
    if (email) {
      fetch(`http://192.168.1.67:5000/api/profile?email=${email}&role=organizer`)
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
      <PageHeader eyebrow="Workspace" title="Settings" subtitle="Organization, security and event defaults." />

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-6">
          <div className="text-sm font-medium">Organization</div>
          <div className="mt-4 grid gap-4">
            <div className="space-y-1.5"><Label>Organization name</Label><Input defaultValue="HackOS Foundation" /></div>
            <div className="space-y-1.5"><Label>Website</Label><Input defaultValue="hackos.ai" /></div>
            <div className="space-y-1.5">
              <Label>Logo</Label>
              <div className="glass flex items-center gap-3 rounded-xl p-3">
                <div className="grid h-12 w-12 place-items-center rounded-lg bg-gradient-brand text-white font-semibold">HK</div>
                <Button variant="outline" className="border-white/10 bg-white/5">Change logo</Button>
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="text-sm font-medium">Security</div>
          <div className="mt-4 grid gap-4">
            <div className="space-y-1.5">
              <Label>Organizer scan code</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} className="font-mono" />
              <div className="text-xs text-muted-foreground">Required to open the food QR scanner.</div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Two-factor auth</Label>
                <div className="text-xs text-muted-foreground">Required for admins</div>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Public event pages</Label>
                <div className="text-xs text-muted-foreground">Anyone can view your hackathons</div>
              </div>
              <Switch defaultChecked />
            </div>
            <Button
              onClick={() => { useAuth.setState({ scanCode: code }); toast.success("Settings saved"); }}
              className="bg-gradient-brand text-white hover:opacity-90"
            >
              Save changes
            </Button>
          </div>
        </GlassCard>

        {activity && (
          <GlassCard className="p-6 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4 text-sm font-medium">
              <Activity className="h-4 w-4 text-brand" /> Live Organizer Stats
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass rounded-xl p-4 text-center">
                <div className="text-3xl font-semibold text-white">{activity.hackathons_created}</div>
                <div className="text-xs text-muted-foreground mt-1">Hackathons Hosted</div>
              </div>
              <div className="glass rounded-xl p-4 text-center">
                <div className="text-3xl font-semibold text-white">{activity.total_participants}</div>
                <div className="text-xs text-muted-foreground mt-1">Total Participants</div>
              </div>
            </div>
          </GlassCard>
        )}

        <GlassCard className="p-6 lg:col-span-2">
          <div className="text-sm font-medium">Theme</div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { name: "Aurora", grad: "linear-gradient(135deg,#a78bfa,#22d3ee,#f472b6)" },
              { name: "Nebula", grad: "linear-gradient(135deg,#f59e0b,#ef4444,#8b5cf6)" },
              { name: "Forest", grad: "linear-gradient(135deg,#10b981,#0ea5e9)" },
            ].map((t, i) => (
              <button key={t.name} className={`glass rounded-xl p-2 text-left ${i === 0 ? "ring-brand" : ""}`}>
                <div className="h-16 w-full rounded-lg" style={{ background: t.grad }} />
                <div className="mt-2 text-xs">{t.name}</div>
              </button>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6 lg:col-span-2">
          <div className="text-sm font-medium">Profile</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5"><Label>Your name</Label><Input defaultValue="Marcus Chen" /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input defaultValue={email || "ops@hackos.ai"} /></div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
