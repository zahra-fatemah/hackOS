import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ScanLine, Presentation } from "lucide-react";
import { PageHeader } from "@/components/hackos/section";
import { Button } from "@/components/ui/button";
import { ScannerModal } from "@/components/hackos/scanner-modal";

export const Route = createFileRoute("/organizer/workshops")({
  head: () => ({
    meta: [{ title: "Workshop Scanner" }],
  }),
  component: WorkshopScanner,
});

const WORKSHOP_OPTIONS = [
  "Intro to React",
  "Backend with Flask",
  "AI Agents Crash Course",
  "Pitching Your Project",
];

function WorkshopScanner() {
  const [scannerOpen, setScannerOpen] = useState(false);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Workshops"
        title="Attendance management"
        subtitle="QR-protected workshop check-ins."
        actions={
          <Button onClick={() => setScannerOpen(true)} className="bg-gradient-brand text-white hover:opacity-90">
            <ScanLine className="mr-2 h-4 w-4" /> Open scanner
          </Button>
        }
      />

      <div className="flex h-[40vh] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5">
        <div className="text-center">
          <Presentation className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <div className="mt-4 text-lg font-medium">Ready to scan workshops</div>
          <p className="mt-1 text-sm text-muted-foreground">Click the button above to start scanning participant QRs.</p>
        </div>
      </div>

      <ScannerModal
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        scanType="workshop"
        options={WORKSHOP_OPTIONS}
        optionsLabel="Select Workshop"
        icon={Presentation}
      />
    </div>
  );
}
