import { useState, useEffect } from "react";
import { Users, FileText, CreditCard, TrendingUp, Activity, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

interface Stats {
  totalUsers: number;
  totalSummaries: number;
  activeSubscriptions: number;
  totalRevenue: number;
  recentSignups: { email: string; created_at: string }[];
  summaryTrend: { date: string; count: number }[];
  userGrowth: { date: string; count: number }[];
  subscriptionBreakdown: { name: string; value: number }[];
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--muted-foreground))", "#f59e0b", "#ef4444"];

const AdminAnalytics = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [usersRes, summariesRes, subsRes, ordersRes] = await Promise.all([
        supabase.from("profiles").select("id, email, created_at"),
        supabase.from("summaries").select("id, created_at"),
        supabase.from("subscriptions").select("id, status, plan_id, created_at"),
        supabase.from("payment_orders").select("id, amount, status, created_at").eq("status", "confirmed"),
      ]);

      const users = usersRes.data || [];
      const summaries = summariesRes.data || [];
      const subs = subsRes.data || [];
      const orders = ordersRes.data || [];

      // Summary trend (last 14 days)
      const summaryTrend: { date: string; count: number }[] = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        const count = summaries.filter(s => s.created_at.startsWith(dateStr)).length;
        summaryTrend.push({ date: d.toLocaleDateString("en", { month: "short", day: "numeric" }), count });
      }

      // User growth (last 14 days)
      const userGrowth: { date: string; count: number }[] = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        const count = users.filter(u => (u as any).created_at.startsWith(dateStr)).length;
        userGrowth.push({ date: d.toLocaleDateString("en", { month: "short", day: "numeric" }), count });
      }

      // Subscription breakdown
      const active = subs.filter(s => (s as any).status === "active").length;
      const pending = subs.filter(s => (s as any).status === "pending").length;
      const expired = subs.filter(s => (s as any).status === "expired").length;
      const noSub = users.length - subs.length;

      const totalRevenue = orders.reduce((sum, o) => sum + Number((o as any).amount || 0), 0);

      // Recent signups (last 10)
      const recentSignups = users
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10)
        .map((u: any) => ({ email: u.email || "N/A", created_at: u.created_at }));

      setStats({
        totalUsers: users.length,
        totalSummaries: summaries.length,
        activeSubscriptions: active,
        totalRevenue,
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

  if (loading || !stats) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
        <Activity className="h-6 w-6 text-primary" /> Analytics Dashboard
      </h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <div><p className="text-sm text-muted-foreground">Total Summaries</p><p className="text-3xl font-bold text-foreground mt-1">{stats.totalSummaries}</p></div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center"><FileText className="h-6 w-6 text-primary" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">Active Subscriptions</p><p className="text-3xl font-bold text-foreground mt-1">{stats.activeSubscriptions}</p></div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center"><CreditCard className="h-6 w-6 text-primary" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">Total Revenue</p><p className="text-3xl font-bold text-foreground mt-1">৳{stats.totalRevenue}</p></div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center"><TrendingUp className="h-6 w-6 text-primary" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Summary Trend (Last 14 Days)</CardTitle></CardHeader>
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
          <CardHeader><CardTitle className="text-base">User Growth (Last 14 Days)</CardTitle></CardHeader>
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
