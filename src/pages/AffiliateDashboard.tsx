import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import {
  Loader2, Copy, Users, DollarSign, LinkIcon, TrendingUp, LogOut,
  Mail, Lock, Eye, EyeOff, LogIn, User, ChevronRight, ChevronDown,
  Zap, Share2, Banknote, MousePointerClick, ShoppingCart, Wallet,
  ArrowRight, HelpCircle,
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
      user_id: user.id, referral_code: code, commission_percent: 20,
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
          options: { emailRedirectTo: window.location.origin + "/affiliate", data: { full_name: name.trim(), name: name.trim() } },
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
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0d14" }}>
      <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#00ff87" }} />
    </div>
  );

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen" style={{ background: "#0a0d14", color: "#f0f4ff", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b" style={{ background: "rgba(10,13,20,0.92)", backdropFilter: "blur(16px)", borderColor: "#1e2535" }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-4 md:px-6">
          <Link to="/" className="flex items-center gap-2">
            <img src="/favicon.ico" alt="VidMind" className="h-7 w-7" />
            <span className="text-xl font-bold" style={{ color: "#00ff87" }}>VidMind</span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm hidden sm:inline" style={{ color: "#8892a4" }}>{user.email}</span>
                <Button variant="ghost" size="sm" onClick={signOut} className="text-[#8892a4] hover:text-[#f0f4ff]">
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button size="sm" style={{ background: "#00ff87", color: "#0a0d14" }} className="font-semibold">Login</Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 30%, rgba(0,255,135,0.08) 0%, transparent 70%)" }} />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm mb-8" style={{ background: "rgba(0,255,135,0.08)", border: "1px solid rgba(0,255,135,0.2)", color: "#00ff87" }}>
            ✦ Affiliate Program
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
            Earn <span style={{ color: "#00ff87" }}>20% Commission</span>
            <br />on Every Sale
          </h1>
          <p className="text-base md:text-lg max-w-2xl mx-auto mb-8" style={{ color: "#8892a4" }}>
            Join VidMind's affiliate program. Share your unique link, refer users, and earn money every time someone subscribes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <Button size="lg" className="h-12 px-8 text-base font-semibold gap-2 text-[#0a0d14]" style={{ background: "#00ff87" }} onClick={() => scrollTo("dashboard")}>
                Go to Dashboard <ChevronRight className="h-5 w-5" />
              </Button>
            ) : (
              <Button size="lg" className="h-12 px-8 text-base font-semibold gap-2 text-[#0a0d14]" style={{ background: "#00ff87" }} onClick={() => scrollTo("signup")}>
                Join Now — It's Free <ArrowRight className="h-5 w-5" />
              </Button>
            )}
            <Button variant="outline" size="lg" className="h-12 px-8 text-base border-[#1e2535] text-[#f0f4ff] bg-transparent hover:bg-[#1e2535]" onClick={() => scrollTo("how-it-works")}>
              Learn More <ChevronDown className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-20 px-4" style={{ background: "#0f1320", borderTop: "1px solid #1e2535", borderBottom: "1px solid #1e2535" }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold tracking-widest uppercase text-center mb-3" style={{ color: "#00ff87" }}>How It Works</p>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12" style={{ fontFamily: "'Playfair Display', serif" }}>
            Three Simple Steps
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: User, num: "1", title: "Sign Up Free", desc: "Create your affiliate account in seconds. No approval needed." },
              { icon: Share2, num: "2", title: "Share Your Link", desc: "Get your unique referral link and share it on social media, YouTube, blogs, or anywhere." },
              { icon: Banknote, num: "3", title: "Earn 20% Commission", desc: "Every time someone subscribes through your link, you earn 20% of the sale — automatically." },
            ].map((step) => (
              <div key={step.num} className="text-center space-y-4">
                <div className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto" style={{ background: "rgba(0,255,135,0.1)", border: "1px solid rgba(0,255,135,0.2)" }}>
                  <step.icon className="h-7 w-7" style={{ color: "#00ff87" }} />
                </div>
                <div className="inline-flex items-center justify-center h-8 w-8 rounded-full text-sm font-bold" style={{ background: "#00ff87", color: "#0a0d14" }}>
                  {step.num}
                </div>
                <h3 className="text-lg font-bold" style={{ color: "#f0f4ff" }}>{step.title}</h3>
                <p className="text-sm" style={{ color: "#8892a4" }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMMISSION CARD */}
      <section className="py-20 px-4">
        <div className="max-w-lg mx-auto">
          <div className="rounded-2xl p-8 text-center space-y-5" style={{ background: "#111827", border: "2px solid rgba(0,255,135,0.3)" }}>
            <Banknote className="h-10 w-10 mx-auto" style={{ color: "#00ff87" }} />
            <h3 className="text-3xl md:text-4xl font-bold" style={{ color: "#00ff87", fontFamily: "'Playfair Display', serif" }}>
              20% Commission
            </h3>
            <p className="text-sm" style={{ color: "#8892a4" }}>on every successful subscription</p>
            <Separator style={{ background: "#1e2535" }} />
            <div className="space-y-2 text-sm" style={{ color: "#8892a4" }}>
              <p>💳 Payments via bKash, Nagad, Rocket or Payoneer</p>
              <p>💰 Minimum payout: ৳500</p>
              <p>⏱️ Paid within 7 days of request</p>
            </div>
          </div>
        </div>
      </section>

      {/* DASHBOARD (logged in only) OR SIGNUP CARD */}
      <section id="dashboard" className="py-20 px-4" style={{ background: "#0f1320", borderTop: "1px solid #1e2535", borderBottom: "1px solid #1e2535" }}>
        <div className="max-w-4xl mx-auto">
          {!user ? (
            <div id="signup" className="max-w-md mx-auto">
              <p className="text-xs font-semibold tracking-widest uppercase text-center mb-3" style={{ color: "#00ff87" }}>Get Started</p>
              <h2 className="text-2xl font-bold text-center mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
                Login to Access Your Dashboard
              </h2>
              <div className="rounded-2xl p-6 space-y-4" style={{ background: "#111827", border: "1px solid #1e2535" }}>
                <Button variant="outline" className="w-full gap-2 border-[#1e2535] text-[#f0f4ff] bg-transparent hover:bg-[#1e2535]" onClick={handleGoogleLogin}>
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </Button>
                <div className="relative">
                  <Separator style={{ background: "#1e2535" }} />
                  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 text-xs" style={{ background: "#111827", color: "#8892a4" }}>or</span>
                </div>
                <form onSubmit={handleAuth} className="space-y-3">
                  {!isLogin && (
                    <div>
                      <Label className="text-[#8892a4] text-xs">Full Name</Label>
                      <Input placeholder="Your name" value={name} onChange={e => setName(e.target.value)} className="bg-[#0a0d14] border-[#1e2535] text-[#f0f4ff]" />
                    </div>
                  )}
                  <div>
                    <Label className="text-[#8892a4] text-xs">Email</Label>
                    <Input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} className="bg-[#0a0d14] border-[#1e2535] text-[#f0f4ff]" />
                  </div>
                  <div>
                    <Label className="text-[#8892a4] text-xs">Password</Label>
                    <div className="relative">
                      <Input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="bg-[#0a0d14] border-[#1e2535] text-[#f0f4ff] pr-9" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#8892a4" }}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full font-semibold text-[#0a0d14]" style={{ background: "#00ff87" }} disabled={authLoading2}>
                    {authLoading2 ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {isLogin ? "Login" : "Create Account"}
                  </Button>
                </form>
                <p className="text-center text-sm" style={{ color: "#8892a4" }}>
                  {isLogin ? "Don't have an account?" : "Already have an account?"}
                  <button onClick={() => setIsLogin(!isLogin)} className="font-medium ml-1 hover:underline" style={{ color: "#00ff87" }}>
                    {isLogin ? "Sign Up" : "Login"}
                  </button>
                </p>
              </div>
            </div>
          ) : !affiliate ? (
            <div className="max-w-md mx-auto text-center space-y-6">
              <div className="h-20 w-20 rounded-full flex items-center justify-center mx-auto" style={{ background: "rgba(0,255,135,0.1)" }}>
                <TrendingUp className="h-10 w-10" style={{ color: "#00ff87" }} />
              </div>
              <h2 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Join Our Affiliate Program</h2>
              <p style={{ color: "#8892a4" }}>Start earning 20% commission on every referral. One click to join!</p>
              <Button size="lg" className="h-12 px-8 font-semibold text-[#0a0d14]" style={{ background: "#00ff87" }} onClick={joinAffiliate} disabled={joining}>
                {joining ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Join Now — It's Free <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          ) : affiliate.status === "suspended" ? (
            <div className="max-w-md mx-auto text-center space-y-4">
              <Badge className="text-sm" style={{ background: "rgba(239,68,68,0.2)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}>Suspended</Badge>
              <h2 className="text-xl font-bold">Your affiliate account is suspended</h2>
              <p style={{ color: "#8892a4" }}>Please contact support for more information.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "#00ff87" }}>Your Dashboard</p>
                <h2 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Affiliate Dashboard</h2>
              </div>

              {/* Referral Link */}
              <div className="rounded-2xl p-6 space-y-3" style={{ background: "#111827", border: "1px solid #1e2535" }}>
                <h3 className="font-bold text-sm" style={{ color: "#f0f4ff" }}>Your Referral Link</h3>
                <div className="flex gap-2">
                  <Input readOnly value={referralLink} className="font-mono text-sm bg-[#0a0d14] border-[#1e2535] text-[#f0f4ff]" />
                  <Button className="shrink-0 font-semibold text-[#0a0d14]" style={{ background: "#00ff87" }} onClick={() => { navigator.clipboard.writeText(referralLink); toast.success("Link copied!"); }}>
                    <Copy className="h-4 w-4 mr-1" /> Copy
                  </Button>
                </div>
                <p className="text-xs" style={{ color: "#8892a4" }}>Share this link to earn {affiliate.commission_percent}% on every subscription.</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: MousePointerClick, label: "Total Clicks", value: "—", color: "#6bcbff" },
                  { icon: Users, label: "Total Signups", value: String(affiliate.total_referrals), color: "#c084fc" },
                  { icon: ShoppingCart, label: "Total Sales", value: String(referrals.filter(r => r.status === "paid").length), color: "#ffd93d" },
                  { icon: Wallet, label: "Total Earnings", value: `৳${affiliate.total_earnings}`, color: "#00ff87" },
                ].map(stat => (
                  <div key={stat.label} className="rounded-xl p-5 text-center" style={{ background: "#111827", border: "1px solid #1e2535" }}>
                    <stat.icon className="h-6 w-6 mx-auto mb-2" style={{ color: stat.color }} />
                    <p className="text-2xl font-bold" style={{ color: "#f0f4ff", fontFamily: "'Playfair Display', serif" }}>{stat.value}</p>
                    <p className="text-xs mt-1" style={{ color: "#8892a4" }}>{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Recent Referrals */}
              <div className="rounded-2xl p-6" style={{ background: "#111827", border: "1px solid #1e2535" }}>
                <h3 className="font-bold text-sm mb-4" style={{ color: "#f0f4ff" }}>Recent Referrals</h3>
                {referrals.length === 0 ? (
                  <p className="text-sm text-center py-6" style={{ color: "#8892a4" }}>No referrals yet. Start sharing your link!</p>
                ) : (
                  <div className="space-y-2">
                    {referrals.map(r => (
                      <div key={r.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "#0a0d14" }}>
                        <div>
                          <p className="text-sm" style={{ color: "#f0f4ff" }}>Referral #{r.id.slice(0, 8)}</p>
                          <p className="text-xs" style={{ color: "#8892a4" }}>{new Date(r.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold" style={{ color: "#f0f4ff" }}>৳{r.commission_amount}</p>
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{
                            background: r.status === "paid" ? "rgba(0,255,135,0.1)" : "rgba(255,217,61,0.1)",
                            color: r.status === "paid" ? "#00ff87" : "#ffd93d",
                          }}>{r.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-semibold tracking-widest uppercase text-center mb-3" style={{ color: "#00ff87" }}>FAQ</p>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10" style={{ fontFamily: "'Playfair Display', serif" }}>
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="space-y-2">
            {[
              { q: "Who can join the affiliate program?", a: "Anyone can join for free. No approval or minimum audience required." },
              { q: "When do I get paid?", a: "Payouts are processed within 7 days of your request. Minimum payout is ৳500." },
              { q: "How do I track my referrals?", a: "Your affiliate dashboard shows all clicks, signups, sales, and earnings in real time." },
              { q: "Is there a limit on how much I can earn?", a: "No limit at all. The more you refer, the more you earn." },
            ].map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="rounded-xl px-5" style={{ background: "#111827", border: "1px solid #1e2535" }}>
                <AccordionTrigger className="text-sm font-semibold hover:no-underline" style={{ color: "#f0f4ff" }}>
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm" style={{ color: "#8892a4" }}>
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 50% 60% at 50% 50%, rgba(0,255,135,0.06) 0%, transparent 70%)" }} />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Ready to Start <span style={{ color: "#00ff87" }}>Earning?</span>
          </h2>
          <p className="max-w-lg mx-auto mb-8" style={{ color: "#8892a4" }}>
            Join hundreds of creators already earning with VidMind.
          </p>
          {user ? (
            <Button size="lg" className="h-13 px-10 text-base font-semibold gap-2 text-[#0a0d14]" style={{ background: "#00ff87" }} onClick={() => scrollTo("dashboard")}>
              Go to Dashboard <ArrowRight className="h-5 w-5" />
            </Button>
          ) : (
            <Button size="lg" className="h-13 px-10 text-base font-semibold gap-2 text-[#0a0d14]" style={{ background: "#00ff87" }} onClick={() => scrollTo("signup")}>
              Join Affiliate Program <ArrowRight className="h-5 w-5" />
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4" style={{ borderTop: "1px solid #1e2535" }}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/favicon.ico" alt="VidMind" className="h-5 w-5" />
            <span className="text-sm" style={{ color: "#8892a4" }}>VidMind Affiliate Program</span>
          </div>
          <div className="flex items-center gap-5 text-sm">
            <Link to="/" className="transition-colors hover:text-[#00ff87]" style={{ color: "#8892a4" }}>Home</Link>
            <Link to="/privacy-policy" className="transition-colors hover:text-[#00ff87]" style={{ color: "#8892a4" }}>Privacy</Link>
            <Link to="/terms-of-service" className="transition-colors hover:text-[#00ff87]" style={{ color: "#8892a4" }}>Terms</Link>
          </div>
          <p className="text-sm" style={{ color: "#8892a4" }}>© 2025 VidMind. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default AffiliateDashboard;
