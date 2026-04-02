import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, StickyNote, Youtube, PlayCircle, ChevronRight, Loader2, Clock, ListChecks, Target, DollarSign, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
  const [goalStats, setGoalStats] = useState({ active: 0, completed: 0 });
  const [moneyStats, setMoneyStats] = useState({ income: 0, expense: 0 });

  useEffect(() => {
    if (user) loadDashboard();
  }, [user]);

  const loadDashboard = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const [summariesRes, notesRes, channelsRes, weekRes, profileRes, tasksRes, goalsRes, txRes] = await Promise.all([
        supabase.from("summaries").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("admin_notes").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("channels").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("summaries").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", oneWeekAgo.toISOString()),
        supabase.from("profiles").select("name").eq("id", user.id).single(),
        supabase.from("tasks").select("id, status").eq("user_id", user.id).is("parent_task_id", null),
        supabase.from("goals").select("id, status").eq("user_id", user.id),
        supabase.from("transactions").select("type, amount").eq("user_id", user.id),
      ]);

      setStats({
        summaries: summariesRes.count || 0,
        notes: notesRes.count || 0,
        channels: channelsRes.count || 0,
        thisWeek: weekRes.count || 0,
      });

      if (profileRes.data) setProfileName((profileRes.data as any).name || "");

      // Task stats
      const taskData = (tasksRes.data || []) as any[];
      setTaskStats({ total: taskData.length, done: taskData.filter((t: any) => t.status === "done").length });

      // Goal stats
      const goalData = (goalsRes.data || []) as any[];
      setGoalStats({ active: goalData.filter((g: any) => g.status === "active").length, completed: goalData.filter((g: any) => g.status === "completed").length });

      // Money stats
      const txData = (txRes.data || []) as any[];
      const income = txData.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + Number(t.amount), 0);
      const expense = txData.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + Number(t.amount), 0);
      setMoneyStats({ income, expense });

      const { data: recent } = await supabase
        .from("summaries")
        .select("id, main_story, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);
      if (recent) setRecentSummaries(recent);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const displayName = profileName || user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
  const initials = displayName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Welcome */}
      <div className="flex items-center gap-4">
        <Avatar className="h-14 w-14">
          <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Welcome back, <span className="text-primary">{displayName}</span>!
          </h1>
          <p className="text-muted-foreground text-sm mt-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            আপনার learning journey চালিয়ে যান
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
              <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {stat.label}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Task, Goal, Money Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Task Progress */}
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

        {/* Goals */}
        <Card className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => navigate("/app-goals")}>
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Goals</h3>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex gap-4">
              <div className="text-center flex-1"><p className="text-2xl font-bold text-foreground">{goalStats.active}</p><p className="text-xs text-muted-foreground">Active</p></div>
              <div className="text-center flex-1"><p className="text-2xl font-bold text-primary">{goalStats.completed}</p><p className="text-xs text-muted-foreground">Done</p></div>
            </div>
          </CardContent>
        </Card>

        {/* Money */}
        <Card className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => navigate("/app-money")}>
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary" /> Money</h3>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex gap-4">
              <div className="text-center flex-1"><p className="text-lg font-bold text-green-400">৳{moneyStats.income.toLocaleString()}</p><p className="text-xs text-muted-foreground">Income</p></div>
              <div className="text-center flex-1"><p className="text-lg font-bold text-red-400">৳{moneyStats.expense.toLocaleString()}</p><p className="text-xs text-muted-foreground">Expense</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Open Summarizer Button */}
      <Button
        size="lg"
        className="w-full h-14 text-lg font-semibold gap-2"
        onClick={() => navigate("/app-summarizer")}
      >
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
            <Card
              key={item.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => navigate("/app-history")}
            >
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
