import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText, StickyNote, Youtube, PlayCircle, ChevronRight, Loader2, Clock,
  ListChecks, Target, DollarSign, TrendingUp, HandCoins, Landmark, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface StatCard {
  label: string;
  value: number;
  icon: React.ElementType;
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ summaries: 0, notes: 0, channels: 0, thisWeek: 0 });
  const [recentSummaries, setRecentSummaries] = useState<{ id: string; main_story: string; created_at: string }[]>([]);
  const [profileName, setProfileName] = useState("");
  const [taskStats, setTaskStats] = useState({ total: 0, done: 0 });
  const [goalStats, setGoalStats] = useState({ active: 0, completed: 0, total: 0 });
  const [moneyStats, setMoneyStats] = useState({ income: 0, expense: 0, investment: 0, loan: 0 });
  const [txData, setTxData] = useState<any[]>([]);

  useEffect(() => { if (user) loadDashboard(); }, [user]);

  const loadDashboard = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const [summariesRes, notesRes, channelsRes, weekRes, profileRes, tasksRes, goalsRes, transRes] = await Promise.all([
        supabase.from("summaries").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("admin_notes").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("channels").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("summaries").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", oneWeekAgo.toISOString()),
        supabase.from("profiles").select("name").eq("id", user.id).single(),
        supabase.from("tasks").select("id, status").eq("user_id", user.id).is("parent_task_id", null),
        supabase.from("goals").select("id, status").eq("user_id", user.id),
        supabase.from("transactions").select("type, amount, transaction_date").eq("user_id", user.id),
      ]);

      setStats({
        summaries: summariesRes.count || 0,
        notes: notesRes.count || 0,
        channels: channelsRes.count || 0,
        thisWeek: weekRes.count || 0,
      });

      if (profileRes.data) setProfileName((profileRes.data as any).name || "");

      const taskData = (tasksRes.data || []) as any[];
      setTaskStats({ total: taskData.length, done: taskData.filter((t: any) => t.status === "done").length });

      const goalData = (goalsRes.data || []) as any[];
      setGoalStats({
        active: goalData.filter((g: any) => g.status === "active").length,
        completed: goalData.filter((g: any) => g.status === "completed").length,
        total: goalData.length,
      });

      const allTx = (transRes.data || []) as any[];
      setTxData(allTx);
      const income = allTx.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + Number(t.amount), 0);
      const expense = allTx.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + Number(t.amount), 0);
      const investment = allTx.filter((t: any) => t.type === "investment").reduce((s: number, t: any) => s + Number(t.amount), 0);
      const loan = allTx.filter((t: any) => t.type === "loan").reduce((s: number, t: any) => s + Number(t.amount), 0);
      setMoneyStats({ income, expense, investment, loan });

      const { data: recent } = await supabase
        .from("summaries")
        .select("id, main_story, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);
      if (recent) setRecentSummaries(recent);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // Chart data - last 6 months
  const chartData = useMemo(() => {
    const now = new Date();
    const months: { name: string; income: number; expense: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthTx = txData.filter((t: any) => {
        const td = new Date(t.transaction_date);
        return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
      });
      months.push({
        name: d.toLocaleDateString("en", { month: "short" }),
        income: monthTx.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + Number(t.amount), 0),
        expense: monthTx.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + Number(t.amount), 0),
      });
    }
    return months;
  }, [txData]);

  const displayName = profileName || user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
  const initials = displayName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
  const formatAmount = (n: number) => "৳" + n.toLocaleString();

  const statCards: StatCard[] = [
    { label: "Total Summaries", value: stats.summaries, icon: FileText },
    { label: "Notes Saved", value: stats.notes, icon: StickyNote },
    { label: "Channels Added", value: stats.channels, icon: Youtube },
    { label: "Videos This Week", value: stats.thisWeek, icon: PlayCircle },
  ];

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("bn-BD", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasLoan = moneyStats.loan > 0;
  const balance = moneyStats.income - moneyStats.expense - moneyStats.investment;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Welcome */}
      <div className="flex items-center gap-4">
        <Avatar className="h-14 w-14">
          <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Welcome back, <span className="text-primary">{displayName}</span>!
          </h1>
          <p className="text-muted-foreground text-sm mt-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Continue your learning journey
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="hover:border-primary/30 transition-colors">
            <CardContent className="pt-6 text-center">
              <stat.icon className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-3xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Task, Goal, Money Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => navigate("/app-tasks")}>
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground flex items-center gap-2"><ListChecks className="h-5 w-5 text-primary" /> Tasks</h3>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex justify-between text-sm text-muted-foreground"><span>{taskStats.done}/{taskStats.total} done</span><span>{taskStats.total > 0 ? Math.round((taskStats.done / taskStats.total) * 100) : 0}%</span></div>
            <Progress value={taskStats.total > 0 ? (taskStats.done / taskStats.total) * 100 : 0} className="h-2" />
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => navigate("/app-goals")}>
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Goals ({goalStats.total})</h3>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex gap-4">
              <div className="text-center flex-1"><p className="text-2xl font-bold text-foreground">{goalStats.active}</p><p className="text-xs text-muted-foreground">Active</p></div>
              <div className="text-center flex-1"><p className="text-2xl font-bold text-primary">{goalStats.completed}</p><p className="text-xs text-muted-foreground">Done</p></div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => navigate("/app-money")}>
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary" /> Money</h3>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center"><p className="text-sm font-bold text-green-400">{formatAmount(moneyStats.income)}</p><p className="text-[10px] text-muted-foreground">Income</p></div>
              <div className="text-center"><p className="text-sm font-bold text-red-400">{formatAmount(moneyStats.expense)}</p><p className="text-[10px] text-muted-foreground">Expense</p></div>
              <div className="text-center"><p className="text-sm font-bold text-blue-400">{formatAmount(moneyStats.investment)}</p><p className="text-[10px] text-muted-foreground">Investment</p></div>
              <div className="text-center">
                <p className={`text-sm font-bold ${balance >= 0 ? "text-green-400" : "text-red-400"}`}>{formatAmount(balance)}</p>
                <p className="text-[10px] text-muted-foreground">Balance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loan Section - only shown if user has loans */}
      {hasLoan && (
        <Card className="border-orange-500/20 cursor-pointer hover:border-orange-500/40 transition-colors" onClick={() => navigate("/app-money")}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground flex items-center gap-2"><HandCoins className="h-5 w-5 text-orange-400" /> Active Loans</h3>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold text-orange-400 mt-2">{formatAmount(moneyStats.loan)}</p>
            <p className="text-xs text-muted-foreground mt-1">Total outstanding loan amount</p>
          </CardContent>
        </Card>
      )}

      {/* Income vs Expense Chart */}
      {chartData.some(d => d.income > 0 || d.expense > 0) && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Income vs Expense</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                <Bar dataKey="income" fill="#4ade80" radius={[4, 4, 0, 0]} name="Income" />
                <Bar dataKey="expense" fill="#f87171" radius={[4, 4, 0, 0]} name="Expense" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Open Summarizer Button */}
      <Button size="lg" className="w-full h-14 text-lg font-semibold gap-2" onClick={() => navigate("/app-summarizer")}>
        Open Summarizer <ChevronRight className="h-5 w-5" />
      </Button>

      {/* Recent Summaries */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" /> Recent Summaries
        </h2>
        {recentSummaries.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              এখনো কোনো summary করা হয়নি। Summarizer ব্যবহার করুন!
            </CardContent>
          </Card>
        ) : (
          recentSummaries.map((item) => (
            <Card key={item.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate("/app-history")}>
              <CardContent className="py-4 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground line-clamp-2 text-sm">{item.main_story}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(item.created_at)}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;
