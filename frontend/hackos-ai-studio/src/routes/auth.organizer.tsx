import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { Shield, ArrowLeft, Mail, Key } from "lucide-react";
import { AmbientBackground, Particles } from "@/components/hackos/background";
import { Logo } from "@/components/hackos/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/store/auth";

export const Route = createFileRoute("/auth/organizer")({
  head: () => ({
    meta: [
      { title: "Organizer Login · HackOS AI" },
      { name: "description", content: "Sign in to HackOS AI as an organizer to manage your hackathons." },
      { property: "og:title", content: "Organizer Login · HackOS AI" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const login = useAuth((s) => s.login);
  
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: "organizer" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      
      toast.success("OTP sent to your email!");
      setStep("otp");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, role: "organizer" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid OTP");
      
      login("organizer", email.split("@")[0], email);
      toast.success("Welcome back, Organizer!");
      navigate({ to: "/organizer" });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <AmbientBackground />
      <Particles count={20} />
      <Link to="/" className="absolute left-6 top-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <div className="absolute right-6 top-6"><Logo /></div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="glass-strong relative w-full max-w-md rounded-3xl p-8"
      >
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-wider text-brand">
          <Shield className="h-3 w-3" /> Organizer
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Organizer Portal</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to manage your hackathons.</p>

        {step === "email" ? (
          <form onSubmit={requestOtp} className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ops@hackos.ai"
                  className="h-11 pl-10"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading || !email}
              className="h-11 w-full rounded-xl bg-gradient-brand text-white hover:opacity-90"
            >
              {loading ? "Sending Code..." : "Send Login Code"}
            </Button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <Label>One-Time Password</Label>
              <div className="relative">
                <Key className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="h-11 pl-10 tracking-widest"
                  maxLength={6}
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading || otp.length < 6}
              className="h-11 w-full rounded-xl bg-gradient-brand text-white hover:opacity-90"
            >
              {loading ? "Verifying..." : "Verify & Sign In"}
            </Button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => setStep("email")}
                className="text-xs text-muted-foreground hover:text-white"
              >
                Use a different email
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 text-center text-xs text-muted-foreground">
          Participating in an event?{" "}
          <Link to="/auth/participant" className="text-brand hover:underline">Participant login</Link>
        </div>
      </motion.div>
    </div>
  );
}
