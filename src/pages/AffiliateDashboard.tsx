import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Copy, Users, DollarSign, LinkIcon, TrendingUp, LogOut } from "lucide-react";
import { Navigate } from "react-router-dom";

interface Affiliate {
  id: string;
  user_id: string;
  referral_code: string;
  commission_percent: number;
  total_earnings: number;
  total_referrals: number;
  status: string;
  created_at: string;
}

interface Referral {
  id: string;
  referred_user_id: string;
  commission_amount: number;
  status: string;
  created_at: string;
}

const AffiliateDashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (user) loadData();
    else if (!authLoading) setLoading(false);
  }, [user, authLoading]);

  const loadData = async () => {
    setLoading(true);
    const { data } = await supabase.from("affiliates").select("*").eq("user_id", user!.id).maybeSingle();
    if (data) {
      setAffiliate(data as any);
      const { data: refs } = await supabase.from("affiliate_referrals").select("*")
        .eq("affiliate_id", (data as any).id).order("created_at", { ascending: false });
      setReferrals((refs as any[]) || []);
    }
    setLoading(false);
  };

  const joinAffiliate = async () => {
    if (!user) return;
    setJoining(true);
    const code = "VM" + user.id.slice(0, 6).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
    const { error } = await supabase.from("affiliates").insert({
      user_id: user.id,
      referral_code: code,
      commission_percent: 10,
    } as any);
    if (error) { toast.error(error.message); setJoining(false); return; }
    toast.success("Welcome to the Affiliate Program! 🎉");
    setJoining(false);
    loadData();
  };

  const referralLink = affiliate ? `${window.location.origin}/auth?ref=${affiliate.referral_code}` : "";

  if (authLoading || loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (!user) return <Navigate to="/auth?redirect=/affiliate" replace />;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5 text-primary" />
          <span className="font-bold text-lg text-foreground">VidMind Affiliates</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{user.email}</span>
          <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {!affiliate ? (
          <Card className="max-w-lg mx-auto">
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Join Our Affiliate Program</h2>
              <p className="text-muted-foreground">
                Earn commission on every sale you refer. Share your unique link and start earning today!
              </p>
              <Button size="lg" onClick={joinAffiliate} disabled={joining}>
                {joining ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Join Now — It's Free
              </Button>
            </CardContent>
          </Card>
        ) : affiliate.status === "pending" ? (
          <Card className="max-w-lg mx-auto">
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <Badge variant="secondary" className="text-sm">Pending Approval</Badge>
              <h2 className="text-xl font-bold text-foreground">Your application is under review</h2>
              <p className="text-muted-foreground">Admin will approve your affiliate account soon. Check back later!</p>
            </CardContent>
          </Card>
        ) : affiliate.status === "suspended" ? (
          <Card className="max-w-lg mx-auto">
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <Badge variant="destructive" className="text-sm">Suspended</Badge>
              <h2 className="text-xl font-bold text-foreground">Your affiliate account is suspended</h2>
              <p className="text-muted-foreground">Please contact support for more information.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <Users className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-3xl font-bold text-foreground">{affiliate.total_referrals}</p>
                  <p className="text-sm text-muted-foreground">Total Referrals</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <DollarSign className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-3xl font-bold text-foreground">৳{affiliate.total_earnings}</p>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <TrendingUp className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-3xl font-bold text-foreground">{affiliate.commission_percent}%</p>
                  <p className="text-sm text-muted-foreground">Commission Rate</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle className="text-lg">Your Referral Link</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input readOnly value={referralLink} className="font-mono text-sm" />
                  <Button onClick={() => { navigator.clipboard.writeText(referralLink); toast.success("Link copied!"); }}>
                    <Copy className="h-4 w-4 mr-1" /> Copy
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share this link with your audience. You earn {affiliate.commission_percent}% commission on every paid subscription through your link.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Recent Referrals</CardTitle></CardHeader>
              <CardContent>
                {referrals.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-6">No referrals yet. Start sharing your link!</p>
                ) : (
                  <div className="space-y-2">
                    {referrals.map(r => (
                      <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="text-sm text-foreground">Referral #{r.id.slice(0, 8)}</p>
                          <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-foreground">৳{r.commission_amount}</p>
                          <Badge variant={r.status === "paid" ? "default" : "secondary"} className="text-xs">{r.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default AffiliateDashboard;
