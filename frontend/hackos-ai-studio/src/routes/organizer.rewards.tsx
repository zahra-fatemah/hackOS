import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { PageHeader, GlassCard } from "@/components/hackos/section";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Gift, Trash2, CheckCircle2, Ticket } from "lucide-react";
import { useAuth } from "@/store/auth";

export const Route = createFileRoute("/organizer/rewards")({
  head: () => ({
    meta: [{ title: "Voucher Center · HackOS AI" }],
  }),
  component: RewardsDashboard,
});

function RewardsDashboard() {
  const email = useAuth((s) => s.email);
  const [hackathonId, setHackathonId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  
  // Form State
  const [participantId, setParticipantId] = useState("");
  const [position, setPosition] = useState("Winner");
  const [platform, setPlatform] = useState("Amazon");
  const [voucherValue, setVoucherValue] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [message, setMessage] = useState("Congratulations!");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 1. Fetch Hackathons
    fetch("http://192.168.1.67:5000/api/hackathons")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data.length > 0) {
          const hid = json.data[0].id || json.data[0]._id;
          setHackathonId(hid);
          fetchData(hid);
        }
      })
      .catch(console.error);

    // 2. Fetch Participants for the dropdown
    if (email) {
      fetch(`http://192.168.1.67:5000/api/organizer/participants?organizer_email=${email}`)
        .then(res => res.json())
        .then(json => {
          if (json.success) setParticipants(json.data);
        })
        .catch(console.error);
    }
  }, [email]);

  const fetchData = (hid: string) => {
    // Fetch Rewards
    fetch(`http://192.168.1.67:5000/api/rewards/hackathon/${hid}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setRewards(json.data);
      })
      .catch(console.error);

    // Fetch Stats
    fetch(`http://192.168.1.67:5000/api/rewards/dashboard/${hid}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setStats(json.data);
      })
      .catch(console.error);
  };

  const handleIssueReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hackathonId || !participantId || !platform || !voucherCode) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://192.168.1.67:5000/api/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hackathon_id: hackathonId,
          participant_id: participantId,
          position,
          reward_platform: platform,
          reward_type: "Voucher",
          voucher_value: voucherValue,
          voucher_code: voucherCode,
          expiry_date: expiryDate ? new Date(expiryDate).toISOString() : "",
          organizer_message: message,
          issued_by: email
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Reward issued securely.");
        setParticipantId("");
        setVoucherCode("");
        setVoucherValue("");
        fetchData(hackathonId);
      } else {
        toast.error(json.message || "Failed to issue reward.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRedeemed = async (rewardId: string) => {
    try {
      const res = await fetch("http://192.168.1.67:5000/api/rewards/redeemed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reward_id: rewardId })
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Marked as redeemed.");
        if (hackathonId) fetchData(hackathonId);
      } else {
        toast.error(json.message);
      }
    } catch(err) {
      toast.error("Network error");
    }
  };

  const handleRevoke = async (rewardId: string) => {
    if (!confirm("Are you sure you want to revoke and delete this reward?")) return;
    try {
      const res = await fetch(`http://192.168.1.67:5000/api/rewards/${rewardId}`, {
        method: "DELETE"
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Reward revoked.");
        if (hackathonId) fetchData(hackathonId);
      } else {
        toast.error(json.message);
      }
    } catch(err) {
      toast.error("Network error");
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Digital Voucher Center"
        title="Manage Rewards"
        subtitle="Securely issue, track, and manage digital vouchers for winners."
      />

      {/* DASHBOARD STATS */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <GlassCard className="p-4 flex flex-col justify-center border-emerald-500/20">
            <div className="text-3xl font-bold text-emerald-400">{stats.active}</div>
            <div className="text-sm text-muted-foreground mt-1">Active Rewards</div>
          </GlassCard>
          <GlassCard className="p-4 flex flex-col justify-center border-amber-500/20">
            <div className="text-3xl font-bold text-amber-400">{stats.unrevealed}</div>
            <div className="text-sm text-muted-foreground mt-1">Unrevealed</div>
          </GlassCard>
          <GlassCard className="p-4 flex flex-col justify-center border-blue-500/20">
            <div className="text-3xl font-bold text-blue-400">{stats.redeemed}</div>
            <div className="text-sm text-muted-foreground mt-1">Redeemed</div>
          </GlassCard>
          <GlassCard className="p-4 flex flex-col justify-center border-red-500/20">
            <div className="text-3xl font-bold text-red-400">{stats.expired}</div>
            <div className="text-sm text-muted-foreground mt-1">Expired</div>
          </GlassCard>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ASSIGN REWARD FORM */}
        <div className="lg:col-span-1">
          <form onSubmit={handleIssueReward}>
            <GlassCard className="p-6 space-y-4 border-white/10">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Gift className="h-5 w-5 text-emerald-400" />
                Issue New Reward
              </h3>

              <div className="space-y-2">
                <Label>Participant (Winner)</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={participantId} 
                  onChange={(e) => setParticipantId(e.target.value)}
                  required
                >
                  <option value="" disabled>Select a participant...</option>
                  {participants.map(p => (
                    <option key={p.participant_id} value={p.participant_id}>
                      {p.full_name} ({p.college})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Platform</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={platform} 
                    onChange={(e) => setPlatform(e.target.value)}
                  >
                    <option value="Amazon">Amazon</option>
                    <option value="Flipkart">Flipkart</option>
                    <option value="Steam">Steam</option>
                    <option value="Swiggy">Swiggy</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Position</Label>
                  <Input 
                    value={position} 
                    onChange={(e) => setPosition(e.target.value)} 
                    placeholder="e.g. 1st Place" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Voucher Code</Label>
                  <Input 
                    value={voucherCode} 
                    onChange={(e) => setVoucherCode(e.target.value)} 
                    placeholder="AMZ-XXXX-XXXX" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Value (e.g. ₹5000)</Label>
                  <Input 
                    value={voucherValue} 
                    onChange={(e) => setVoucherValue(e.target.value)} 
                    placeholder="₹5000" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Expiry Date (Optional)</Label>
                <Input 
                  type="date"
                  value={expiryDate} 
                  onChange={(e) => setExpiryDate(e.target.value)} 
                />
              </div>

              <div className="space-y-2">
                <Label>Congratulatory Message</Label>
                <Input 
                  value={message} 
                  onChange={(e) => setMessage(e.target.value)} 
                  placeholder="You crushed it!" 
                />
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white mt-4" disabled={loading}>
                {loading ? "Issuing..." : "Issue Reward"}
              </Button>
            </GlassCard>
          </form>
        </div>

        {/* ISSUED REWARDS LIST */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Ticket className="h-5 w-5 text-blue-400" />
            Issued Vouchers
          </h3>
          
          <div className="space-y-3">
            {rewards.length === 0 ? (
              <div className="text-muted-foreground text-sm p-4 border border-white/10 rounded bg-white/5 text-center">
                No rewards issued yet for this hackathon.
              </div>
            ) : (
              rewards.map(r => (
                <GlassCard key={r._id} className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        r.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 
                        r.status === 'EXPIRED' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {r.status}
                      </span>
                      {r.revealed && <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">Revealed</span>}
                    </div>
                    <h4 className="font-semibold text-lg">{r.reward_platform} - {r.voucher_value}</h4>
                    <div className="text-sm text-muted-foreground mt-1">
                      <strong>To:</strong> {participants.find(p => p.participant_id === r.participant_id)?.full_name || r.participant_id} <br/>
                      <strong>For:</strong> {r.position} <br/>
                      <strong>Code:</strong> {r.voucher_code} {/* This will be masked by backend */}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {r.status === 'ACTIVE' && (
                      <Button variant="outline" size="sm" onClick={() => handleMarkRedeemed(r._id)} className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Redeemed
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => handleRevoke(r._id)} className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </GlassCard>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
