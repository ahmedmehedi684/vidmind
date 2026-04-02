import { useState, useEffect } from "react";
import { Users, FileText, CreditCard, TrendingUp, Activity, Loader2, Clock, CheckCircle2, XCircle, UsersRound, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

interface Stats {
  totalUsers: number;
  totalSummaries: number;
  activeSubscriptions: number;
  totalRevenue: number;
  pendingOrders: number;
  confirmedOrders: number;
  rejectedOrders: number;
  teamMembers: number;
  recentSignups: { email: string; created_at: string }[];
  summaryTrend: { date: string; count: number }[];
  userGrowth: { date: string; count: number }[];
  subscriptionBreakdown: { name: string; value: number }[];
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--muted-foreground))", "#f59e0b", "#ef4444"];

const AdminAnalytics = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => { loadStats(); }, []);

  const loadStats = async (from?: string, to?: string) => {
    setLoading(true);
    try {
      const [usersRes, summariesRes, subsRes, ordersRes, teamRes] = await Promise.all([
        supabase.from("profiles").select("id, email, created_at"),
        supabase.from("summaries").select("id, created_at"),
        supabase.from("subscriptions").select("id, status, plan_id, created_at"),
        supabase.from("payment_orders").select("id, amount, status, created_at"),
        supabase.from("team_members").select("id"),
      ]);

      let users = usersRes.data || [];
      let summaries = summariesRes.data || [];
      let orders = ordersRes.data || [];

      // Date filter
      if (from) {
        users = users.filter((u: any) => u.created_at >= from);
        summaries = summaries.filter((s: any) => s.created_at >= from);
        orders = orders.filter((o: any) => o.created_at >= from);
      }
      if (to) {
        const toEnd = to + "T23:59:59";
        users = users.filter((u: any) => u.created_at <= toEnd);
        summaries = summaries.filter((s: any) => s.created_at <= toEnd);
        orders = orders.filter((o: any) => o.created_at <= toEnd);
      }

      const subs = subsRes.data || [];
      const confirmedOrders = orders.filter((o: any) => o.status === "confirmed");
      const pendingOrders = orders.filter((o: any) => o.status === "pending");
      const rejectedOrders = orders.filter((o: any) => o.status === "rejected");

      // Summary trend (last 14 days)
      const summaryTrend: { date: string; count: number }[] = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        const count = (summariesRes.data || []).filter((s: any) => s.created_at.startsWith(dateStr)).length;
        summaryTrend.push({ date: d.toLocaleDateString("en", { month: "short", day: "numeric" }), count });
      }

      // User growth (last 14 days)
      const userGrowth: { date: string; count: number }[] = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        const count = (usersRes.data || []).filter((u: any) => u.created_at.startsWith(dateStr)).length;
        userGrowth.push({ date: d.toLocaleDateString("en", { month: "short", day: "numeric" }), count });
      }

      const active = subs.filter((s: any) => s.status === "active").length;
      const pending = subs.filter((s: any) => s.status === "pending").length;
      const expired = subs.filter((s: any) => s.status === "expired").length;
      const noSub = (usersRes.data || []).length - subs.length;

      const totalRevenue = confirmedOrders.reduce((sum, o) => sum + Number((o as any).amount || 0), 0);

      const recentSignups = (usersRes.data || [])
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10)
        .map((u: any) => ({ email: u.email || "N/A", created_at: u.created_at }));

      setStats({
        totalUsers: users.length,
        totalSummaries: summaries.length,
        activeSubscriptions: active,
        totalRevenue,
        pendingOrders: pendingOrders.length,
        confirmedOrders: confirmedOrders.length,
        rejectedOrders: rejectedOrders.length,
        teamMembers: (teamRes.data || []).length,
        recentSignups,
        summaryTrend,
        userGrowth,
        subscriptionBreakdown: [
          { name: "Active", value: active },
          { name: "Pending", value: pending },
          { name: "Expired", value: expired },
          { name: "No Sub", value: Math.max(0, noSub) },
        ].filter(s => s.value > 0),
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleFilter = () => {
    loadStats(dateFrom || undefined, dateTo || undefined);
  };

  if (loading || !stats) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
        <Activity className="h-6 w-6 text-primary" /> Analytics Dashboard
      </h2>

      {/* Date Filter */}
      <div className="flex items-end gap-3 flex-wrap">
        <div className="space-y-1">
          <Label className="text-xs">From</Label>
          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-auto" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">To</Label>
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-auto" />
        </div>
        <button onClick={handleFilter} className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 flex items-center gap-1">
          <Calendar className="h-4 w-4" /> Filter
        </button>
        {(dateFrom || dateTo) && (
          <button onClick={() => { setDateFrom(""); setDateTo(""); loadStats(); }} className="h-10 px-3 rounded-md bg-muted text-muted-foreground text-sm hover:bg-muted/80">
            Clear
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">Total Users</p><p className="text-3xl font-bold text-foreground mt-1">{stats.totalUsers}</p></div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center"><Users className="h-6 w-6 text-primary" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">Summaries</p><p className="text-3xl font-bold text-foreground mt-1">{stats.totalSummaries}</p></div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center"><FileText className="h-6 w-6 text-primary" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">Active Subs</p><p className="text-3xl font-bold text-foreground mt-1">{stats.activeSubscriptions}</p></div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center"><CreditCard className="h-6 w-6 text-primary" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">Revenue</p><p className="text-3xl font-bold text-foreground mt-1">৳{stats.totalRevenue}</p></div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center"><TrendingUp className="h-6 w-6 text-primary" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment & Team Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-amber-500/30">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center"><Clock className="h-5 w-5 text-amber-500" /></div>
              <div><p className="text-xs text-muted-foreground">Pending</p><p className="text-2xl font-bold text-amber-500">{stats.pendingOrders}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-500/30">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center"><CheckCircle2 className="h-5 w-5 text-green-500" /></div>
              <div><p className="text-xs text-muted-foreground">Confirmed</p><p className="text-2xl font-bold text-green-500">{stats.confirmedOrders}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-500/30">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center"><XCircle className="h-5 w-5 text-red-500" /></div>
              <div><p className="text-xs text-muted-foreground">Rejected</p><p className="text-2xl font-bold text-red-500">{stats.rejectedOrders}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-500/30">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center"><UsersRound className="h-5 w-5 text-blue-500" /></div>
              <div><p className="text-xs text-muted-foreground">Team</p><p className="text-2xl font-bold text-blue-500">{stats.teamMembers}</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Summary Trend (14 Days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.summaryTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">User Growth (14 Days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={stats.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Subscription Breakdown</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center">
            {stats.subscriptionBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={stats.subscriptionBreakdown} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {stats.subscriptionBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground text-sm">No subscription data</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Recent Signups</CardTitle></CardHeader>
          <CardContent>
            {stats.recentSignups.length === 0 ? <p className="text-muted-foreground text-sm">No users yet</p> : (
              <div className="space-y-2">
                {stats.recentSignups.map((u, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                    <span className="text-sm font-medium text-foreground truncate">{u.email}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{new Date(u.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalytics;
