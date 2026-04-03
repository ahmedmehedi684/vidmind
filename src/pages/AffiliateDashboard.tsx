import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Loader2, Copy, Users, DollarSign, LinkIcon, TrendingUp, LogOut,
  Mail, Lock, Eye, EyeOff, LogIn, User, CheckCircle, Percent, Gift, ArrowRight
} from "lucide-react";

interface Affiliate {
  id: string; user_id: string; referral_code: string;
  commission_percent: number; total_earnings: number;
  total_referrals: number; status: string; created_at: string;
}

interface Referral {
  id: string; referred_user_id: string; commission_amount: number;
  status: string; created_at: string;
}

const AffiliateDashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  // Auth form state
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading2, setAuthLoading2] = useState(false);

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
      user_id: user.id, referral_code: code, commission_percent: 10,
    } as any);
    if (error) { toast.error(error.message); setJoining(false); return; }
    toast.success("Welcome to the Affiliate Program! 🎉");
    setJoining(false);
    loadData();
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) { toast.error("Please enter email and password"); return; }
    if (!isLogin && !name.trim()) { toast.error("Please enter your name"); return; }
    setAuthLoading2(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Login successful!");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: name.trim(), name: name.trim() } },
        });
        if (error) throw error;
        if (data.user) await supabase.from("profiles").update({ name: name.trim() } as any).eq("id", data.user.id);
        if (data.session) { toast.success("Account created!"); return; }
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (!signInError) { toast.success("Account created!"); return; }
        toast.success("Account created! Please check your email to verify.");
      }
    } catch (err: any) { toast.error(err.message || "Authentication failed"); }
    finally { setAuthLoading2(false); }
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/affiliate" },
    });
  };

  const referralLink = affiliate ? `${window.location.origin}/auth?ref=${affiliate.referral_code}` : "";

  if (authLoading || (user && loading)) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  // Header component
  const Header = () => (
    <header className="border-b border-border px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <LinkIcon className="h-5 w-5 text-primary" />
        <span className="font-bold text-lg text-foreground">VidMind Affiliates</span>
      </div>
      {user && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{user.email}</span>
          <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
        </div>
      )}
    </header>
  );

  // Not logged in — show landing + auth form
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-5xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left — Info */}
            <div className="space-y-8">
              <div>
                <Badge className="mb-4 bg-primary/10 text-primary border-0">Affiliate Program</Badge>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
                  Earn Money by Sharing VidMind
                </h1>
                <p className="text-muted-foreground mt-3 text-lg">
                  Join our affiliate program and earn commission on every paid subscription you refer. It's free to join!
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { icon: Percent, title: "Generous Commission", desc: "Earn up to 10% commission on every successful referral sale." },
                  { icon: Gift, title: "Free to Join", desc: "No fees, no requirements. Just sign up and start sharing your unique link." },
                  { icon: TrendingUp, title: "Real-Time Tracking", desc: "Track your referrals, earnings, and payouts from your affiliate dashboard." },
                  { icon: CheckCircle, title: "Easy Payouts", desc: "Get paid directly to your preferred payment method when you reach the minimum." },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">{item.title}</h3>
                      <p className="text-muted-foreground text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">10%</p>
                  <p>Commission</p>
                </div>
                <Separator orientation="vertical" className="h-10" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">30 Days</p>
                  <p>Cookie Duration</p>
                </div>
                <Separator orientation="vertical" className="h-10" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">Free</p>
                  <p>To Join</p>
                </div>
              </div>
            </div>

            {/* Right — Auth Card */}
            <Card className="shadow-lg border-border">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl">{isLogin ? "Login to Your Account" : "Create Your Account"}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {isLogin ? "Login to access your affiliate dashboard" : "Sign up to start earning as an affiliate"}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full gap-2" onClick={handleGoogleLogin}>
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </Button>

                <div className="relative">
                  <Separator />
                  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">or</span>
                </div>

                <form onSubmit={handleAuth} className="space-y-3">
                  {!isLogin && (
                    <div>
                      <Label htmlFor="aff-name">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="aff-name" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} className="pl-9" />
                      </div>
                    </div>
                  )}
                  <div>
                    <Label htmlFor="aff-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="aff-email" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} className="pl-9" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="aff-pass">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="aff-pass" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="pl-9 pr-9" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={authLoading2}>
                    {authLoading2 ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LogIn className="h-4 w-4 mr-2" />}
                    {isLogin ? "Login" : "Create Account"}
                  </Button>
                </form>

                <p className="text-center text-sm text-muted-foreground">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}
                  <button onClick={() => setIsLogin(!isLogin)} className="text-primary font-medium ml-1 hover:underline">
                    {isLogin ? "Sign Up" : "Login"}
                  </button>
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // Logged in — Dashboard
  return (
    <div className="min-h-screen bg-background">
      <Header />
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
              <p className="text-muted-foreground">Admin will approve your affiliate account soon.</p>
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
                  Share this link with your audience. You earn {affiliate.commission_percent}% commission on every paid subscription.
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
