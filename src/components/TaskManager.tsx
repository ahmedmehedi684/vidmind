import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Plus, Trash2, Check, X,
  Loader2, StickyNote, Calendar as CalendarIcon, Timer, ListChecks,
  Sun, Brain, Briefcase, Moon, Headphones, Heart, Edit2,
  Bell, Home, BookOpen, Coffee, Dumbbell, Music, ShoppingCart,
  Utensils, Plane, Laptop, Gamepad2, Palette, Camera, Mic,
  GraduationCap, Stethoscope, Car, MapPin, Phone, Mail,
  Star, Zap, Shield, Flame, Cloud, Flower2, HandHeart,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Task {
  id: string; user_id: string; parent_task_id: string | null;
  title: string; description: string; category: string; priority: string;
  status: string; due_date: string | null; due_time: string | null;
  estimated_minutes: number | null; notes: string; sort_order: number;
  created_at: string; updated_at: string;
}

const CATEGORIES = [
  { id: "Personal", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { id: "Work", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  { id: "Health", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  { id: "Shopping", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { id: "Spiritual + Body", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  { id: "Learning", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
  { id: "Deep Work", color: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30" },
  { id: "Rest + Recharge", color: "bg-teal-500/20 text-teal-400 border-teal-500/30" },
  { id: "Podcast", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { id: "Evening + Family", color: "bg-pink-500/20 text-pink-400 border-pink-500/30" },
  { id: "Prayer", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
];

const TASK_ICONS = [
  { icon: Bell, label: "Alarm" }, { icon: Home, label: "Home" }, { icon: BookOpen, label: "Read" },
  { icon: Coffee, label: "Break" }, { icon: Dumbbell, label: "Exercise" }, { icon: Music, label: "Music" },
  { icon: ShoppingCart, label: "Shop" }, { icon: Utensils, label: "Food" }, { icon: Plane, label: "Travel" },
  { icon: Laptop, label: "Code" }, { icon: Gamepad2, label: "Game" }, { icon: Palette, label: "Design" },
  { icon: Camera, label: "Photo" }, { icon: Mic, label: "Record" }, { icon: GraduationCap, label: "Study" },
  { icon: Stethoscope, label: "Health" }, { icon: Car, label: "Drive" }, { icon: MapPin, label: "Location" },
  { icon: Phone, label: "Call" }, { icon: Mail, label: "Email" }, { icon: Star, label: "Star" },
  { icon: Zap, label: "Quick" }, { icon: Shield, label: "Security" }, { icon: Flame, label: "Fire" },
  { icon: Cloud, label: "Cloud" }, { icon: Flower2, label: "Nature" }, { icon: HandHeart, label: "Prayer" },
  { icon: Brain, label: "Think" }, { icon: Briefcase, label: "Work" }, { icon: Heart, label: "Love" },
  { icon: Headphones, label: "Listen" }, { icon: Sun, label: "Morning" }, { icon: Moon, label: "Night" },
  { icon: ListChecks, label: "Tasks" }, { icon: StickyNote, label: "Note" }, { icon: Timer, label: "Timer" },
];

const ICON_COLORS = [
  "bg-rose-400/20 text-rose-400", "bg-amber-400/20 text-amber-400", "bg-green-400/20 text-green-400",
  "bg-blue-400/20 text-blue-400", "bg-purple-400/20 text-purple-400", "bg-pink-400/20 text-pink-400",
  "bg-cyan-400/20 text-cyan-400", "bg-orange-400/20 text-orange-400",
];

const DURATIONS = [
  { label: "1 min", value: 1 }, { label: "5 min", value: 5 }, { label: "15 min", value: 15 },
  { label: "30 min", value: 30 }, { label: "50 min", value: 50 }, { label: "1 hr", value: 60 },
  { label: "2 hr", value: 120 }, { label: "3 hr", value: 180 },
];

const PRIORITIES = [
  { id: "high", label: "High", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  { id: "medium", label: "Medium", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { id: "low", label: "Low", color: "bg-green-500/20 text-green-400 border-green-500/30" },
];

const formatDateKey = (date: Date) => format(date, "yyyy-MM-dd");

const getTaskIcon = (title: string, iconIndex?: number) => {
  const t = title.toLowerCase();
  if (iconIndex !== undefined && iconIndex >= 0 && iconIndex < TASK_ICONS.length) return TASK_ICONS[iconIndex];
  if (t.includes("wake") || t.includes("alarm")) return TASK_ICONS[0];
  if (t.includes("prayer") || t.includes("salah") || t.includes("namaz") || t.includes("tahajjud") || t.includes("dua")) return TASK_ICONS[26];
  if (t.includes("quran") || t.includes("read") || t.includes("book") || t.includes("tilawat") || t.includes("tiluaot")) return TASK_ICONS[2];
  if (t.includes("exercise") || t.includes("gym") || t.includes("workout")) return TASK_ICONS[4];
  if (t.includes("code") || t.includes("dev") || t.includes("program")) return TASK_ICONS[9];
  if (t.includes("study") || t.includes("learn") || t.includes("class")) return TASK_ICONS[14];
  if (t.includes("cook") || t.includes("food") || t.includes("eat") || t.includes("lunch") || t.includes("dinner") || t.includes("breakfast")) return TASK_ICONS[7];
  if (t.includes("shop") || t.includes("buy")) return TASK_ICONS[6];
  if (t.includes("call") || t.includes("phone")) return TASK_ICONS[18];
  if (t.includes("email") || t.includes("mail")) return TASK_ICONS[19];
  if (t.includes("music") || t.includes("song")) return TASK_ICONS[5];
  if (t.includes("podcast") || t.includes("listen")) return TASK_ICONS[30];
  if (t.includes("sleep") || t.includes("rest") || t.includes("nap") || t.includes("night")) return TASK_ICONS[32];
  if (t.includes("morning") || t.includes("fajr")) return TASK_ICONS[31];
  if (t.includes("work") || t.includes("office") || t.includes("meeting")) return TASK_ICONS[28];
  if (t.includes("home") || t.includes("house") || t.includes("clean")) return TASK_ICONS[1];
  if (t.includes("break") || t.includes("coffee") || t.includes("tea")) return TASK_ICONS[3];
  if (t.includes("travel") || t.includes("trip")) return TASK_ICONS[8];
  if (t.includes("family")) return TASK_ICONS[29];
  return TASK_ICONS[33];
};

const getIconColor = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes("prayer") || t.includes("quran") || t.includes("tahajjud") || t.includes("tilawat") || t.includes("tiluaot")) return ICON_COLORS[1];
  if (t.includes("wake") || t.includes("alarm")) return ICON_COLORS[0];
  if (t.includes("exercise") || t.includes("gym")) return ICON_COLORS[2];
  if (t.includes("work") || t.includes("code") || t.includes("dev")) return ICON_COLORS[4];
  if (t.includes("study") || t.includes("learn")) return ICON_COLORS[3];
  if (t.includes("family") || t.includes("love")) return ICON_COLORS[5];
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = title.charCodeAt(i) + ((hash << 5) - hash);
  return ICON_COLORS[Math.abs(hash) % ICON_COLORS.length];
};

const TaskManager = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [selectedIconIdx, setSelectedIconIdx] = useState<number | undefined>(undefined);

  // Confirmation dialog
  const [confirmTask, setConfirmTask] = useState<Task | null>(null);

  // Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Personal");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState(formatDateKey(new Date()));
  const [dueTime, setDueTime] = useState("09:00");
  const [dueEndTime, setDueEndTime] = useState("10:00");
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | null>(60);
  const [notes, setNotes] = useState("");
  const [isDaily, setIsDaily] = useState(false);

  // Subtask form
  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [subTitle, setSubTitle] = useState("");
  const [subParentId, setSubParentId] = useState<string | null>(null);

  // Filter
  const [filterCategory, setFilterCategory] = useState("All");

  // Calendar
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  useEffect(() => { if (user) loadTasks(); }, [user]);

  const loadTasks = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await supabase.from("tasks").select("*").eq("user_id", user.id).order("sort_order").order("due_time", { ascending: true }).order("created_at", { ascending: false });
      if (data) setTasks(data as unknown as Task[]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const parentTasks = tasks.filter(t => !t.parent_task_id);
  const getSubtasks = (parentId: string) => tasks.filter(t => t.parent_task_id === parentId);

  const selectedDateStr = formatDateKey(selectedDate);

  const tasksForDate = parentTasks.filter(t => {
    if (t.notes?.includes("[DAILY]")) return true;
    return t.due_date === selectedDateStr;
  });

  const filteredTasks = tasksForDate.filter(t => {
    if (filterCategory !== "All" && t.category !== filterCategory) return false;
    return true;
  }).sort((a, b) => {
    if (a.due_time && b.due_time) return a.due_time.localeCompare(b.due_time);
    if (a.due_time) return -1;
    if (b.due_time) return 1;
    return 0;
  });

  const isTaskDoneForDate = (task: Task) => {
    if (task.notes?.includes("[DAILY]")) {
      return task.status === "done" && task.due_date === selectedDateStr;
    }
    return task.status === "done";
  };

  const doneTasks = tasksForDate.filter(t => isTaskDoneForDate(t)).length;
  const totalForDate = tasksForDate.length;
  const donePercent = totalForDate > 0 ? Math.round((doneTasks / totalForDate) * 100) : 0;
  const undonePercent = 100 - donePercent;

  const openAddDialog = () => {
    setEditTask(null); setTitle(""); setDescription(""); setCategory("Personal");
    setPriority("medium"); setDueDate(selectedDateStr); setDueTime("09:00");
    setDueEndTime("10:00"); setEstimatedMinutes(60); setNotes(""); setIsDaily(false);
    setSelectedIconIdx(undefined); setDialogOpen(true);
  };

  const openEditDialog = (task: Task) => {
    setEditTask(task); setTitle(task.title); setDescription(task.description);
    setCategory(task.category); setPriority(task.priority);
    setDueDate(task.due_date || selectedDateStr); setDueTime(task.due_time || "09:00");
    setEstimatedMinutes(task.estimated_minutes || 60); setNotes(task.notes?.replace("[DAILY]", "").trim() || "");
    setIsDaily(task.notes?.includes("[DAILY]") || false);
    setSelectedIconIdx(undefined);
    if (task.due_time && task.estimated_minutes) {
      const [h, m] = task.due_time.split(":").map(Number);
      const end = new Date(2000, 0, 1, h, m + task.estimated_minutes);
      setDueEndTime(`${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`);
    } else {
      setDueEndTime("10:00");
    }
    setDialogOpen(true);
  };

  const saveTask = async () => {
    if (!title.trim() || !user) return;
    const finalNotes = isDaily ? `[DAILY] ${notes.trim()}` : notes.trim();
    const taskData: any = {
      user_id: user.id, title: title.trim(), description: description.trim(),
      category, priority, status: editTask?.status || "todo",
      due_date: dueDate || null, due_time: dueTime || null,
      estimated_minutes: estimatedMinutes, notes: finalNotes,
      parent_task_id: null, updated_at: new Date().toISOString(),
    };
    try {
      if (editTask) {
        const { error } = await supabase.from("tasks").update(taskData).eq("id", editTask.id);
        if (error) throw error;
        setTasks(tasks.map(t => t.id === editTask.id ? { ...t, ...taskData } : t));
        toast.success("Task updated!");
      } else {
        const { data, error } = await supabase.from("tasks").insert(taskData).select().single();
        if (error) throw error;
        if (data) setTasks([...tasks, data as unknown as Task]);
        toast.success("Task added!");
      }
      setDialogOpen(false);
    } catch (e) { toast.error("Failed to save task"); console.error(e); }
  };

  // Confirmation-based toggle
  const handleToggleClick = (task: Task) => {
    setConfirmTask(task);
  };

  const handleTaskDecision = async (status: "done" | "todo") => {
    if (!confirmTask) return;
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", confirmTask.id);
      if (error) throw error;
      setTasks((currentTasks) => currentTasks.map((task) => (
        task.id === confirmTask.id ? { ...task, status } : task
      )));
      toast.success(status === "done" ? "Task marked as done." : "Task marked as not done.");
    } catch (e) {
      toast.error("Failed to update task status.");
      console.error(e);
      return;
    }
    setConfirmTask(null);
  };

  const toggleStatus = async (task: Task) => {
    const newStatus = task.status === "done" ? "todo" : "done";
    try {
      await supabase.from("tasks").update({ status: newStatus, updated_at: new Date().toISOString() }).eq("id", task.id);
      setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    } catch (e) { toast.error("Failed to update"); }
  };

  const deleteTask = async (id: string) => {
    try {
      await supabase.from("tasks").delete().eq("id", id);
      setTasks(tasks.filter(t => t.id !== id && t.parent_task_id !== id));
      toast.success("Deleted!");
    } catch (e) { toast.error("Failed to delete"); }
  };

  const addSubtask = async () => {
    if (!subTitle.trim() || !user || !subParentId) return;
    const parent = tasks.find(t => t.id === subParentId);
    try {
      const { data, error } = await supabase.from("tasks").insert({
        user_id: user.id, title: subTitle.trim(), parent_task_id: subParentId,
        category: parent?.category || "Personal", priority: parent?.priority || "medium",
      }).select().single();
      if (error) throw error;
      if (data) setTasks([...tasks, data as unknown as Task]);
      setSubDialogOpen(false); setSubTitle("");
      toast.success("Subtask added!");
    } catch (e) { toast.error("Failed to add subtask"); }
  };

  const formatTime12 = (time: string) => {
    if (!time) return "";
    const [h, m] = time.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${String(hour).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            <span className="text-primary">To-do</span> List
          </h2>
          <p className="text-sm text-muted-foreground">{format(selectedDate, "EEEE, MMMM d, yyyy")}</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="min-w-[220px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date);
                    setDatePickerOpen(false);
                  }
                }}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          <Badge variant="outline" className="text-sm px-3 py-1">
            {doneTasks}/{totalForDate} done
          </Badge>
        </div>
      </div>

      {/* Progress Bar — Horizontal Done vs Undone */}
      {totalForDate > 0 && (
        <div className="space-y-1.5 py-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-green-400 font-semibold">✅ Done {donePercent}% ({doneTasks})</span>
            <span className="text-red-400 font-semibold">❌ Not Done {undonePercent}% ({totalForDate - doneTasks})</span>
          </div>
          <div className="flex h-3 w-full rounded-full overflow-hidden bg-muted/30">
            <div
              className="bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
              style={{ width: `${donePercent}%` }}
            />
            <div
              className="bg-gradient-to-r from-red-400 to-red-500 transition-all duration-500"
              style={{ width: `${undonePercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Scrollable task area */}
      <div className="min-h-0 flex-1 overflow-hidden space-y-4 pb-20">
      {/* Category Filter Chips */}
      <div className="flex gap-2 flex-wrap pb-1">
        <button
          onClick={() => setFilterCategory("All")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
            filterCategory === "All" ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"
          }`}
        >
          All
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilterCategory(cat.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              filterCategory === cat.id ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            {cat.id}
          </button>
        ))}
      </div>

      {/* Timeline Tasks */}
      {filteredTasks.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No tasks for this day. Tap + to add one!</CardContent></Card>
      ) : (
        <div className="relative">
          {filteredTasks.map((task, idx) => {
            const taskIcon = getTaskIcon(task.title, undefined);
            const TaskIcon = taskIcon.icon;
            const iconColor = getIconColor(task.title);
            const subtasks = getSubtasks(task.id);
            const isExpanded = expandedTask === task.id;
            const isDone = isTaskDoneForDate(task);
            const endTime = task.due_time && task.estimated_minutes ? (() => {
              const [h, m] = task.due_time!.split(":").map(Number);
              const end = new Date(2000, 0, 1, h, m + task.estimated_minutes!);
              return `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;
            })() : null;

            return (
              <div key={task.id} className="flex gap-4 relative">
                <div className="flex flex-col items-center w-16 shrink-0">
                  {task.due_time && (
                    <span className="text-xs font-semibold text-primary">{formatTime12(task.due_time).split(" ")[0]}</span>
                  )}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center my-1 ${iconColor}`}>
                    <TaskIcon className="h-5 w-5" />
                  </div>
                  {endTime && (
                    <span className="text-xs text-muted-foreground">{formatTime12(endTime).split(" ")[0]}</span>
                  )}
                  {idx < filteredTasks.length - 1 && (
                    <div className="w-0.5 flex-1 min-h-[20px] bg-primary/20 my-1" />
                  )}
                </div>

                <div className="flex-1 pb-6">
                  <div
                    className={`p-3 rounded-xl transition-all cursor-pointer ${isDone ? "opacity-50" : ""} hover:bg-muted/30`}
                    onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          {task.due_time && endTime && (
                            <span className="text-xs text-muted-foreground">
                              {formatTime12(task.due_time)} - {formatTime12(endTime)}
                              {task.estimated_minutes ? ` (${task.estimated_minutes}m)` : ""}
                            </span>
                          )}
                        </div>
                        <h3 className={`font-bold text-base text-foreground ${isDone ? "line-through" : ""}`}>
                          {task.title}
                        </h3>
                        {task.description && <p className="text-sm text-muted-foreground mt-0.5">{task.description}</p>}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <Badge variant="outline" className="text-[10px]">{task.category}</Badge>
                          {task.notes?.includes("[DAILY]") && (
                            <Badge variant="outline" className="text-[10px] gap-1 border-primary/30 text-primary">
                              <RefreshCw className="h-2.5 w-2.5" /> Daily
                            </Badge>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleClick(task); }}
                        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                          isDone
                            ? "border-green-500 bg-green-500 text-white"
                            : task.status === "not_done"
                            ? "border-red-500 bg-red-500 text-white"
                            : "border-muted-foreground/30 hover:border-primary"
                        }`}
                      >
                        {isDone && <Check className="h-4 w-4" />}
                        {task.status === "not_done" && <X className="h-4 w-4" />}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 space-y-2 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                        {subtasks.length > 0 && (
                          <div className="space-y-1.5 border-l-2 border-primary/20 pl-3 ml-1">
                            {subtasks.map(sub => (
                              <div key={sub.id} className="flex items-center gap-2">
                                <Checkbox checked={sub.status === "done"} onCheckedChange={() => toggleStatus(sub)} className="h-4 w-4" />
                                <span className={`text-sm ${sub.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}>{sub.title}</span>
                                <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto" onClick={(e) => { e.stopPropagation(); deleteTask(sub.id); }}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                        {task.notes && !task.notes.startsWith("[DAILY]") && (
                          <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-2">
                            <StickyNote className="h-3 w-3 inline mr-1" />{task.notes}
                          </p>
                        )}
                        <div className="flex gap-2 pt-1">
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={(e) => { e.stopPropagation(); setSubParentId(task.id); setSubTitle(""); setSubDialogOpen(true); }}>
                            <Plus className="h-3 w-3" /> Subtask
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={(e) => { e.stopPropagation(); openEditDialog(task); }}>
                            <Edit2 className="h-3 w-3" /> Edit
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-destructive" onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}>
                            <Trash2 className="h-3 w-3" /> Delete
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      </div>{/* end scrollable task area */}

      {/* FAB */}
      <button
        onClick={openAddDialog}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-105 transition-transform z-50"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Done/Not Done Confirmation Dialog */}
      <Dialog open={!!confirmTask} onOpenChange={(open) => { if (!open) setConfirmTask(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Task Status</DialogTitle>
            <DialogDescription>
              {confirmTask ? `Did you complete "${confirmTask.title}"?` : "Choose the correct status for this task."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="destructive" onClick={() => void handleTaskDecision("not_done" as any)}>
              ❌ Not Done
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => void handleTaskDecision("done")}>
              ✅ Yes, Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Task Details</DialogTitle>
              <Button onClick={saveTask} disabled={!title.trim()} size="sm" className="gap-1">
                {editTask ? "Update" : "Create Task"}
              </Button>
            </div>
            <DialogDescription className="sr-only">Task form</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIconPickerOpen(!iconPickerOpen)}
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${getIconColor(title || "task")}`}
              >
                {(() => { const ic = getTaskIcon(title || "task", selectedIconIdx); const I = ic.icon; return <I className="h-5 w-5" />; })()}
              </button>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Task title..."
                className="text-lg font-semibold border-0 border-b border-muted rounded-none px-0 focus-visible:ring-0"
              />
            </div>

            {iconPickerOpen && (
              <Card className="animate-in fade-in-0 duration-200">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-3">Select Icon</p>
                  <div className="grid grid-cols-6 gap-2">
                    {TASK_ICONS.map((ic, idx) => {
                      const Ic = ic.icon;
                      const isSelected = selectedIconIdx === idx;
                      return (
                        <button
                          key={idx}
                          onClick={() => { setSelectedIconIdx(idx); setIconPickerOpen(false); }}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                            isSelected ? "bg-primary/20 ring-2 ring-primary" : "bg-muted/30 hover:bg-muted"
                          }`}
                        >
                          <Ic className="h-4 w-4 text-muted-foreground" />
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-end mt-2">
                    <Button variant="ghost" size="sm" onClick={() => setIconPickerOpen(false)}>Close</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add description..."
              rows={2}
              className="bg-muted/30 border-0"
            />

            {/* When section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-primary">When?</h4>
              </div>
              <div className="text-center mb-3">
                <p className="text-lg font-bold text-foreground">
                  {formatTime12(dueTime)} - {formatTime12(dueEndTime)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="space-y-1">
                  <Label className="text-xs">Start</Label>
                  <Input type="time" value={dueTime} onChange={e => setDueTime(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">End</Label>
                  <Input type="time" value={dueEndTime} onChange={e => {
                    setDueEndTime(e.target.value);
                    if (dueTime && e.target.value) {
                      const [sh, sm] = dueTime.split(":").map(Number);
                      const [eh, em] = e.target.value.split(":").map(Number);
                      const diff = (eh * 60 + em) - (sh * 60 + sm);
                      if (diff > 0) setEstimatedMinutes(diff);
                    }
                  }} />
                </div>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-auto" />
              </div>
              <div className="flex items-center gap-3 mt-3 p-2 rounded-lg bg-muted/30">
                <RefreshCw className={`h-4 w-4 ${isDaily ? "text-primary" : "text-muted-foreground"}`} />
                <span className="text-sm flex-1">Repeat daily (everyday)</span>
                <button
                  onClick={() => setIsDaily(!isDaily)}
                  className={`w-10 h-5 rounded-full transition-colors ${isDaily ? "bg-primary" : "bg-muted"}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform mx-0.5 ${isDaily ? "translate-x-5" : ""}`} />
                </button>
              </div>
            </div>

            {/* How long */}
            <div>
              <h4 className="font-semibold text-primary mb-3">How long?</h4>
              <div className="flex gap-2 flex-wrap">
                {DURATIONS.map(d => (
                  <button
                    key={d.value}
                    onClick={() => {
                      setEstimatedMinutes(d.value);
                      if (dueTime) {
                        const [h, m] = dueTime.split(":").map(Number);
                        const end = new Date(2000, 0, 1, h, m + d.value);
                        setDueEndTime(`${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`);
                      }
                    }}
                    className={`px-4 py-2 rounded-lg text-sm transition-all ${
                      estimatedMinutes === d.value
                        ? "bg-muted text-foreground font-medium"
                        : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div>
              <h4 className="font-semibold text-primary mb-3">Priority</h4>
              <div className="flex gap-2">
                {PRIORITIES.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setPriority(p.id)}
                    className={`px-5 py-2 rounded-lg text-sm transition-all ${
                      priority === p.id ? "bg-muted text-foreground font-medium" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <h4 className="font-semibold text-primary mb-3">Category</h4>
              <div className="flex gap-2 flex-wrap">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`px-4 py-2 rounded-lg text-sm transition-all ${
                      category === cat.id ? "bg-muted text-foreground font-medium" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    {cat.id}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <h4 className="font-semibold text-primary mb-3">Notes</h4>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add any extra notes here..."
                rows={3}
                className="bg-muted/30 border-0"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Subtask Dialog */}
      <Dialog open={subDialogOpen} onOpenChange={setSubDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Subtask</DialogTitle>
            <DialogDescription className="sr-only">Add subtask form</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Subtask title..." value={subTitle} onChange={e => setSubTitle(e.target.value)} />
          </div>
          <Button onClick={addSubtask} disabled={!subTitle.trim()} className="w-full gap-2 mt-2">
            <Plus className="h-4 w-4" /> Add Subtask
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskManager;
