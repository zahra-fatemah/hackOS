// Central mock data for HackOS AI.
// Backend integrations should replace these arrays with real API calls.

export type Hackathon = {
  id: string;
  name: string;
  tagline: string;
  banner: string;
  organizer: string;
  location: string;
  mode: "Online" | "In-Person" | "Hybrid";
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  prizePool: string;
  participants: number;
  tracks: string[];
  sponsors: string[];
  status: "Upcoming" | "Live" | "Ended";
  trending?: boolean;
  description: string;
  rules: string[];
  timeline: { time: string; label: string }[];
};

export const hackathons: Hackathon[] = [
  {
    id: "hackos-genesis",
    name: "Genesis AI Hack",
    tagline: "Build the future of autonomous agents",
    banner: "linear-gradient(135deg,#7c3aed,#22d3ee)",
    organizer: "HackOS Foundation",
    location: "San Francisco, CA",
    mode: "Hybrid",
    startDate: "Aug 22, 2026",
    endDate: "Aug 24, 2026",
    registrationDeadline: "Aug 15, 2026",
    prizePool: "$120,000",
    participants: 2400,
    tracks: ["AI Agents", "Developer Tools", "Robotics", "Consumer AI"],
    sponsors: ["OpenAI", "Vercel", "Linear", "Supabase"],
    status: "Upcoming",
    trending: true,
    description:
      "A 48-hour flagship hackathon focused on shipping production-grade AI agents. Compete across four tracks, ship live demos, and win from a $120k prize pool.",
    rules: [
      "Teams of 1–4 participants",
      "All code must be written during the event",
      "Open source dependencies allowed",
      "One submission per team",
    ],
    timeline: [
      { time: "Fri 6:00 PM", label: "Opening Ceremony" },
      { time: "Fri 8:00 PM", label: "Team Formation" },
      { time: "Sat 10:00 AM", label: "Mentor Sessions" },
      { time: "Sun 2:00 PM", label: "Submissions Close" },
      { time: "Sun 6:00 PM", label: "Awards & Demos" },
    ],
  },
  {
    id: "quantum-quest",
    name: "Quantum Quest 2026",
    tagline: "Where physics meets code",
    banner: "linear-gradient(135deg,#f472b6,#8b5cf6)",
    organizer: "MIT Quantum Lab",
    location: "Cambridge, MA",
    mode: "In-Person",
    startDate: "Sep 10, 2026",
    endDate: "Sep 12, 2026",
    registrationDeadline: "Sep 1, 2026",
    prizePool: "$65,000",
    participants: 900,
    tracks: ["Quantum ML", "Cryptography", "Simulation"],
    sponsors: ["IBM", "Google Quantum", "Xanadu"],
    status: "Upcoming",
    trending: true,
    description:
      "Explore the frontier of quantum computing with hands-on access to real quantum hardware and elite mentors.",
    rules: ["Teams of 2–5", "Must use approved quantum SDKs"],
    timeline: [
      { time: "Day 1", label: "Kickoff & Workshops" },
      { time: "Day 2", label: "Build" },
      { time: "Day 3", label: "Judging" },
    ],
  },
  {
    id: "climate-code",
    name: "Climate Code Sprint",
    tagline: "Code for a cooler planet",
    banner: "linear-gradient(135deg,#22c55e,#0ea5e9)",
    organizer: "GreenStack",
    location: "Online",
    mode: "Online",
    startDate: "Oct 4, 2026",
    endDate: "Oct 6, 2026",
    registrationDeadline: "Sep 28, 2026",
    prizePool: "$40,000",
    participants: 1700,
    tracks: ["Energy", "Carbon", "Wildlife AI"],
    sponsors: ["Stripe Climate", "Watershed"],
    status: "Upcoming",
    description: "A global online sprint focused on climate-positive software.",
    rules: ["Global participation", "Open source encouraged"],
    timeline: [
      { time: "Day 1", label: "Opening" },
      { time: "Day 3", label: "Awards" },
    ],
  },
  {
    id: "fintech-forge",
    name: "FinTech Forge",
    tagline: "Rewire global money movement",
    banner: "linear-gradient(135deg,#f59e0b,#ef4444)",
    organizer: "Stripe & Y Combinator",
    location: "New York, NY",
    mode: "Hybrid",
    startDate: "Nov 14, 2026",
    endDate: "Nov 16, 2026",
    registrationDeadline: "Nov 1, 2026",
    prizePool: "$90,000",
    participants: 1200,
    tracks: ["Payments", "DeFi", "Compliance AI"],
    sponsors: ["Stripe", "Ramp", "Mercury"],
    status: "Upcoming",
    description: "The premier fintech hackathon for founders and builders.",
    rules: ["Teams of 1–4"],
    timeline: [{ time: "Day 1", label: "Opening" }],
  },
];

export const analytics = {
  hackathons: 12,
  participants: 4820,
  mealsClaimed: 3115,
  pptsUploaded: 812,
  weekly: [
    { day: "Mon", registrations: 120, meals: 300 },
    { day: "Tue", registrations: 180, meals: 420 },
    { day: "Wed", registrations: 260, meals: 480 },
    { day: "Thu", registrations: 220, meals: 510 },
    { day: "Fri", registrations: 340, meals: 620 },
    { day: "Sat", registrations: 410, meals: 780 },
    { day: "Sun", registrations: 300, meals: 690 },
  ],
  tracks: [
    { name: "AI Agents", value: 38 },
    { name: "DevTools", value: 22 },
    { name: "Consumer", value: 18 },
    { name: "Climate", value: 12 },
    { name: "Fintech", value: 10 },
  ],
};

export const recentActivity = [
  { id: 1, actor: "Aditi Rao", action: "registered for", target: "Genesis AI Hack", time: "2m ago" },
  { id: 2, actor: "Team Nebula", action: "uploaded PPT to", target: "Quantum Quest", time: "5m ago" },
  { id: 3, actor: "Rahul S.", action: "claimed", target: "Lunch", time: "9m ago" },
  { id: 4, actor: "Team Orion", action: "was seated in", target: "Room A · Seat 12", time: "17m ago" },
  { id: 5, actor: "Karan M.", action: "registered for", target: "Climate Code Sprint", time: "22m ago" },
];

export const participantProfile = {
  name: "Aditi Rao",
  email: "aditi@stanford.edu",
  phone: "+1 (415) 555-0117",
  college: "Stanford University",
  department: "Computer Science",
  year: "Junior",
  skills: ["React", "TypeScript", "PyTorch", "Rust", "LangChain"],
  github: "github.com/aditir",
  linkedin: "linkedin.com/in/aditir",
  portfolio: "aditir.dev",
  avatar: "AR",
};

export const registrations = [
  {
    id: "REG-8A21F",
    hackathonId: "hackos-genesis",
    hackathon: "Genesis AI Hack",
    team: "Team Nebula",
    status: "Confirmed",
    date: "Jul 18, 2026",
  },
  {
    id: "REG-9C40E",
    hackathonId: "quantum-quest",
    hackathon: "Quantum Quest 2026",
    team: "Solo",
    status: "Pending",
    date: "Jul 21, 2026",
  },
];

export const foodStats = {
  breakfast: { claimed: 812, total: 1200 },
  lunch: { claimed: 1020, total: 1200 },
  dinner: { claimed: 640, total: 1200 },
  recent: [
    { name: "Rahul S.", meal: "Lunch", time: "12:41 PM", status: "ok" as const },
    { name: "Priya V.", meal: "Lunch", time: "12:40 PM", status: "ok" as const },
    { name: "Karan M.", meal: "Lunch", time: "12:39 PM", status: "duplicate" as const },
    { name: "Sana K.", meal: "Lunch", time: "12:38 PM", status: "ok" as const },
    { name: "Dev P.", meal: "Lunch", time: "12:37 PM", status: "ok" as const },
  ],
  timeline: [
    { time: "8AM", claimed: 40 },
    { time: "9AM", claimed: 220 },
    { time: "10AM", claimed: 480 },
    { time: "12PM", claimed: 720 },
    { time: "1PM", claimed: 1020 },
    { time: "6PM", claimed: 1240 },
    { time: "8PM", claimed: 1640 },
  ],
};

export const teamsCsv = [
  { team: "Nebula", members: ["Aditi Rao", "Rahul S.", "Karan M."] },
  { team: "Orion", members: ["Priya V.", "Sana K."] },
  { team: "Andromeda", members: ["Dev P.", "Ishaan R.", "Maya T."] },
  { team: "Vega", members: ["Neel J.", "Tara S."] },
  { team: "Sirius", members: ["Aarav D.", "Kabir M.", "Zoya A."] },
  { team: "Lyra", members: ["Ravi K.", "Meera S."] },
  { team: "Draco", members: ["Ansh G.", "Riya P."] },
  { team: "Phoenix", members: ["Vivaan T.", "Anika B."] },
  { team: "Corvus", members: ["Kunal V.", "Aisha R."] },
  { team: "Hydra", members: ["Aryan L.", "Nisha J."] },
  { team: "Pegasus", members: ["Rohan T.", "Simran A."] },
  { team: "Cygnus", members: ["Yash M.", "Sneha K."] },
];

export const pptResult = {
  domain: "Autonomous AI Agents",
  confidence: 92,
  problem:
    "Enterprise teams struggle to coordinate long-running LLM workflows across tools, causing silent failures and lost context.",
  techStack: ["Next.js", "LangGraph", "Postgres", "Redis", "OpenAI"],
  innovation:
    "A durable execution runtime for agent graphs with pause/resume, human-in-the-loop, and cross-tool memory.",
  business:
    "Usage-based pricing per successful agent run; on-prem tier for regulated industries.",
  summary:
    "A compelling submission that pairs a real enterprise pain-point with a novel durable-agent runtime and a clean go-to-market wedge.",
  judge: { name: "Dr. Priya Menon", expertise: "AI Systems @ DeepMind", match: 96 },
  missing: ["Architecture Diagram", "Dataset Overview"],
  present: ["Problem", "Solution", "Tech Stack", "Business Model", "Team"],
};
