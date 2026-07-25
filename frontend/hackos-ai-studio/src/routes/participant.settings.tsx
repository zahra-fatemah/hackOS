import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, GlassCard } from "@/components/hackos/section";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/participant/settings")({
  head: () => ({
    meta: [
      { title: "Settings · HackOS AI" },
      { name: "description", content: "Manage your participant preferences." },
      { property: "og:title", content: "Settings · HackOS AI" },
      { property: "og:description", content: "Preferences, security and notifications." },
    ],
  }),
  component: () => (
    <div className="space-y-8">
      <PageHeader eyebrow="Preferences" title="Settings" subtitle="Notifications, security and privacy." />
      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-6">
          <div className="text-sm font-medium">Notifications</div>
          {["Registration confirmations", "Event reminders", "Mentor messages", "Prize announcements"].map((s) => (
            <div key={s} className="mt-4 flex items-center justify-between">
              <div>
                <Label>{s}</Label>
                <div className="text-xs text-muted-foreground">Email + in-app</div>
              </div>
              <Switch defaultChecked />
            </div>
          ))}
        </GlassCard>
        <GlassCard className="p-6">
          <div className="text-sm font-medium">Security</div>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <div>
                <Label>Two-factor auth</Label>
                <div className="text-xs text-muted-foreground">Protect your account with 2FA</div>
              </div>
              <Switch />
            </div>
            <Button variant="outline" className="w-full border-white/10 bg-white/5">Change password</Button>
            <Button variant="outline" className="w-full border-white/10 bg-white/5 text-destructive">Delete account</Button>
          </div>
        </GlassCard>
      </div>
    </div>
  ),
});
