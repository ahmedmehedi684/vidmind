import { useState, useEffect } from "react";
import { 
  Plus, Trash2, Check, Loader2, Target, TrendingUp, Calendar, 
  DollarSign, Clock, Edit2, ChevronRight, Award, Lightbulb
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useUsageLimits } from "@/hooks/use-usage-limits";
import UsageLimitBadge from "@/components/UsageLimitBadge";
import UpgradeLimitModal from "@/components/UpgradeLimitModal";

interface Goal {
  id: string; user_id: string; title: string; description: string;
  target_date: string | null; status: string; plan: string; benefits: string;
  profit_estimate: string; profit_timeline: string; progress_percent: number;
  created_at: string; updated_at: string;
}

const GoalTracker = () => {
  const { user } = useAuth();
  const usageLimits = useUsageLimits("goals");
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);

  // Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [plan, setPlan] = useState("");
  const [benefits, setBenefits] = useState("");
  const [profitEstimate, setProfitEstimate] = useState("");
  const [profitTimeline, setProfitTimeline] = useState("");
  const [progressValue, setProgressValue] = useState(0);

  useEffect(() => { if (user) loadGoals(); }, [user]);

  const loadGoals = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await supabase.from("goals").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (data) setGoals(data as unknown as Goal[]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const activeGoals = goals.filter(g => g.status === "active");
  const completedGoals = goals.filter(g => g.status === "completed");

  const openAdd = () => {
    setEditGoal(null);
    setTitle(""); setDescription(""); setTargetDate(""); setPlan("");
    setBenefits(""); setProfitEstimate(""); setProfitTimeline(""); setProgressValue(0);
    setDialogOpen(true);
  };

  const openEdit = (goal: Goal) => {
    setEditGoal(goal);
    setTitle(goal.title); setDescription(goal.description); setTargetDate(goal.target_date || "");
    setPlan(goal.plan); setBenefits(goal.benefits); setProfitEstimate(goal.profit_estimate);
    setProfitTimeline(goal.profit_timeline); setProgressValue(goal.progress_percent);
    setDialogOpen(true);
  };

  const saveGoal = async () => {
    if (!title.trim() || !user) return;
    const goalData: any = {
      user_id: user.id, title: title.trim(), description: description.trim(),
      target_date: targetDate || null, plan: plan.trim(), benefits: benefits.trim(),
      profit_estimate: profitEstimate.trim(), profit_timeline: profitTimeline.trim(),
      progress_percent: progressValue, status: progressValue >= 100 ? "completed" : "active",
      updated_at: new Date().toISOString(),
    };
    try {
      if (editGoal) {
        const { error } = await supabase.from("goals").update(goalData).eq("id", editGoal.id);
        if (error) throw error;
        setGoals(goals.map(g => g.id === editGoal.id ? { ...g, ...goalData } : g));
        toast.success("Goal updated!");
      } else {
        const { data, error } = await supabase.from("goals").insert(goalData).select().single();
        if (error) throw error;
        if (data) setGoals([data as unknown as Goal, ...goals]);
        toast.success("Goal created!");
      }
      setDialogOpen(false);
    } catch (e) { toast.error("Failed to save goal"); }
  };

  const deleteGoal = async (id: string) => {
    try {
      await supabase.from("goals").delete().eq("id", id);
      setGoals(goals.filter(g => g.id !== id));
      toast.success("Goal deleted!");
    } catch (e) { toast.error("Failed to delete"); }
  };

  const updateProgress = async (goal: Goal, value: number) => {
    const status = value >= 100 ? "completed" : "active";
    try {
      await supabase.from("goals").update({ progress_percent: value, status }).eq("id", goal.id);
      setGoals(goals.map(g => g.id === goal.id ? { ...g, progress_percent: value, status } : g));
    } catch (e) { toast.error("Failed to update"); }
  };

  const getDaysLeft = (date: string | null) => {
    if (!date) return null;
    const diff = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" /> Goal Tracker
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{activeGoals.length} active · {completedGoals.length} completed</p>
        </div>
        <Button onClick={openAdd} className="gap-2"><Plus className="h-4 w-4" /> New Goal</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6 text-center"><Target className="h-8 w-8 text-primary mx-auto mb-2" /><p className="text-3xl font-bold">{goals.length}</p><p className="text-xs text-muted-foreground">Total Goals</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><TrendingUp className="h-8 w-8 text-green-400 mx-auto mb-2" /><p className="text-3xl font-bold">{activeGoals.length}</p><p className="text-xs text-muted-foreground">Active</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><Award className="h-8 w-8 text-amber-400 mx-auto mb-2" /><p className="text-3xl font-bold">{completedGoals.length}</p><p className="text-xs text-muted-foreground">Completed</p></CardContent></Card>
      </div>

      {/* Goals */}
      {goals.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No goals yet. Start setting your goals!</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {goals.map(goal => {
            const daysLeft = getDaysLeft(goal.target_date);
            const isExpanded = expandedGoal === goal.id;
            return (
              <Card key={goal.id} className={`transition-all hover:border-primary/30 ${goal.status === "completed" ? "border-green-500/30" : ""}`}>
                <CardContent className="py-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}>
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <h3 className="font-bold text-foreground text-lg">{goal.title}</h3>
                        <Badge variant={goal.status === "completed" ? "default" : "secondary"} className="text-xs">
                          {goal.status === "completed" ? "✅ Completed" : "🎯 Active"}
                        </Badge>
                        {daysLeft !== null && daysLeft > 0 && (
                          <Badge variant="outline" className="text-xs gap-1"><Clock className="h-3 w-3" />{daysLeft} days left</Badge>
                        )}
                      </div>
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Progress</span><span>{goal.progress_percent}%</span>
                        </div>
                        <Progress value={goal.progress_percent} className="h-2" />
                      </div>
                      {goal.description && <p className="text-sm text-muted-foreground">{goal.description}</p>}

                      {isExpanded && (
                        <div className="mt-4 space-y-3 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                          {goal.plan && (
                            <div className="p-3 rounded-lg bg-muted/30 border">
                              <h4 className="font-semibold text-sm text-foreground flex items-center gap-2 mb-1"><Lightbulb className="h-4 w-4 text-amber-400" /> Plan</h4>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{goal.plan}</p>
                            </div>
                          )}
                          {goal.benefits && (
                            <div className="p-3 rounded-lg bg-muted/30 border">
                              <h4 className="font-semibold text-sm text-foreground flex items-center gap-2 mb-1"><Award className="h-4 w-4 text-green-400" /> Benefits</h4>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{goal.benefits}</p>
                            </div>
                          )}
                          {(goal.profit_estimate || goal.profit_timeline) && (
                            <div className="p-3 rounded-lg bg-muted/30 border">
                              <h4 className="font-semibold text-sm text-foreground flex items-center gap-2 mb-1"><DollarSign className="h-4 w-4 text-primary" /> Profit Analysis</h4>
                              {goal.profit_estimate && <p className="text-sm text-muted-foreground">Estimate: {goal.profit_estimate}</p>}
                              {goal.profit_timeline && <p className="text-sm text-muted-foreground">Timeline: {goal.profit_timeline}</p>}
                            </div>
                          )}
                          <div className="pt-2">
                            <Label className="text-xs mb-2 block">Update Progress</Label>
                            <Slider value={[goal.progress_percent]} onValueChange={([v]) => updateProgress(goal, v)} max={100} step={5} className="w-full" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(goal)}><Edit2 className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteGoal(goal.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editGoal ? "Edit Goal" : "New Goal"}</DialogTitle>
            <DialogDescription className="sr-only">Goal form</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>Goal Title *</Label><Input placeholder="What do you want to achieve?" value={title} onChange={e => setTitle(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea placeholder="Describe your goal..." value={description} onChange={e => setDescription(e.target.value)} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Target Date</Label><Input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} /></div>
              <div className="space-y-1.5">
                <Label>Progress ({progressValue}%)</Label>
                <Slider value={[progressValue]} onValueChange={([v]) => setProgressValue(v)} max={100} step={5} />
              </div>
            </div>
            <div className="space-y-1.5"><Label>Plan - How will you achieve this?</Label><Textarea placeholder="Step by step plan..." value={plan} onChange={e => setPlan(e.target.value)} rows={3} /></div>
            <div className="space-y-1.5"><Label>Benefits - Who will it help? How?</Label><Textarea placeholder="How will this benefit you and others..." value={benefits} onChange={e => setBenefits(e.target.value)} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Profit Estimate</Label><Input placeholder="e.g., $5000/month" value={profitEstimate} onChange={e => setProfitEstimate(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Profit Timeline</Label><Input placeholder="e.g., 6 months" value={profitTimeline} onChange={e => setProfitTimeline(e.target.value)} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveGoal} disabled={!title.trim()} className="gap-2"><Check className="h-4 w-4" /> {editGoal ? "Update" : "Create"} Goal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GoalTracker;
