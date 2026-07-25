import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { PageHeader, GlassCard } from "@/components/hackos/section";
import { Button } from "@/components/ui/button";
import { Gift, Copy, Eye, Clock, ShieldCheck, Gamepad2, ShoppingCart } from "lucide-react";
import { useAuth } from "@/store/auth";

export const Route = createFileRoute("/participant/rewards")({
  head: () => ({
    meta: [{ title: "My Rewards · HackOS AI" }],
  }),
  component: ParticipantRewards,
});

function getPlatformColor(platform: string) {
  switch(platform.toLowerCase()) {
    case 'amazon': return 'from-orange-500/20 to-amber-500/10 border-orange-500/30 text-orange-400';
    case 'steam': return 'from-blue-600/20 to-indigo-600/10 border-blue-500/30 text-blue-400';
    case 'flipkart': return 'from-blue-400/20 to-yellow-400/10 border-blue-400/30 text-blue-300';
    case 'swiggy': return 'from-orange-600/20 to-red-600/10 border-orange-500/30 text-orange-400';
    case 'zomato': return 'from-red-600/20 to-rose-600/10 border-red-500/30 text-red-400';
    default: return 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400';
  }
}

function getPlatformIcon(platform: string) {
  switch(platform.toLowerCase()) {
    case 'amazon': 
    case 'flipkart': 
      return <ShoppingCart className="h-8 w-8 mb-4 opacity-80" />;
    case 'steam': 
      return <Gamepad2 className="h-8 w-8 mb-4 opacity-80" />;
    default: 
      return <Gift className="h-8 w-8 mb-4 opacity-80" />;
  }
}

function ParticipantRewards() {
  const email = useAuth((s) => s.email);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [rewards, setRewards] = useState<any[]>([]);
  const [revealing, setRevealing] = useState<string | null>(null);

  useEffect(() => {
    if (!email) return;
    fetch(`http://192.168.1.67:5000/api/profile?email=${email}&role=participant`)
      .then(res => res.json())
      .then(async json => {
        if (json.success && json.data.registrations && json.data.registrations.length > 0) {
          const pids = json.data.registrations.map((r: any) => r.participant_id);
          const allRewardsPromises = pids.map((pid: string) => 
            fetch(`http://192.168.1.67:5000/api/rewards/participant/${pid}`)
              .then(res => res.json())
              .then(j => j.success ? j.data : [])
              .catch(() => [])
          );
          const allRewardsArrays = await Promise.all(allRewardsPromises);
          setRewards(allRewardsArrays.flat());
        }
      })
      .catch(console.error);
  }, [email]);



  const handleReveal = async (rewardId: string, pId: string) => {
    if (!pId) return;
    setRevealing(rewardId);
    try {
      const res = await fetch("http://192.168.1.67:5000/api/rewards/reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant_id: pId,
          reward_id: rewardId
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Voucher code revealed securely!");
        // Update the reward in state with the real code
        setRewards(prev => prev.map(r => 
          r._id === rewardId ? { ...r, voucher_code: json.data.voucher_code, revealed: true } : r
        ));
      } else {
        toast.error(json.message || "Failed to reveal voucher.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    } finally {
      setRevealing(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Voucher code copied to clipboard!");
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Digital Wallet"
        title="My Rewards"
        subtitle="Access your hard-earned hackathon prizes and vouchers."
      />

      {rewards.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed border-white/10 rounded-xl bg-white/5">
          <Gift className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Rewards Yet</h3>
          <p className="text-muted-foreground text-center max-w-sm">
            Keep hacking and winning! Once an organizer issues a reward to you, it will securely appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.map(r => {
            const colors = getPlatformColor(r.reward_platform);
            const isRevealed = r.revealed && r.voucher_code !== "********-****-****";
            
            return (
              <GlassCard key={r._id} className={`p-6 bg-gradient-to-br border flex flex-col ${colors}`}>
                <div className="flex justify-between items-start">
                  {getPlatformIcon(r.reward_platform)}
                  <span className={`text-xs font-bold px-2 py-1 rounded-full bg-black/20 uppercase tracking-wider`}>
                    {r.status}
                  </span>
                </div>
                
                <h3 className="text-2xl font-bold mb-1">{r.voucher_value} {r.reward_platform}</h3>
                <p className="text-sm opacity-80 mb-6">For winning: {r.position}</p>

                <div className="mt-auto bg-black/20 rounded-lg p-4 relative overflow-hidden group">
                  <div className="text-xs uppercase tracking-widest opacity-60 mb-2 font-semibold">Voucher Code</div>
                  
                  <div className="flex items-center justify-between">
                    <code className="text-lg font-mono tracking-widest">
                      {r.voucher_code}
                    </code>
                  </div>

                  {r.status === 'ACTIVE' && !isRevealed && (
                    <div className="absolute inset-0 bg-background/95 backdrop-blur flex items-center justify-center">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => handleReveal(r._id, r.participant_id)}
                        disabled={revealing === r._id}
                        className="font-medium"
                      >
                        <ShieldCheck className="h-4 w-4 mr-2" />
                        {revealing === r._id ? "Verifying..." : "Reveal Code"}
                      </Button>
                    </div>
                  )}

                  {isRevealed && (
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 hover:bg-black/40"
                      onClick={() => copyToClipboard(r.voucher_code)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {r.organizer_message && (
                  <div className="mt-4 text-sm italic opacity-80 border-t border-white/10 pt-4">
                    "{r.organizer_message}"
                  </div>
                )}
                
                {r.expiry_date && (
                  <div className="mt-3 text-xs opacity-60 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Expires: {new Date(r.expiry_date).toLocaleDateString()}
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
