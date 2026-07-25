import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useNavigate } from "@tanstack/react-router";
import { Home, Users, QrCode, Sparkles, Utensils, Grid3x3, Calendar, User, Settings } from "lucide-react";

export function CommandPalette({
  open,
  onOpenChange,
  base,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  base: "participant" | "organizer";
}) {
  const navigate = useNavigate();
  const go = (to: string) => {
    onOpenChange(false);
    navigate({ to });
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search hackathons, participants, actions…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {base === "participant" ? (
          <CommandGroup heading="Participant">
            <CommandItem onSelect={() => go("/participant")}><Home className="mr-2 h-4 w-4" />Dashboard</CommandItem>
            <CommandItem onSelect={() => go("/participant/explore")}><Calendar className="mr-2 h-4 w-4" />Explore hackathons</CommandItem>
            <CommandItem onSelect={() => go("/participant/qr")}><QrCode className="mr-2 h-4 w-4" />My QR</CommandItem>
            <CommandItem onSelect={() => go("/participant/profile")}><User className="mr-2 h-4 w-4" />Profile</CommandItem>
          </CommandGroup>
        ) : (
          <CommandGroup heading="Organizer">
            <CommandItem onSelect={() => go("/organizer")}><Home className="mr-2 h-4 w-4" />Dashboard</CommandItem>
            <CommandItem onSelect={() => go("/organizer/create")}><Sparkles className="mr-2 h-4 w-4" />Create hackathon (AI)</CommandItem>
            <CommandItem onSelect={() => go("/organizer/participants")}><Users className="mr-2 h-4 w-4" />Manage participants</CommandItem>
            <CommandItem onSelect={() => go("/organizer/ppt-analysis")}><Sparkles className="mr-2 h-4 w-4" />AI PPT analysis</CommandItem>
            <CommandItem onSelect={() => go("/organizer/seating")}><Grid3x3 className="mr-2 h-4 w-4" />Smart seating</CommandItem>
            <CommandItem onSelect={() => go("/organizer/food")}><Utensils className="mr-2 h-4 w-4" />Food management</CommandItem>
          </CommandGroup>
        )}
        <CommandSeparator />
        <CommandGroup heading="System">
          <CommandItem onSelect={() => go(`/${base}/settings`)}><Settings className="mr-2 h-4 w-4" />Settings</CommandItem>
          <CommandItem onSelect={() => go("/")}>Go to landing</CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
