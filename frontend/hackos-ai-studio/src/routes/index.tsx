import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import {
  ArrowRight,
  Sparkles,
  QrCode,
  Grid3x3,
  Utensils,
  BrainCircuit,
  UserPlus,
  ChevronRight,
  Star,
  Github,
  Twitter,
  Linkedin,
} from "lucide-react";
import { AmbientBackground, MouseGlow, Particles } from "@/components/hackos/background";
import { Logo } from "@/components/hackos/logo";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/hackos/stat-card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HackOS AI — The AI Operating System for Modern Hackathons" },
      {
        name: "description",
        content:
          "The AI-native platform organizers and participants use to run world-class hackathons — AI registration, PPT analysis, seating and QR food in one system.",
      },
      { property: "og:title", content: "HackOS AI — AI Operating System for Hackathons" },
      {
        property: "og:description",
        content: "AI hackathon creation, registration, PPT analysis, smart seating and QR food.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: Sparkles,
    title: "AI Hackathon Creation",
    body: "Drop a poster or brief. HackOS drafts your event page, timeline, tracks, rules, sponsors and FAQ in seconds.",
    tint: "from-brand to-brand-2",
  },
  {
    icon: UserPlus,
    title: "AI Student Registration",
    body: "Applicants drop their resume. We autofill name, college, skills, socials — they just review and submit.",
    tint: "from-brand-2 to-brand-3",
  },
  {
    icon: BrainCircuit,
    title: "AI PPT Analysis",
    body: "Detect domain, tech stack, novelty, missing sections and recommend the best-matched judge — instantly.",
    tint: "from-brand-3 to-brand",
  },
  {
    icon: Grid3x3,
    title: "Smart Seating",
    body: "Upload teams CSV, define rooms and get a colored interactive seat map with search and export.",
    tint: "from-brand to-brand-3",
  },
  {
    icon: QrCode,
    title: "Smart QR Food",
    body: "Scan-code protected scanner with duplicate-claim detection, live counts and beautiful confirmations.",
    tint: "from-brand-2 to-brand",
  },
  {
    icon: Sparkles,
    title: "AI Assistant",
    body: "A copilot for both participants and organizers — ask, analyze, and act without leaving the flow.",
    tint: "from-brand-3 to-brand-2",
  },
];

const timeline = [
  { t: "Step 1", title: "Create with AI", body: "Upload your poster or brief — HackOS drafts the full event." },
  { t: "Step 2", title: "Open registrations", body: "Applicants drop resumes — AI fills their forms." },
  { t: "Step 3", title: "Run the day", body: "Seat teams, scan meals, judge with AI insights." },
  { t: "Step 4", title: "Award & analyze", body: "Ship award pages, share highlights, review analytics." },
];

const testimonials = [
  {
    name: "Priya Menon",
    role: "Head of Product · TechFest",
    body: "HackOS cut our organizing time by 70%. The PPT analysis alone changed how we judge.",
  },
  {
    name: "Marcus Chen",
    role: "Director · SF Hacks",
    body: "It looks like Linear, feels like Notion, and runs the entire event. Our participants love the QR flow.",
  },
  {
    name: "Ananya Rao",
    role: "Student · Stanford",
    body: "I dropped my resume and was registered in 30 seconds. The QR pass is the cleanest I've ever seen.",
  },
];

const sponsors = ["Stripe", "Vercel", "Linear", "Supabase", "OpenAI", "Notion", "Framer", "Raycast"];

const faqs = [
  {
    q: "Is HackOS AI free to try?",
    a: "Yes — small events can use HackOS free. Larger events unlock analytics, custom domains and AI credits.",
  },
  {
    q: "Do you host our data?",
    a: "You choose. HackOS supports our managed cloud or self-hosted deployments with the same UI.",
  },
  {
    q: "What file types does AI extraction support?",
    a: "PDF, DOCX, PPTX, PNG and JPG. Larger files are chunked automatically before analysis.",
  },
  {
    q: "Can I customize the QR passes?",
    a: "Yes — pass templates, colors and logo are fully theme-aware and export-ready.",
  },
];

function Landing() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.4]);

  return (
    <div className="relative">
      <AmbientBackground />
      <MouseGlow />

      <header className="sticky top-0 z-30 border-b border-white/5 bg-background/50 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#testimonials" className="hover:text-foreground">Customers</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/auth/participant"
              className="hidden rounded-xl px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground md:inline-flex"
            >
              Participant
            </Link>
            <Link
              to="/auth/organizer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
            >
              Organizer <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section ref={heroRef} className="relative overflow-hidden">
        <Particles count={30} />
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative mx-auto max-w-7xl px-4 pb-20 pt-24 text-center md:px-8 md:pb-28 md:pt-32"
        >
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground"
          >
            <span className="grid h-4 w-4 place-items-center rounded-full bg-gradient-brand">
              <Sparkles className="h-2.5 w-2.5 text-white" />
            </span>
            Introducing HackOS AI · v2026
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto max-w-4xl text-5xl font-semibold tracking-tight md:text-7xl"
          >
            HackOS <span className="text-gradient">AI</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground md:text-xl"
          >
            The AI Operating System for Modern Hackathons — creation, registration, judging, seating and food, in one premium platform.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link to="/participant/explore">
              <Button size="lg" className="h-11 rounded-xl bg-gradient-brand text-white shadow-lg hover:opacity-90">
                Explore Hackathons <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/organizer/create">
              <Button
                size="lg"
                variant="outline"
                className="h-11 rounded-xl border-white/15 bg-white/5 backdrop-blur hover:bg-white/10"
              >
                Create Hackathon
              </Button>
            </Link>
          </motion.div>

          {/* Hero visual */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="glass-strong relative mx-auto mt-16 max-w-5xl overflow-hidden rounded-3xl p-2 shadow-2xl"
          >
            <div className="relative rounded-2xl bg-background/70 p-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/60" />
                </div>
                <div className="text-[11px] text-muted-foreground">hackos.ai / organizer</div>
                <div className="w-14" />
              </div>
              <div className="grid grid-cols-1 gap-3 pt-4 md:grid-cols-4">
                {["Hackathons", "Participants", "Meals", "Uploads"].map((l, i) => (
                  <motion.div
                    key={l}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.08 }}
                    className="glass rounded-xl p-3 text-left"
                  >
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{l}</div>
                    <div className="mt-2 text-xl font-semibold">
                      {[12, 4820, 3115, 812][i].toLocaleString()}
                    </div>
                    <div className="mt-1 h-1 w-full rounded-full bg-white/5">
                      <div className="h-full rounded-full bg-gradient-brand" style={{ width: `${40 + i * 15}%` }} />
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="glass col-span-2 rounded-xl p-4">
                  <div className="text-xs text-muted-foreground">Registrations · this week</div>
                  <svg viewBox="0 0 400 100" className="mt-3 h-24 w-full">
                    <defs>
                      <linearGradient id="hg" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.72 0.19 295)" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="oklch(0.72 0.19 295)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <motion.path
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.8, delay: 0.6 }}
                      d="M0,80 C50,60 90,30 140,40 C190,50 230,20 280,25 C330,30 370,60 400,45"
                      fill="none"
                      stroke="oklch(0.78 0.15 220)"
                      strokeWidth="2"
                    />
                    <path
                      d="M0,80 C50,60 90,30 140,40 C190,50 230,20 280,25 C330,30 370,60 400,45 L400,100 L0,100 Z"
                      fill="url(#hg)"
                    />
                  </svg>
                </div>
                <div className="glass rounded-xl p-4">
                  <div className="text-xs text-muted-foreground">Live activity</div>
                  <ul className="mt-3 space-y-2 text-xs">
                    {["Aditi registered", "Team Nebula uploaded PPT", "Karan claimed Lunch"].map((a, i) => (
                      <motion.li
                        key={a}
                        initial={{ opacity: 0, x: 6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + i * 0.1 }}
                        className="flex items-center gap-2 text-muted-foreground"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        {a}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* STATS */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard icon={Sparkles} label="Events created" value={1240} suffix="+" delta="+18% MoM" />
          <StatCard icon={UserPlus} label="Participants onboarded" value={182000} suffix="+" delta="+42% YoY" accent="brand-2" />
          <StatCard icon={BrainCircuit} label="PPTs analyzed" value={94500} suffix="+" delta="AI-graded" accent="brand-3" />
          <StatCard icon={Utensils} label="Meals scanned" value={321000} suffix="+" delta="Zero fraud" />
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="mb-10 max-w-2xl">
          <div className="mb-3 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-wider text-muted-foreground">
            Platform
          </div>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Everything you need to run a hackathon — <span className="text-gradient">powered by AI</span>
          </h2>
          <p className="mt-3 text-muted-foreground">
            Five modules, one operating system. Built with the polish of Linear, the power of Notion, and the intelligence of a copilot.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              whileHover={{ y: -4 }}
              className="glass group relative overflow-hidden rounded-2xl p-6"
            >
              <div className={`absolute -right-8 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${f.tint} opacity-20 blur-2xl transition group-hover:opacity-40`} />
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-brand-soft ring-1 ring-white/10">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* TIMELINE */}
      <section id="how" className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="mb-10 flex flex-col items-start justify-between gap-3 md:flex-row md:items-end">
          <div>
            <div className="mb-3 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-wider text-muted-foreground">
              Workflow
            </div>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">How HackOS runs your event</h2>
          </div>
          <p className="max-w-md text-sm text-muted-foreground">
            From poster to podium in four AI-assisted steps.
          </p>
        </div>
        <div className="relative">
          <div className="absolute left-4 top-0 hidden h-full w-px bg-gradient-to-b from-brand via-brand-2 to-brand-3 md:left-1/2 md:block" />
          <div className="grid gap-6 md:grid-cols-2">
            {timeline.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className={`glass relative rounded-2xl p-6 ${i % 2 === 1 ? "md:mt-12" : ""}`}
              >
                <div className="text-[11px] uppercase tracking-wider text-brand">{s.t}</div>
                <div className="mt-2 text-xl font-semibold">{s.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* SPONSORS */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="text-center text-[11px] uppercase tracking-wider text-muted-foreground">
          Trusted at events by teams from
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-8">
          {sponsors.map((s) => (
            <div
              key={s}
              className="glass grid h-14 place-items-center rounded-xl text-sm font-medium text-muted-foreground"
            >
              {s}
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-4 py-16 md:px-8">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Questions</h2>
        <p className="mt-2 text-muted-foreground">Everything you need to know before running your next event.</p>
        <Accordion type="single" collapsible className="mt-8">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`i${i}`} className="glass mb-2 rounded-2xl border-0 px-5">
              <AccordionTrigger className="text-left text-base hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-8">
        <div className="glass-strong relative overflow-hidden rounded-3xl p-10 text-center md:p-16">
          <div className="absolute inset-0 -z-10 opacity-40" style={{ background: "var(--gradient-brand-soft)" }} />
          <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">
            Run your next hackathon <span className="text-gradient">with AI</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Free for small events. Beautiful for every event.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/auth/organizer">
              <Button size="lg" className="h-11 rounded-xl bg-gradient-brand text-white hover:opacity-90">
                Start as organizer <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/auth/participant">
              <Button size="lg" variant="outline" className="h-11 rounded-xl border-white/15 bg-white/5">
                I'm a participant
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 md:flex-row md:items-center md:px-8">
          <div>
            <Logo />
            <p className="mt-2 max-w-sm text-xs text-muted-foreground">
              © {new Date().getFullYear()} HackOS AI. The AI operating system for modern hackathons.
            </p>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground">
            <a href="#" className="hover:text-foreground"><Github className="h-4 w-4" /></a>
            <a href="#" className="hover:text-foreground"><Twitter className="h-4 w-4" /></a>
            <a href="#" className="hover:text-foreground"><Linkedin className="h-4 w-4" /></a>
          </div>
        </div>
      </footer>
    </div>
  );
}
