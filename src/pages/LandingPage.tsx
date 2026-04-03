import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ChevronRight, Zap, FileText, Youtube, Clock, Search, Target, Play, Menu, X, Star, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How it Works", href: "#how-it-works" },
  { label: "Notes", href: "#notes" },
  { label: "History", href: "#history" },
  { label: "Pricing", href: "#pricing" },
];

const features = [
  { icon: Zap, title: "Instant AI Summary", desc: "Paste any transcript and get a structured English summary in seconds. Key points, main story, and action tips — all at once." },
  { icon: FileText, title: "Smart Notes Editor", desc: "Save summaries as rich notes with full formatting — headings, bold, italic, lists, underline, image links and more." },
  { icon: Youtube, title: "Channel Library", desc: "Add your favorite YouTube channels and filter all your summaries by channel — see everything you have learned from each creator." },
  { icon: Clock, title: "Full History", desc: "Every video you summarize is saved in your history. Continue where you left off, add more notes, or revisit old insights anytime." },
  { icon: Search, title: "Search and Filter", desc: "Search across all your notes and summaries. Filter by channel, date, or topic — find exactly what you are looking for instantly." },
  { icon: Target, title: "Business Action Tips", desc: "Every summary includes specific How to Apply tips — practical actions tailored for entrepreneurs, marketers, and business builders." },
];

const steps = [
  { num: "1", title: "Paste the Transcript", desc: "Copy the transcript from any YouTube video and paste it directly into VidMind." },
  { num: "2", title: "AI Analyzes the Content", desc: "Our AI reads the full transcript and extracts the most important insights for you." },
  { num: "3", title: "Get Insights and Save Notes", desc: "Review your structured summary, save it as a note, and apply the action tips immediately." },
];

const fallbackHistoryCards = [
  { channel_name: "Natalie Dawson", title: "Speed is the Key to Success", display_date: "March 19, 2025", tags: ["Business", "Mindset", "Speed"], thumbnail_url: "", video_url: "" },
  { channel_name: "Alex Hormozi", title: "How to Make $1M Without Being Lucky", display_date: "March 17, 2025", tags: ["Money", "Business"], thumbnail_url: "", video_url: "" },
  { channel_name: "Ali Abdaal", title: "The Science of Learning Anything 10x Faster", display_date: "March 15, 2025", tags: ["Learning", "Productivity"], thumbnail_url: "", video_url: "" },
];

const testimonials = [
  { text: "VidMind saved me hours every week. I used to re-watch videos to take notes — now I get everything in 30 seconds.", name: "Rafiq Ahmed", role: "E-commerce Entrepreneur", initials: "RA" },
  { text: "The How to Apply section is genius. It does not just summarize — it tells me exactly what to do in my business.", name: "Sadia Khan", role: "Digital Marketing Agency Owner", initials: "SK" },
  { text: "The summary is always accurate and well-structured. I use VidMind every day for my learning routine.", name: "Tanvir Hossain", role: "Content Creator and Freelancer", initials: "TH" },
];

const channelsList = [
  { name: "All Notes", count: 24, color: "#00ff87" },
  { name: "Alex Hormozi", count: 8, color: "#ff6b6b" },
  { name: "Gary Vee", count: 6, color: "#ffd93d" },
  { name: "Ali Abdaal", count: 5, color: "#6bcbff" },
  { name: "MrBeast", count: 3, color: "#c084fc" },
];

const LandingPage = () => {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [historyCards, setHistoryCards] = useState(fallbackHistoryCards);
  const [pricingPlans, setPricingPlans] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("landing_showcase").select("*").order("sort_order", { ascending: true }).then(({ data }) => {
      if (data && data.length > 0) setHistoryCards(data as any[]);
    });
    supabase.from("subscription_plans").select("*").eq("is_active", true).eq("currency", "USD").order("sort_order").then(({ data }) => {
      if (data && data.length > 0) setPricingPlans(data);
    });
  }, []);

  const displayName = user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
  const initials = displayName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["features", "how-it-works", "notes", "history", "pricing"];
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120 && rect.bottom > 120) {
            setActiveSection(id);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (href: string) => {
    setMobileMenuOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen" style={{ background: "#0a0d14", color: "#f0f4ff", fontFamily: "'DM Sans', sans-serif", scrollBehavior: "smooth" }}>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b" style={{ background: "rgba(10,13,20,0.92)", backdropFilter: "blur(16px)", borderColor: "#1e2535" }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-4 md:px-6">
          <Link to="/" className="flex items-center gap-2">
            <img src="/favicon.ico" alt="VidMind" className="h-7 w-7" />
            <span className="text-xl font-bold" style={{ color: "#00ff87", fontFamily: "'DM Sans', sans-serif" }}>VidMind</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((l) => (
              <button key={l.href} onClick={() => scrollTo(l.href)} className="text-sm font-medium transition-colors" style={{ color: activeSection === l.href.slice(1) ? "#00ff87" : "#8892a4" }}>
                {l.label}
              </button>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link to="/app"><Button size="sm" className="text-[#0a0d14] font-semibold" style={{ background: "#00ff87" }}>Open App</Button></Link>
                <Link to="/app-profile">
                  <Avatar className="h-8 w-8 cursor-pointer"><AvatarFallback className="bg-[#00ff87] text-[#0a0d14] text-xs font-semibold">{initials}</AvatarFallback></Avatar>
                </Link>
              </>
            ) : (
              <>
                <Link to="/auth"><Button variant="outline" size="sm" className="border-[#1e2535] text-[#f0f4ff] hover:bg-[#1e2535] bg-transparent">Login</Button></Link>
                <Link to="/auth"><Button size="sm" className="text-[#0a0d14] font-semibold" style={{ background: "#00ff87" }}>Sign Up Free</Button></Link>
              </>
            )}
          </div>
          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6" style={{ color: "#f0f4ff" }} /> : <Menu className="h-6 w-6" style={{ color: "#f0f4ff" }} />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden px-4 pb-4 space-y-2" style={{ background: "rgba(10,13,20,0.98)" }}>
            {navLinks.map((l) => (
              <button key={l.href} onClick={() => scrollTo(l.href)} className="block w-full text-left py-2 text-sm" style={{ color: "#8892a4" }}>{l.label}</button>
            ))}
            <div className="flex gap-2 pt-2">
              {user ? (
                <Link to="/app" className="flex-1"><Button className="w-full text-[#0a0d14] font-semibold" size="sm" style={{ background: "#00ff87" }}>Open App</Button></Link>
              ) : (
                <>
                  <Link to="/auth" className="flex-1"><Button variant="outline" className="w-full border-[#1e2535] text-[#f0f4ff] bg-transparent" size="sm">Login</Button></Link>
                  <Link to="/auth" className="flex-1"><Button className="w-full text-[#0a0d14] font-semibold" size="sm" style={{ background: "#00ff87" }}>Sign Up Free</Button></Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 30%, rgba(0,255,135,0.08) 0%, transparent 70%)" }} />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm mb-8" style={{ background: "rgba(0,255,135,0.08)", border: "1px solid rgba(0,255,135,0.2)", color: "#00ff87" }}>
            ✦ AI-Powered Learning Tool
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
            Summarize Any YouTube<br />
            <span style={{ color: "#00ff87" }}>Video in Seconds</span>
          </h1>
          <p className="text-base md:text-lg max-w-2xl mx-auto mb-8" style={{ color: "#8892a4" }}>
            Paste any transcript and get instant key insights, structured notes, and business action tips — powered by AI.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link to="/auth"><Button size="lg" className="h-12 px-8 text-base font-semibold gap-2 text-[#0a0d14]" style={{ background: "#00ff87" }}>Try for Free <ChevronRight className="h-5 w-5" /></Button></Link>
            <button onClick={() => scrollTo("#how-it-works")}><Button variant="outline" size="lg" className="h-12 px-8 text-base border-[#1e2535] text-[#f0f4ff] bg-transparent hover:bg-[#1e2535]">See How it Works</Button></button>
          </div>

          {/* Browser Mockup */}
          <div className="max-w-3xl mx-auto rounded-xl overflow-hidden" style={{ background: "#0f1320", border: "1px solid #1e2535" }}>
            <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid #1e2535" }}>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: "#ff5f57" }} />
                <div className="w-3 h-3 rounded-full" style={{ background: "#ffbd2e" }} />
                <div className="w-3 h-3 rounded-full" style={{ background: "#28c840" }} />
              </div>
              <div className="flex-1 text-center text-xs" style={{ color: "#8892a4" }}>vidmind.app</div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-2">
                <div className="px-4 py-2 rounded-md text-sm font-medium" style={{ background: "rgba(0,255,135,0.1)", color: "#00ff87", border: "1px solid rgba(0,255,135,0.2)" }}>Transcript</div>
                <div className="px-4 py-2 rounded-md text-sm" style={{ color: "#8892a4" }}>YouTube Link</div>
              </div>
              <div className="rounded-lg p-3 text-sm" style={{ background: "#111827", border: "1px solid #1e2535", color: "#8892a4" }}>
                https://www.youtube.com/watch?v=dQw4w9WgXcQ
              </div>
              <button className="w-full py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2" style={{ background: "#00ff87", color: "#0a0d14" }}>
                Summarize <ChevronRight className="h-4 w-4" />
              </button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="rounded-lg p-4" style={{ background: "#111827", border: "1px solid #1e2535" }}>
                  <h4 className="text-sm font-semibold mb-2" style={{ color: "#00ff87" }}>Main Story</h4>
                  <p className="text-xs" style={{ color: "#8892a4" }}>The video explains how consistent daily habits compound into extraordinary results over time...</p>
                </div>
                <div className="rounded-lg p-4" style={{ background: "#111827", border: "1px solid #1e2535" }}>
                  <h4 className="text-sm font-semibold mb-2" style={{ color: "#00ff87" }}>Key Points</h4>
                  <ul className="text-xs space-y-1" style={{ color: "#8892a4" }}>
                    <li>• Focus on one skill at a time</li>
                    <li>• Track progress weekly</li>
                    <li>• Build systems, not goals</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 px-4" style={{ background: "#0f1320", borderTop: "1px solid #1e2535", borderBottom: "1px solid #1e2535" }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { val: "10x", label: "Faster Learning" },
            { val: "∞", label: "Videos Supported" },
            { val: "AI", label: "Powered Insights" },
            { val: "Free", label: "To Get Started" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl md:text-4xl font-bold" style={{ color: "#00ff87", fontFamily: "'Playfair Display', serif" }}>{s.val}</p>
              <p className="text-sm mt-1" style={{ color: "#8892a4" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold tracking-widest uppercase text-center mb-3" style={{ color: "#00ff87" }}>Features</p>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>Everything You Need to Learn Smarter</h2>
          <p className="text-center max-w-xl mx-auto mb-12" style={{ color: "#8892a4" }}>From instant summaries to organized notes — VidMind is your complete AI learning companion.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl p-6 transition-all hover:-translate-y-1 hover:shadow-lg" style={{ background: "#111827", border: "1px solid #1e2535" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(0,255,135,0.4)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1e2535")}>
                <div className="h-10 w-10 rounded-lg flex items-center justify-center mb-4" style={{ background: "rgba(0,255,135,0.1)" }}>
                  <f.icon className="h-5 w-5" style={{ color: "#00ff87" }} />
                </div>
                <h3 className="font-semibold text-lg mb-2" style={{ color: "#f0f4ff" }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#8892a4" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 px-4" style={{ background: "#0f1320" }}>
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-semibold tracking-widest uppercase text-center mb-3" style={{ color: "#00ff87" }}>How it Works</p>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>3 Simple Steps</h2>
          <p className="text-center max-w-md mx-auto mb-12" style={{ color: "#8892a4" }}>From transcript to actionable insights in under 30 seconds.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.num} className="text-center space-y-4">
                <div className="h-14 w-14 rounded-full flex items-center justify-center mx-auto text-xl font-bold" style={{ background: "rgba(0,255,135,0.1)", color: "#00ff87", border: "2px solid rgba(0,255,135,0.3)" }}>
                  {s.num}
                </div>
                <h3 className="font-semibold text-lg" style={{ color: "#f0f4ff" }}>{s.title}</h3>
                <p className="text-sm" style={{ color: "#8892a4" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Notes Preview */}
      <section id="notes" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold tracking-widest uppercase text-center mb-3" style={{ color: "#00ff87" }}>Notes and Channels</p>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>Your Personal Learning Library</h2>
          <p className="text-center max-w-md mx-auto mb-12" style={{ color: "#8892a4" }}>Organize everything you learn — by channel, by topic, by date.</p>
          <div className="rounded-xl overflow-hidden" style={{ background: "#111827", border: "1px solid #1e2535" }}>
            <div className="flex flex-col md:flex-row">
              {/* Sidebar */}
              <div className="md:w-64 p-5 space-y-1" style={{ borderRight: "1px solid #1e2535" }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#8892a4" }}>My Channels</p>
                {channelsList.map((ch) => (
                  <div key={ch.name} className="flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-[#1e2535]/50">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: ch.color }} />
                      <span style={{ color: "#f0f4ff" }}>{ch.name}</span>
                    </div>
                    <span className="text-xs" style={{ color: "#8892a4" }}>{ch.count}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer" style={{ color: "#00ff87" }}>+ Add Channel</div>
              </div>
              {/* Content */}
              <div className="flex-1 p-5">
                <div className="flex flex-wrap gap-1.5 mb-4 pb-3" style={{ borderBottom: "1px solid #1e2535" }}>
                  {["B", "I", "U", "H1", "H2", "List", "Link", "Image", "Save"].map((btn) => (
                    <div key={btn} className="px-2.5 py-1 rounded text-xs" style={{ background: "#1e2535", color: "#8892a4" }}>{btn}</div>
                  ))}
                </div>
                <h3 className="text-lg font-semibold mb-1" style={{ color: "#f0f4ff" }}>How to Build a $100M Business</h3>
                <div className="flex gap-2 mb-4">
                  <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(0,255,135,0.1)", color: "#00ff87" }}>Alex Hormozi</span>
                  <span className="text-xs" style={{ color: "#8892a4" }}>March 20, 2025</span>
                </div>
                <div className="space-y-2 text-sm" style={{ color: "#8892a4" }}>
                  <p>The key takeaway from this video is that building a massive business comes down to <strong style={{ color: "#f0f4ff" }}>solving painful problems</strong> at scale.</p>
                  <p>Focus on these three areas:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Find a starving crowd (demand first)</li>
                    <li>Create an irresistible offer</li>
                    <li>Deliver so much value they feel stupid saying no</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* History */}
      <section id="history" className="py-20 px-4" style={{ background: "#0f1320" }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold tracking-widest uppercase text-center mb-3" style={{ color: "#00ff87" }}>History</p>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>Your Learning Journey</h2>
          <p className="text-center max-w-md mx-auto mb-12" style={{ color: "#8892a4" }}>Every video you summarize is saved. Pick up where you left off.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {historyCards.map((h: any) => (
              <div key={h.title} className="rounded-xl overflow-hidden" style={{ background: "#111827", border: "1px solid #1e2535" }}>
                <div className="aspect-video flex items-center justify-center overflow-hidden" style={{ background: "#0a0d14" }}>
                  {h.thumbnail_url ? (
                    <img src={h.thumbnail_url} alt={h.title} className="w-full h-full object-cover" />
                  ) : (
                    <Play className="h-10 w-10" style={{ color: "#1e2535" }} />
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <p className="text-xs font-medium" style={{ color: "#00ff87" }}>{h.channel_name}</p>
                  <h4 className="font-semibold text-sm" style={{ color: "#f0f4ff" }}>{h.title}</h4>
                  <p className="text-xs" style={{ color: "#8892a4" }}>{h.display_date}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(h.tags || []).map((t: string) => (
                      <span key={t} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#1e2535", color: "#8892a4" }}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold tracking-widest uppercase text-center mb-3" style={{ color: "#00ff87" }}>Testimonials</p>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>Loved by Entrepreneurs</h2>
          <p className="text-center max-w-md mx-auto mb-12" style={{ color: "#8892a4" }}>Built for people who learn from YouTube and want to apply it fast.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-xl p-6 space-y-4" style={{ background: "#111827", border: "1px solid #1e2535" }}>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" style={{ color: "#00ff87" }} />)}
                </div>
                <p className="text-sm italic leading-relaxed" style={{ color: "#8892a4" }}>"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "rgba(0,255,135,0.1)", color: "#00ff87" }}>{t.initials}</div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#f0f4ff" }}>{t.name}</p>
                    <p className="text-xs" style={{ color: "#8892a4" }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4" style={{ background: "#0f1320" }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold tracking-widest uppercase text-center mb-3" style={{ color: "#00ff87" }}>Pricing</p>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>Simple, Transparent Pricing</h2>
          <p className="text-center max-w-md mx-auto mb-12" style={{ color: "#8892a4" }}>Start free. Upgrade when you are ready.</p>
          <div className={`grid grid-cols-1 ${pricingPlans.length > 0 ? `md:grid-cols-${Math.min(pricingPlans.length, 3)}` : "md:grid-cols-2"} gap-6 max-w-3xl mx-auto`}>
            {pricingPlans.length > 0 ? pricingPlans.map((plan: any) => (
              <div key={plan.id} className="rounded-xl p-6 space-y-5 relative" style={{ background: "#111827", border: plan.is_popular ? "2px solid #00ff87" : "1px solid #1e2535" }}>
                {plan.is_popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-semibold" style={{ background: "#00ff87", color: "#0a0d14" }}>Most Popular</div>}
                <div>
                  <h3 className="text-xl font-bold" style={{ color: "#f0f4ff" }}>{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-4xl font-bold" style={{ color: "#f0f4ff", fontFamily: "'Playfair Display', serif" }}>${plan.price}</span>
                    <span className="text-sm" style={{ color: "#8892a4" }}>/{plan.duration_months ? `${plan.duration_months} mo` : plan.duration_days === -1 ? "lifetime" : `${plan.duration_days}d`}</span>
                  </div>
                  {plan.description && <p className="text-sm mt-1" style={{ color: "#8892a4" }}>{plan.description}</p>}
                </div>
                <ul className="space-y-3">
                  {(plan.features as string[]).map((f: string) => (
                    <li key={f} className="flex items-center gap-2 text-sm" style={{ color: "#8892a4" }}><Check className="h-4 w-4 shrink-0" style={{ color: "#00ff87" }} />{f}</li>
                  ))}
                </ul>
                <Link to={user ? "/app-subscription" : "/auth?redirect=subscription"}>
                  <Button className={`w-full font-semibold ${plan.is_popular ? "text-[#0a0d14]" : ""}`} variant={plan.is_popular ? "default" : "outline"} style={plan.is_popular ? { background: "#00ff87" } : { borderColor: "#1e2535", color: "#f0f4ff" }}>
                    {plan.price === 0 ? "Get Started Free" : "Subscribe Now"} {plan.is_popular && <ChevronRight className="h-4 w-4 ml-1" />}
                  </Button>
                </Link>
              </div>
            )) : (
              <>
                {/* Fallback hardcoded */}
                <div className="rounded-xl p-6 space-y-5" style={{ background: "#111827", border: "1px solid #1e2535" }}>
                  <div><h3 className="text-xl font-bold" style={{ color: "#f0f4ff" }}>Free</h3><div className="mt-2"><span className="text-4xl font-bold" style={{ color: "#f0f4ff" }}>$0</span><span className="text-sm" style={{ color: "#8892a4" }}>/month</span></div></div>
                  <ul className="space-y-3">{["10 summaries per month", "Basic notes editor", "3 channels"].map(f => <li key={f} className="flex items-center gap-2 text-sm" style={{ color: "#8892a4" }}><Check className="h-4 w-4 shrink-0" style={{ color: "#00ff87" }} />{f}</li>)}</ul>
                  <Link to={user ? "/app-subscription" : "/auth?redirect=subscription"}><Button variant="outline" className="w-full border-[#1e2535] text-[#f0f4ff] bg-transparent hover:bg-[#1e2535]">Get Started Free</Button></Link>
                </div>
                <div className="rounded-xl p-6 space-y-5 relative" style={{ background: "#111827", border: "2px solid #00ff87" }}>
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-semibold" style={{ background: "#00ff87", color: "#0a0d14" }}>Most Popular</div>
                  <div><h3 className="text-xl font-bold" style={{ color: "#f0f4ff" }}>Pro</h3><div className="mt-2"><span className="text-4xl font-bold" style={{ color: "#f0f4ff" }}>$9</span><span className="text-sm" style={{ color: "#8892a4" }}>/month</span></div></div>
                  <ul className="space-y-3">{["Unlimited summaries", "Full rich text notes editor", "Unlimited channels", "Full history forever"].map(f => <li key={f} className="flex items-center gap-2 text-sm" style={{ color: "#8892a4" }}><Check className="h-4 w-4 shrink-0" style={{ color: "#00ff87" }} />{f}</li>)}</ul>
                  <Link to={user ? "/app-subscription" : "/auth?redirect=subscription"}><Button className="w-full font-semibold text-[#0a0d14]" style={{ background: "#00ff87" }}>Start Pro <ChevronRight className="h-4 w-4 ml-1" /></Button></Link>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 50% 60% at 50% 50%, rgba(0,255,135,0.06) 0%, transparent 70%)" }} />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Start Learning Smarter<br /><span style={{ color: "#00ff87" }}>Today</span>
          </h2>
          <p className="max-w-lg mx-auto mb-8" style={{ color: "#8892a4" }}>Join entrepreneurs who use VidMind to turn YouTube videos into actionable business insights.</p>
          <Link to="/auth"><Button size="lg" className="h-13 px-10 text-base font-semibold gap-2 text-[#0a0d14]" style={{ background: "#00ff87" }}>Get Started Free <ChevronRight className="h-5 w-5" /></Button></Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4" style={{ borderTop: "1px solid #1e2535" }}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/favicon.ico" alt="VidMind" className="h-5 w-5" />
            <span className="text-sm" style={{ color: "#8892a4" }}>Learn faster with AI</span>
          </div>
          <div className="flex items-center gap-5 text-sm">
            <Link to="/privacy-policy" className="transition-colors hover:text-[#00ff87]" style={{ color: "#8892a4" }}>Privacy Policy</Link>
            <Link to="/terms-of-service" className="transition-colors hover:text-[#00ff87]" style={{ color: "#8892a4" }}>Terms of Service</Link>
          </div>
          <p className="text-sm" style={{ color: "#8892a4" }}>© 2025 VidMind. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
