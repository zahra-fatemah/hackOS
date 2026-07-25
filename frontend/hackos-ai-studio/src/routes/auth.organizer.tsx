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
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";

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

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      login("organizer", result.user.displayName || result.user.email?.split("@")[0] || "Organizer", result.user.email || "");
      toast.success("Welcome to Mission Control!");
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

        <div className="my-6 flex items-center gap-3 text-[11px] text-muted-foreground">
          <div className="h-px flex-1 bg-white/10" />
          OR
          <div className="h-px flex-1 bg-white/10" />
        </div>
        <Button 
          type="button" 
          onClick={handleGoogleSignIn} 
          disabled={loading}
          variant="outline" 
          className="h-11 w-full rounded-xl border-white/10 bg-white/5"
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </Button>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          Participating in an event?{" "}
          <Link to="/auth/participant" className="text-brand hover:underline">Participant login</Link>
        </div>
      </motion.div>
    </div>
  );
}
