import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ClipboardList, Loader2, Check } from "lucide-react";
import { PageHeader } from "@/components/hackos/section";
import { useAuth } from "@/store/auth";

export const Route = createFileRoute("/organizer/scan-logs")({
  head: () => ({
    meta: [{ title: "Scan Logs" }],
  }),
  component: ScanLogs,
});

function ScanLogs() {
  const email = useAuth((s) => s.email);
  const hackathon = useAuth((s) => s.hackathon);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!email || !hackathon?.id) return;

    setLoading(true);
    fetch(`http://192.168.1.67:5000/api/organizer/scan-logs?hackathon_id=${hackathon.id}&organizer_email=${email}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setLogs(json.data);
        } else {
          setError(json.message || "Failed to load scan logs");
        }
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [email, hackathon]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Logs"
        title="Scan History"
        subtitle="Complete audit log of all QR scans."
      />

      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading logs...
          </div>
        ) : error ? (
          <div className="flex h-64 items-center justify-center text-red-400">
            {error}
          </div>
        ) : logs.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
            <ClipboardList className="mb-2 h-8 w-8 opacity-50" />
            No scan logs recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-black/20 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium">Participant</th>
                  <th className="px-6 py-4 font-medium">Action</th>
                  <th className="px-6 py-4 font-medium">Detail</th>
                  <th className="px-6 py-4 font-medium">Scanned By</th>
                  <th className="px-6 py-4 font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5">
                    <td className="px-6 py-4 font-medium">{log.participant_name}</td>
                    <td className="px-6 py-4 capitalize">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand">
                        {log.scan_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {log.sub_type || "—"}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{log.scanned_by}</td>
                    <td className="px-6 py-4 text-muted-foreground text-xs whitespace-nowrap">
                      {new Date(log.scanned_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
