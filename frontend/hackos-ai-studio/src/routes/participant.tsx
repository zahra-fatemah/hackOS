import { createFileRoute } from "@tanstack/react-router";
import { Home, Compass, Ticket, QrCode, User, Settings } from "lucide-react";
import { PortalShell, MobileNav } from "@/components/hackos/portal-shell";
import { useRouterState } from "@tanstack/react-router";

const nav = [
  { to: "/participant", label: "Dashboard", icon: Home },
  { to: "/participant/explore", label: "Explore Hackathons", icon: Compass },
  { to: "/participant/registrations", label: "My Registrations", icon: Ticket },
  { to: "/participant/qr", label: "My QR", icon: QrCode },
  { to: "/participant/profile", label: "Profile", icon: User },
  { to: "/participant/settings", label: "Settings", icon: Settings },
];

const titleFor = (path: string) => {
  if (path === "/participant") return "Dashboard";
  if (path.startsWith("/participant/explore")) return "Explore Hackathons";
  if (path.startsWith("/participant/hackathon")) return "Hackathon Details";
  if (path.startsWith("/participant/register")) return "AI Registration";
  if (path.startsWith("/participant/registrations")) return "My Registrations";
  if (path.startsWith("/participant/qr")) return "My QR Pass";
  if (path.startsWith("/participant/profile")) return "Profile";
  if (path.startsWith("/participant/settings")) return "Settings";
  return "Participant";
};

export const Route = createFileRoute("/participant")({
  component: () => {
    const pathname = useRouterState({ select: (s) => s.location.pathname });
    return (
      <>
        <PortalShell title={titleFor(pathname)} nav={nav} base="participant" />
        <MobileNav nav={nav} base="participant" />
      </>
    );
  },
});
