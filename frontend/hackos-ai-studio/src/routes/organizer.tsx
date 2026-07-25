import { createFileRoute, useRouterState } from "@tanstack/react-router";
import { Home, Sparkles, Users, BrainCircuit, Grid3x3, Utensils, Settings, LogIn, Presentation, Trophy, ClipboardList, Gift } from "lucide-react";
import { PortalShell, MobileNav } from "@/components/hackos/portal-shell";

const nav = [
  { to: "/organizer", label: "Dashboard", icon: Home },
  {
    label: "Event Management",
    children: [
      { to: "/organizer/create", label: "Create Event", icon: Sparkles, badge: "AI" },
      { to: "/organizer/participants", label: "Manage Participants", icon: Users },
      { to: "/organizer/ppt-analysis", label: "PPT Analysis", icon: BrainCircuit, badge: "AI" },
      { to: "/organizer/seating", label: "Smart Seating", icon: Grid3x3 },
    ],
  },
  {
    label: "QR & Scanning",
    children: [
      { to: "/organizer/entry", label: "Entry Check-in", icon: LogIn },
      { to: "/organizer/food", label: "Food Management", icon: Utensils },
      { to: "/organizer/workshops", label: "Workshops", icon: Presentation },
      { to: "/organizer/rewards", label: "Voucher Center", icon: Gift },
    ],
  },
  {
    label: "Analytics",
    children: [
      { to: "/organizer/scan-logs", label: "Scan History Log", icon: ClipboardList },
    ],
  },
  {
    label: "Settings",
    children: [
      { to: "/organizer/settings", label: "Settings", icon: Settings },
    ],
  }
];

const titleFor = (path: string) => {
  if (path === "/organizer") return "Command Center";
  if (path.startsWith("/organizer/create")) return "Create Hackathon";
  if (path.startsWith("/organizer/participants")) return "Manage Participants";
  if (path.startsWith("/organizer/ppt-analysis")) return "AI PPT Analysis";
  if (path.startsWith("/organizer/seating")) return "Smart Seating";
  if (path.startsWith("/organizer/entry")) return "Check-in";
  if (path.startsWith("/organizer/food")) return "Food Management";
  if (path.startsWith("/organizer/workshops")) return "Workshops";
  if (path.startsWith("/organizer/prizes")) return "Prize Distribution";
  if (path.startsWith("/organizer/scan-logs")) return "Scan Logs";
  if (path.startsWith("/organizer/settings")) return "Settings";
  return "Organizer";
};

export const Route = createFileRoute("/organizer")({
  component: () => {
    const pathname = useRouterState({ select: (s) => s.location.pathname });
    return (
      <>
        <PortalShell title={titleFor(pathname)} nav={nav} base="organizer" />
        <MobileNav nav={nav} base="organizer" />
      </>
    );
  },
});
