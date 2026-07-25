import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ScanLine, LogIn } from "lucide-react";
import { PageHeader } from "@/components/hackos/section";
import { Button } from "@/components/ui/button";
import { ScannerModal } from "@/components/hackos/scanner-modal";

export const Route = createFileRoute("/organizer/entry")({
  head: () => ({
    meta: [{ title: "Entry Scanner" }],
  }),
  component: EntryScanner,
});

function EntryScanner() {
  const [scannerOpen, setScannerOpen] = useState(false);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Check-in"
        title="Entry management"
        subtitle="QR-protected entry with duplicate detection."
        actions={
          <Button onClick={() => setScannerOpen(true)} className="bg-gradient-brand text-white hover:opacity-90">
            <ScanLine className="mr-2 h-4 w-4" /> Open scanner
          </Button>
        }
      />

      <div className="flex h-[40vh] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5">
        <div className="text-center">
          <LogIn className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <div className="mt-4 text-lg font-medium">Ready to scan entries</div>
          <p className="mt-1 text-sm text-muted-foreground">Click the button above to start scanning participant QRs.</p>
        </div>
      </div>

      <ScannerModal
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        scanType="entry"
        icon={LogIn}
      />
    </div>
  );
}
