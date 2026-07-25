import { createFileRoute } from "@tanstack/react-router";
import { Home, Compass, Ticket, QrCode, User, Settings } from "lucide-react";
import { PortalShell, MobileNav } from "@/components/hackos/portal-shell";
import { useRouterState } from "@tanstack/react-router";

import { useState, useEffect } from "react";
import { useAuth } from "@/store/auth";

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
    const email = useAuth((s) => s.email);
    const [qrLink, setQrLink] = useState("/participant/qr");
    const [hasZeroRegs, setHasZeroRegs] = useState(false);

    useEffect(() => {
      if (!email) return;
      fetch(`http://localhost:5000/api/profile?email=${email}&role=participant`)
        .then(res => res.json())
        .then(res => {
          if (res.success && res.data.registrations) {
            const regs = res.data.registrations;
            if (regs.length === 1) {
              setQrLink(`/participant/qr?participantId=${regs[0].id}`);
            } else if (regs.length > 1) {
              setQrLink("/participant/registrations");
            } else {
              setHasZeroRegs(true);
            }
          }
        })
        .catch(console.error);
    }, [email]);

    const nav = [
      { to: "/participant", label: "Dashboard", icon: Home },
      {
        label: "Explore",
        children: [
          { to: "/participant/explore", label: "Explore Hackathons", icon: Compass },
        ]
      },
      {
        label: "My Activity",
        children: [
          { to: "/participant/registrations", label: "My Registrations", icon: Ticket },
          { to: hasZeroRegs ? "#" : qrLink, label: "My QR Pass", icon: QrCode, disabled: hasZeroRegs },
        ]
      },
      {
        label: "Account",
        children: [
          { to: "/participant/profile", label: "Profile", icon: User },
          { to: "/participant/settings", label: "Settings", icon: Settings },
        ]
      }
    ];

    return (
      <>
        <PortalShell title={titleFor(pathname)} nav={nav} base="participant" />
        <MobileNav nav={nav} base="participant" />
      </>
    );
  },
});
