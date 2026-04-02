import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Users, FileText, Loader2, MessageSquare, KeyRound, ChevronRight,
  RefreshCw, Shield, Settings, Clock, StickyNote, LogOut, Plus, Trash2,
  Eye, EyeOff, ExternalLink, Check, MessageCircle, Pencil, Youtube, Search,
  Link as LinkIcon, User, Mail, Lock, Save, LayoutGrid, Image, Home, Sparkles, TrendingUp, Activity,
  ListChecks, Target, DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getSettings, saveSettings, saveSettingsToDb, PROVIDERS, getProviderConfig, type AIProvider, type AppSettings } from "@/lib/settings";
import { addToHistory, updateHistoryConversation } from "@/lib/history";
import { useAuth } from "@/contexts/AuthContext";
import FollowUpSection from "@/components/FollowUpSection";
import RichTextEditor from "@/components/RichTextEditor";
import ChannelManager, { type Channel } from "@/components/ChannelManager";
import TaskManager from "@/components/TaskManager";
import GoalTracker from "@/components/GoalTracker";
import MoneyManager from "@/components/MoneyManager";
import AdminPayments from "@/components/AdminPayments";
import AdminSupport from "@/components/AdminSupport";
import AdminAnalytics from "@/components/AdminAnalytics";
import AdminUserManagement from "@/components/AdminUserManagement";
import AdminNotifications from "@/components/AdminNotifications";
import AdminPaymentMethods from "@/components/AdminPaymentMethods";
import AdminSubscriptionPlans from "@/components/AdminSubscriptionPlans";
import AdminTeamManagement from "@/components/AdminTeamManagement";

interface SummaryRow {
  id: string; user_id: string; input_type: string; input_value: string;
  main_story: string; bullet_points: string[]; how_to_apply: { title: string; detail: string }[];
  conversation: { role: string; content: string }[] | null; created_at: string;
}

interface UserInfo {
  id: string; email: string; created_at: string; summaryCount: number; hasApiKey: boolean; isAdmin: boolean;
}

interface SummaryResult { mainStory: string; bulletPoints: string[]; howToApply: { title: string; detail: string }[]; }

interface AdminNote {
  id: string; user_id: string; title: string; text: string;
  channel_id: string | null; video_url: string; created_at: string;
}

const generateTagsFromTitle = (title: string): string[] => {
  const titleLower = title.toLowerCase();
  const categoryMap: [string[], string][] = [
    [["focus", "concentrat", "distract", "attention"], "Focus"],
    [["habit", "routine", "daily", "morning", "ritual"], "Habits"],
    [["productiv", "efficient", "time manage", "organize"], "Productivity"],
    [["money", "financ", "wealth", "rich", "income", "earn", "salary"], "Finance"],
    [["invest", "stock", "portfolio", "crypto", "trading"], "Investing"],
    [["business", "entrepren", "startup", "company", "founder"], "Business"],
    [["mindset", "mental model", "thinking", "perspective"], "Mindset"],
    [["health", "sleep", "diet", "nutrition", "exercise", "fitness", "workout"], "Health"],
    [["learn", "study", "education", "student", "school", "university", "course"], "Education"],
    [["brain", "neurosci", "cognitive", "memory", "iq"], "Neuroscience"],
    [["motivat", "inspir", "discipline", "willpower", "drive"], "Motivation"],
    [["success", "achiev", "goal", "winner", "win"], "Success"],
    [["skill", "master", "expert", "practice", "talent"], "Skills"],
    [["career", "job", "profession", "interview", "resume", "hire"], "Career"],
    [["leader", "manage", "team", "boss", "ceo"], "Leadership"],
    [["communicat", "speak", "present", "public speak", "social"], "Communication"],
    [["creativ", "innovat", "idea", "design", "art"], "Creativity"],
    [["meditat", "mindful", "calm", "peace", "zen", "yoga"], "Wellness"],
    [["stress", "anxiety", "depress", "mental health", "therapy"], "Mental Health"],
    [["growth", "improve", "self help", "self improv", "personal develop", "better"], "Self Improvement"],
    [["psychology", "behavior", "emotion", "personality"], "Psychology"],
    [["science", "research", "experiment", "data"], "Science"],
    [["tech", "software", "programming", "coding", "developer", "ai", "artificial intellig", "machine learn"], "Technology"],
    [["read", "book", "author", "library", "novel"], "Books"],
    [["relationship", "love", "dating", "marriage", "partner"], "Relationships"],
    [["stoic", "philosophy", "wisdom", "ancient", "marcus aurelius"], "Philosophy"],
    [["youtube", "content creat", "video", "channel", "subscriber"], "Content Creation"],
    [["market", "seo", "brand", "advertis", "sales", "funnel"], "Marketing"],
    [["writing", "write", "blog", "journal", "copywriting"], "Writing"],
    [["minimalis", "simple", "declutter", "essentials"], "Minimalism"],
    [["confidence", "self esteem", "courage", "fear", "bold"], "Confidence"],
    [["network", "connect", "mentor", "community"], "Networking"],
    [["micro", "small", "tiny", "little", "mini"], "Micro Tips"],
    [["game", "gaming", "gamer", "esport", "playstation", "xbox", "nintendo", "steam"], "Gaming"],
    [["music", "song", "sing", "guitar", "piano", "beat", "melody", "album", "concert"], "Music"],
    [["cook", "recipe", "food", "kitchen", "baking", "chef", "meal", "dish"], "Cooking"],
    [["travel", "trip", "tour", "destination", "flight", "hotel", "vacation", "adventure"], "Travel"],
    [["photo", "camera", "portrait", "landscape", "lightroom", "photoshop"], "Photography"],
    [["movie", "film", "cinema", "actor", "director", "netflix", "series", "anime"], "Entertainment"],
    [["sport", "football", "cricket", "basketball", "soccer", "athlete", "gym"], "Sports"],
    [["fashion", "style", "cloth", "outfit", "wear", "dress", "trend"], "Fashion"],
    [["history", "histor", "ancient", "war", "civilization", "empire"], "History"],
    [["language", "english", "bangla", "spanish", "french", "vocab", "grammar"], "Language"],
    [["parent", "child", "baby", "family", "kid", "mom", "dad"], "Parenting"],
    [["real estate", "house", "apartment", "property", "rent", "mortgage"], "Real Estate"],
    [["spiritual", "religion", "god", "prayer", "faith", "islam", "christian", "hindu"], "Spirituality"],
    [["diy", "craft", "handmade", "build", "maker", "project"], "DIY"],
    [["pet", "dog", "cat", "animal", "wildlife"], "Pets & Animals"],
    [["space", "universe", "planet", "nasa", "astronaut", "cosmos", "galaxy"], "Space"],
  ];
  
  const tags: string[] = [];
  for (const [keywords, tag] of categoryMap) {
    if (keywords.some(k => titleLower.includes(k)) && !tags.includes(tag)) {
      tags.push(tag);
    }
  }
  return tags.length > 0 ? tags.slice(0, 5) : ["General"];
};

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [summaries, setSummaries] = useState<SummaryRow[]>([]);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  
  // URL-based tab routing from pathname
  const TAB_MAP: Record<string, string> = {
    "/admin-dashboard": "dashboard",
    "/admin-analytics": "analytics",
    "/admin-user-mgmt": "user-mgmt",
    "/admin-notifications": "notifications",
    "/admin-tasks": "tasks",
    "/admin-goals": "goals",
    "/admin-money": "money",
    "/admin-summarize": "summarize",
    "/admin-users": "users",
    "/admin-summaries": "summaries",
    "/admin-history": "history",
    "/admin-channels": "channels",
    "/admin-notes": "notes",
    "/admin-showcase": "showcase",
    "/admin-profile": "profile",
    "/admin-settings": "settings",
    "/admin-payments": "payments",
    "/admin-subscription-plans": "subscription-plans",
    "/admin-payment-methods": "payment-methods",
    "/admin-support": "support",
    "/admin-team": "team",
  };
  const activeTab = TAB_MAP[location.pathname] || "dashboard";
  const setActiveTab = (tab: string) => {
    const route = Object.entries(TAB_MAP).find(([, v]) => v === tab)?.[0] || "/admin-dashboard";
    navigate(route);
  };

  // Summarize
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [initialConversation, setInitialConversation] = useState<{ role: "user" | "assistant"; content: string }[] | undefined>();

  // Notes
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteChannelId, setNewNoteChannelId] = useState<string>("all");
  const [newNoteVideoUrl, setNewNoteVideoUrl] = useState("");
  const [notesLoading, setNotesLoading] = useState(false);

  // Note popup
  const [selectedNote, setSelectedNote] = useState<AdminNote | null>(null);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [isEditingInDialog, setIsEditingInDialog] = useState(false);
  const [editNoteText, setEditNoteText] = useState("");
  const [editNoteTitle, setEditNoteTitle] = useState("");
  const [editNoteChannelId, setEditNoteChannelId] = useState<string>("all");
  const [editNoteVideoUrl, setEditNoteVideoUrl] = useState("");

  // Channels
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(false);

  // Notes filter
  const [noteFilterChannel, setNoteFilterChannel] = useState<string>("all");
  const [noteSearch, setNoteSearch] = useState("");

  // Settings
  const [settings, setSettingsState] = useState<AppSettings>(getSettings());
  const [showKey, setShowKey] = useState(false);

  // Profile
  const [profileName, setProfileName] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Showcase
  interface ShowcaseItem {
    id: string; title: string; channel_name: string; thumbnail_url: string;
    video_url: string; tags: string[]; display_date: string; sort_order: number; created_at: string;
  }
  const [showcaseItems, setShowcaseItems] = useState<ShowcaseItem[]>([]);
  const [showcaseLoading, setShowcaseLoading] = useState(false);
  const [scTitle, setScTitle] = useState("");
  const [scChannel, setScChannel] = useState("");
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [scThumbnail, setScThumbnail] = useState("");
  const [scVideoUrl, setScVideoUrl] = useState("");
  const [scTags, setScTags] = useState("");
  const [scDate, setScDate] = useState("");
  const [scOrder, setScOrder] = useState(0);
  const [editingShowcase, setEditingShowcase] = useState<ShowcaseItem | null>(null);
  const [showcaseDialogOpen, setShowcaseDialogOpen] = useState(false);

  useEffect(() => { loadData(); loadNotes(); loadChannels(); loadProfile(); loadShowcase(); }, []);

  const loadProfile = async () => {
    if (!user) return;
    try {
      const { data } = await supabase.from("profiles").select("name").eq("id", user.id).single();
      if (data) setProfileName((data as any).name || "");
    } catch (e) { console.error(e); }
    finally { setProfileLoading(false); }
  };

  const loadChannels = async () => {
    setChannelsLoading(true);
    try {
      const { data } = await supabase.from("channels").select("*").order("created_at", { ascending: false });
      if (data) setChannels(data as unknown as Channel[]);
    } catch (e) { console.error(e); }
    finally { setChannelsLoading(false); }
  };

  const loadShowcase = async () => {
    setShowcaseLoading(true);
    try {
      const { data } = await supabase.from("landing_showcase").select("*").order("sort_order", { ascending: true });
      if (data) setShowcaseItems(data as any[]);
    } catch (e) { console.error(e); }
    finally { setShowcaseLoading(false); }
  };

  const uploadThumbnail = useCallback(async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("showcase-thumbnails").upload(fileName, file, { contentType: file.type });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from("showcase-thumbnails").getPublicUrl(fileName);
    return urlData.publicUrl;
  }, []);

  const handleThumbnailDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith("image/")) return;
    setThumbnailUploading(true);
    try {
      const url = await uploadThumbnail(file);
      setScThumbnail(url);
      setThumbnailPreview(URL.createObjectURL(file));
      toast.success("Thumbnail uploaded!");
    } catch (err) { toast.error("Upload failed"); }
    finally { setThumbnailUploading(false); }
  }, [uploadThumbnail]);

  const handleThumbnailFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setThumbnailUploading(true);
    try {
      const url = await uploadThumbnail(file);
      setScThumbnail(url);
      setThumbnailPreview(URL.createObjectURL(file));
      toast.success("Thumbnail uploaded!");
    } catch (err) { toast.error("Upload failed"); }
    finally { setThumbnailUploading(false); }
  }, [uploadThumbnail]);

  const addShowcaseItem = async () => {
    if (!scTitle.trim() || !user) return;
    try {
      const tagsArr = scTags.split(",").map(t => t.trim()).filter(Boolean);
      const { data, error } = await supabase.from("landing_showcase").insert({
        title: scTitle.trim(), channel_name: scChannel.trim(), thumbnail_url: scThumbnail.trim(),
        video_url: scVideoUrl.trim(), tags: tagsArr, display_date: scDate.trim(), sort_order: scOrder
      }).select().single();
      if (error) throw error;
      if (data) setShowcaseItems([...showcaseItems, data as any].sort((a, b) => a.sort_order - b.sort_order));
      setScTitle(""); setScChannel(""); setScThumbnail(""); setScVideoUrl(""); setScTags(""); setScDate(""); setScOrder(0);
      setThumbnailPreview("");
      toast.success("Showcase item added");
    } catch (e) { toast.error("Failed to add showcase item"); }
  };

  const deleteShowcaseItem = async (id: string) => {
    try {
      await supabase.from("landing_showcase").delete().eq("id", id);
      setShowcaseItems(showcaseItems.filter(s => s.id !== id));
      toast.success("Showcase item deleted");
    } catch (e) { toast.error("Failed to delete"); }
  };

  const openEditShowcase = (item: ShowcaseItem) => {
    setEditingShowcase(item);
    setScTitle(item.title); setScChannel(item.channel_name); setScThumbnail(item.thumbnail_url);
    setScVideoUrl(item.video_url); setScTags(item.tags.join(", ")); setScDate(item.display_date); setScOrder(item.sort_order);
    setThumbnailPreview(item.thumbnail_url || "");
    setShowcaseDialogOpen(true);
  };

  const saveEditShowcase = async () => {
    if (!editingShowcase || !scTitle.trim()) return;
    try {
      const tagsArr = scTags.split(",").map(t => t.trim()).filter(Boolean);
      const updateData = {
        title: scTitle.trim(), channel_name: scChannel.trim(), thumbnail_url: scThumbnail.trim(),
        video_url: scVideoUrl.trim(), tags: tagsArr, display_date: scDate.trim(), sort_order: scOrder
      };
      const { error } = await supabase.from("landing_showcase").update(updateData).eq("id", editingShowcase.id);
      if (error) throw error;
      setShowcaseItems(showcaseItems.map(s => s.id === editingShowcase.id ? { ...s, ...updateData } : s).sort((a, b) => a.sort_order - b.sort_order));
      setShowcaseDialogOpen(false); setEditingShowcase(null);
      setScTitle(""); setScChannel(""); setScThumbnail(""); setScVideoUrl(""); setScTags(""); setScDate(""); setScOrder(0);
      toast.success("Showcase item updated");
    } catch (e) { toast.error("Failed to update"); }
  };

  const loadNotes = async () => {
    setNotesLoading(true);
    try {
      const { data } = await supabase.from("admin_notes").select("*").order("created_at", { ascending: false });
      if (data) setNotes(data as unknown as AdminNote[]);
    } catch (e) { console.error(e); }
    finally { setNotesLoading(false); }
  };

  const addNote = async () => {
    if (!newNote.trim() || !user) return;
    try {
      const insertData: any = { text: newNote.trim(), title: newNoteTitle.trim(), user_id: user.id, video_url: newNoteVideoUrl.trim() };
      if (newNoteChannelId !== "all") insertData.channel_id = newNoteChannelId;
      const { data, error } = await supabase.from("admin_notes").insert(insertData).select().single();
      if (error) throw error;
      if (data) setNotes([data as unknown as AdminNote, ...notes]);
      setNewNote(""); setNewNoteTitle(""); setNewNoteChannelId("all"); setNewNoteVideoUrl("");
      toast.success("Note added");
    } catch (e) { toast.error("Failed to save note"); }
  };

  const deleteNote = async (id: string) => {
    try {
      await supabase.from("admin_notes").delete().eq("id", id);
      setNotes(notes.filter(n => n.id !== id));
      setNoteDialogOpen(false); setSelectedNote(null);
      toast.success("Note মুছে ফেলা হয়েছে");
    } catch (e) { toast.error("Note মুছতে সমস্যা হয়েছে"); }
  };

  const openNoteDialog = (note: AdminNote) => {
    setSelectedNote(note);
    setIsEditingInDialog(false);
    setEditNoteText(note.text);
    setEditNoteTitle(note.title || "");
    setEditNoteChannelId(note.channel_id || "all");
    setEditNoteVideoUrl(note.video_url || "");
    setNoteDialogOpen(true);
  };

  const startEditInDialog = () => {
    if (!selectedNote) return;
    setEditNoteText(selectedNote.text);
    setEditNoteTitle(selectedNote.title || "");
    setEditNoteChannelId(selectedNote.channel_id || "all");
    setEditNoteVideoUrl(selectedNote.video_url || "");
    setIsEditingInDialog(true);
  };

  const saveEditNote = async () => {
    if (!selectedNote || !editNoteText.trim()) return;
    try {
      const updateData: any = { text: editNoteText.trim(), title: editNoteTitle.trim(), video_url: editNoteVideoUrl.trim() };
      updateData.channel_id = editNoteChannelId === "all" ? null : editNoteChannelId;
      const { error } = await supabase.from("admin_notes").update(updateData).eq("id", selectedNote.id);
      if (error) throw error;
      const updated = { ...selectedNote, ...updateData };
      setNotes(notes.map(n => n.id === selectedNote.id ? updated : n));
      setSelectedNote(updated);
      setIsEditingInDialog(false);
      toast.success("Note আপডেট হয়েছে");
    } catch (e) { toast.error("Note আপডেট করতে সমস্যা হয়েছে"); }
  };

  const getChannelName = (channelId: string | null) => {
    if (!channelId) return null;
    return channels.find(c => c.id === channelId)?.name || null;
  };

  const filteredNotes = notes.filter(note => {
    const matchesChannel = noteFilterChannel === "all" || note.channel_id === noteFilterChannel;
    const matchesSearch = !noteSearch.trim() ||
      note.title.toLowerCase().includes(noteSearch.toLowerCase()) ||
      note.text.toLowerCase().includes(noteSearch.toLowerCase());
    return matchesChannel && matchesSearch;
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [summariesRes, profilesRes, settingsRes, rolesRes] = await Promise.all([
        supabase.from("summaries").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("*"),
        supabase.from("user_settings").select("user_id, api_keys"),
        supabase.from("user_roles").select("user_id, role").eq("role", "admin"),
      ]);
      const allSummaries = (summariesRes.data || []) as unknown as SummaryRow[];
      setSummaries(allSummaries);
      const profiles = profilesRes.data || [];
      const settingsMap = new Map<string, boolean>();
      (settingsRes.data || []).forEach((s: any) => {
        const keys = s.api_keys as Record<string, string> || {};
        settingsMap.set(s.user_id, Object.values(keys).some((k: any) => k?.trim()));
      });
      const adminSet = new Set<string>();
      (rolesRes.data || []).forEach((r: any) => adminSet.add(r.user_id));
      const countMap = new Map<string, number>();
      allSummaries.forEach(s => countMap.set(s.user_id, (countMap.get(s.user_id) || 0) + 1));
      setUsers(profiles.map((p: any) => ({
        id: p.id, email: p.email || "N/A", created_at: p.created_at,
        summaryCount: countMap.get(p.id) || 0, hasApiKey: settingsMap.get(p.id) || false, isAdmin: adminSet.has(p.id),
      })).sort((a: UserInfo, b: UserInfo) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const getUserEmail = (userId: string) => users.find(u => u.id === userId)?.email || userId.slice(0, 8) + "...";

  const handleSubmit = async () => {
    setError(""); setResult(null); setDone(false);
    if (!inputValue.trim()) { setError("Transcript paste করুন"); return; }
    setIsLoading(true);
    try {
      const aiSettings = getSettings();
      const { data, error: fnError } = await supabase.functions.invoke("summarize", {
        body: { content: inputValue, provider: aiSettings.provider, model: aiSettings.model, apiKey: aiSettings.apiKey },
      });
      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      const summary = data as SummaryResult;
      setResult(summary); setDone(true);
      if (user) {
        const id = await addToHistory({ inputType: "transcript", inputValue, mainStory: summary.mainStory, bulletPoints: summary.bulletPoints || [], howToApply: summary.howToApply || [] }, user.id);
        setHistoryId(id);
      }
    } catch (e) { setError(e instanceof Error ? e.message : "কিছু একটা ভুল হয়েছে"); }
    finally { setIsLoading(false); }
  };

  const handleReset = () => { setInputValue(""); setResult(null); setError(""); setDone(false); setHistoryId(null); };

  const currentProvider = getProviderConfig(settings.provider);
  const handleProviderChange = (providerId: string) => {
    const provider = getProviderConfig(providerId as AIProvider);
    const savedKeys = JSON.parse(localStorage.getItem("provider_api_keys") || "{}");
    setSettingsState(prev => ({ ...prev, provider: providerId as AIProvider, model: provider.models[0].id, apiKey: savedKeys[providerId] || "" }));
  };
  const handleSaveSettings = async () => {
    if (!settings.apiKey.trim()) { toast.error("API Key দিতে হবে"); return; }
    const savedKeys = JSON.parse(localStorage.getItem("provider_api_keys") || "{}");
    savedKeys[settings.provider] = settings.apiKey;
    localStorage.setItem("provider_api_keys", JSON.stringify(savedKeys));
    saveSettings(settings);
    if (user) await saveSettingsToDb(settings, user.id);
    toast.success("Settings সেভ হয়েছে!");
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setProfileSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({ name: profileName.trim() } as any).eq("id", user.id);
      if (error) throw error;
      toast.success("প্রোফাইল আপডেট হয়েছে!");
    } catch (e) { toast.error("প্রোফাইল আপডেট করতে সমস্যা হয়েছে"); }
    finally { setProfileSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!newPassword.trim()) { toast.error("নতুন password দিন"); return; }
    if (newPassword.length < 6) { toast.error("Password কমপক্ষে ৬ অক্ষর হতে হবে"); return; }
    if (newPassword !== confirmPassword) { toast.error("Password মিলছে না"); return; }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password পরিবর্তন হয়েছে!");
      setNewPassword(""); setConfirmPassword("");
    } catch (e: any) { toast.error(e.message || "Password পরিবর্তন করতে সমস্যা হয়েছে"); }
    finally { setChangingPassword(false); }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Welcome back, Admin</h2>
              <p className="text-muted-foreground mt-1">Here's an overview of your platform.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="hover:border-primary/30 transition-colors cursor-pointer" onClick={() => setActiveTab("users")}>
                <CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Users</p><p className="text-3xl font-bold text-foreground mt-1">{users.length}</p></div><div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center"><Users className="h-6 w-6 text-primary" /></div></div></CardContent>
              </Card>
              <Card className="hover:border-primary/30 transition-colors cursor-pointer" onClick={() => setActiveTab("summaries")}>
                <CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Summaries</p><p className="text-3xl font-bold text-foreground mt-1">{summaries.length}</p></div><div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center"><FileText className="h-6 w-6 text-primary" /></div></div></CardContent>
              </Card>
              <Card className="hover:border-primary/30 transition-colors cursor-pointer" onClick={() => setActiveTab("tasks")}>
                <CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Tasks</p><p className="text-3xl font-bold text-foreground mt-1"><ListChecks className="h-6 w-6 inline" /></p></div><div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center"><ListChecks className="h-6 w-6 text-primary" /></div></div></CardContent>
              </Card>
              <Card className="hover:border-primary/30 transition-colors cursor-pointer" onClick={() => setActiveTab("goals")}>
                <CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Goals</p><p className="text-3xl font-bold text-foreground mt-1"><Target className="h-6 w-6 inline" /></p></div><div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center"><Target className="h-6 w-6 text-primary" /></div></div></CardContent>
              </Card>
              <Card className="hover:border-primary/30 transition-colors cursor-pointer" onClick={() => setActiveTab("money")}>
                <CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Money</p><p className="text-3xl font-bold text-foreground mt-1"><DollarSign className="h-6 w-6 inline" /></p></div><div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center"><DollarSign className="h-6 w-6 text-primary" /></div></div></CardContent>
              </Card>
              <Card className="hover:border-primary/30 transition-colors cursor-pointer" onClick={() => setActiveTab("notes")}>
                <CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Notes</p><p className="text-3xl font-bold text-foreground mt-1">{notes.length}</p></div><div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center"><StickyNote className="h-6 w-6 text-primary" /></div></div></CardContent>
              </Card>
              <Card className="hover:border-primary/30 transition-colors cursor-pointer" onClick={() => setActiveTab("showcase")}>
                <CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Showcase Items</p><p className="text-3xl font-bold text-foreground mt-1">{showcaseItems.length}</p></div><div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center"><LayoutGrid className="h-6 w-6 text-primary" /></div></div></CardContent>
              </Card>
            </div>
            {/* Recent activity */}
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /> Recent Summaries</CardTitle></CardHeader>
              <CardContent>
                {summaries.length === 0 ? <p className="text-muted-foreground text-sm">No summaries yet.</p> : (
                  <div className="space-y-3">
                    {summaries.slice(0, 5).map(item => (
                      <div key={item.id} className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">{item.main_story}</p>
                          <p className="text-xs text-muted-foreground">{getUserEmail(item.user_id)} · {formatDate(item.created_at)}</p>
                        </div>
                        <Badge variant="secondary" className="text-xs shrink-0">{item.input_type}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case "summarize":
        return (
          <div className="space-y-6 max-w-2xl mx-auto">
            {!done && (
              <Card>
                <CardContent className="pt-6 space-y-5">
                  <p className="text-center text-sm text-muted-foreground">YouTube ভিডিওর transcript paste করুন।</p>
                  <Textarea placeholder="Transcript paste করুন..." value={inputValue} onChange={(e) => setInputValue(e.target.value)} rows={6} />
                  <Button className="w-full text-base font-semibold h-12" onClick={handleSubmit} disabled={isLoading}>
                    {isLoading ? <span className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> AI বিশ্লেষণ করছে...</span>
                      : <span className="flex items-center gap-1">Summarize করো <ChevronRight className="h-5 w-5" /></span>}
                  </Button>
                </CardContent>
              </Card>
            )}
            {done && <div className="flex justify-center gap-3"><Button variant="outline" onClick={handleReset} className="gap-2"><RefreshCw className="h-4 w-4" /> নতুন Summary করুন</Button></div>}
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            {result && (
              <div className="space-y-5 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
                <Card><CardHeader><CardTitle className="text-xl text-primary">মূল বিষয়</CardTitle></CardHeader><CardContent><p className="text-secondary-foreground leading-relaxed">{result.mainStory}</p></CardContent></Card>
                <Card><CardHeader><CardTitle className="text-xl text-primary">Key Points</CardTitle></CardHeader><CardContent><ul className="space-y-2">{(result.bulletPoints || []).map((p, i) => <li key={i} className="flex items-start gap-2 text-secondary-foreground"><span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />{p}</li>)}</ul></CardContent></Card>
                <Card><CardHeader><CardTitle className="text-xl text-primary">কী শিখলাম / কী করবো?</CardTitle></CardHeader><CardContent className="space-y-4">{(result.howToApply || []).map((item, i) => <div key={i} className="border-l-2 border-primary pl-4"><h4 className="font-semibold text-foreground">{item.title}</h4><p className="text-muted-foreground text-sm mt-1">{item.detail}</p></div>)}</CardContent></Card>
              </div>
            )}
            {result && done && <FollowUpSection transcript={inputValue} summary={result} initialConversation={initialConversation} onConversationUpdate={(conv) => { if (historyId) updateHistoryConversation(historyId, conv); }} />}
          </div>
        );

      case "users":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card><CardContent className="pt-6 text-center"><Users className="h-8 w-8 text-primary mx-auto mb-2" /><p className="text-3xl font-bold text-foreground">{users.length}</p><p className="text-sm text-muted-foreground">Total Users</p></CardContent></Card>
              <Card><CardContent className="pt-6 text-center"><FileText className="h-8 w-8 text-primary mx-auto mb-2" /><p className="text-3xl font-bold text-foreground">{summaries.length}</p><p className="text-sm text-muted-foreground">Total Summaries</p></CardContent></Card>
            </div>
            {loading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : users.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">কোনো user নেই।</CardContent></Card> : (
              <div className="space-y-3">{users.map(u => (
                <Card key={u.id} className="hover:border-primary/30 transition-colors">
                  <CardContent className="py-4 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground truncate">{u.email}</p>
                        {u.isAdmin && <Badge variant="default" className="gap-1 bg-primary text-primary-foreground text-xs"><Shield className="h-3 w-3" /> Admin</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">Joined: {formatDate(u.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant={u.hasApiKey ? "default" : "destructive"} className="gap-1"><KeyRound className="h-3 w-3" />{u.hasApiKey ? "Key আছে" : "Key নেই"}</Badge>
                      <Badge variant="outline" className="gap-1"><FileText className="h-3 w-3" />{u.summaryCount} summaries</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}</div>
            )}
          </div>
        );

      case "summaries":
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">সব Summaries ({summaries.length})</h2>
            {loading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : summaries.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">কোনো summary নেই।</CardContent></Card> : (
              summaries.map(item => (
                <Card key={item.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setExpanded(expanded === item.id ? null : item.id)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant="outline" className="text-xs">{getUserEmail(item.user_id)}</Badge>
                          <span className="text-xs text-muted-foreground">{formatDate(item.created_at)}</span>
                        </div>
                        <CardTitle className="text-base line-clamp-2">{item.main_story}</CardTitle>
                      </div>
                      <Badge variant="secondary" className="shrink-0">{item.input_type}</Badge>
                    </div>
                  </CardHeader>
                  {expanded === item.id && (
                    <CardContent className="space-y-4 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                      <div className="bg-muted/50 rounded p-3"><p className="text-xs text-muted-foreground mb-1">Input:</p><p className="text-sm text-foreground line-clamp-5 break-all">{item.input_value}</p></div>
                      <div><h4 className="font-semibold text-primary text-sm mb-2">Key Points</h4><ul className="space-y-1">{((item.bullet_points as unknown as string[]) || []).map((p, i) => <li key={i} className="flex items-start gap-2 text-sm text-secondary-foreground"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />{p}</li>)}</ul></div>
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </div>
        );

      case "history":
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">আমার Summary History</h2>
            {(() => {
              const mySummaries = summaries.filter(s => s.user_id === user?.id);
              return mySummaries.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">আপনার কোনো summary নেই।</CardContent></Card> : (
                mySummaries.map(item => (
                  <Card key={item.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setExpanded(expanded === item.id ? null : item.id)}>
                    <CardHeader className="pb-2">
                      <span className="text-xs text-muted-foreground">{formatDate(item.created_at)}</span>
                      <CardTitle className="text-base line-clamp-2 mt-1">{item.main_story}</CardTitle>
                    </CardHeader>
                    {expanded === item.id && (
                      <CardContent className="space-y-4">
                        <Button className="w-full gap-2" onClick={(e) => {
                          e.stopPropagation();
                          setInputValue(item.input_value);
                          setResult({ mainStory: item.main_story, bulletPoints: (item.bullet_points as unknown as string[]) || [], howToApply: (item.how_to_apply as unknown as { title: string; detail: string }[]) || [] });
                          setDone(true); setHistoryId(item.id);
                          setInitialConversation((item.conversation as unknown as { role: "user" | "assistant"; content: string }[]) || undefined);
                          setActiveTab("summarize");
                        }}><MessageCircle className="h-4 w-4" /> চ্যাট Continue করুন</Button>
                      </CardContent>
                    )}
                  </Card>
                ))
              );
            })()}
          </div>
        );

      case "channels":
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Favorite Channels</h2>
            {channelsLoading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : <ChannelManager channels={channels} onChannelsChange={setChannels} loading={channelsLoading} />}
          </div>
        );

      case "notes":
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Admin Notes</h2>

            {/* Filter & Search */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Title বা content দিয়ে search করুন..." value={noteSearch} onChange={(e) => setNoteSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={noteFilterChannel} onValueChange={setNoteFilterChannel}>
                <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Channel filter" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">সব Channels</SelectItem>
                  {channels.map(ch => <SelectItem key={ch.id} value={ch.id}>{ch.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* New Note Form */}
            <Card>
              <CardContent className="pt-6 space-y-3">
                <Input placeholder="Note title..." value={newNoteTitle} onChange={(e) => setNewNoteTitle(e.target.value)} className="font-semibold" />
                <Select value={newNoteChannelId} onValueChange={setNewNoteChannelId}>
                  <SelectTrigger><SelectValue placeholder="Channel select করুন" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">কোনো Channel নেই</SelectItem>
                    {channels.map(ch => <SelectItem key={ch.id} value={ch.id}><span className="flex items-center gap-1.5"><Youtube className="h-3.5 w-3.5 text-destructive" /> {ch.name}</span></SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input placeholder="Video URL (optional)..." value={newNoteVideoUrl} onChange={(e) => setNewNoteVideoUrl(e.target.value)} />
                </div>
                <RichTextEditor value={newNote} onChange={setNewNote} />
                <Button onClick={addNote} disabled={!newNote.trim()} className="gap-2"><Plus className="h-4 w-4" /> Note যোগ করুন</Button>
              </CardContent>
            </Card>

            {/* Notes List - show only channel name + title, click to open popup */}
            {notesLoading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : filteredNotes.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">{noteSearch || noteFilterChannel !== "all" ? "কোনো note পাওয়া যায়নি।" : "কোনো note নেই।"}</CardContent></Card>
            ) : (
              <div className="space-y-2">
                {filteredNotes.map(note => (
                  <Card key={note.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => openNoteDialog(note)}>
                    <CardContent className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {getChannelName(note.channel_id) && (
                          <Badge variant="secondary" className="gap-1 text-xs shrink-0">
                            <Youtube className="h-3 w-3 text-destructive" /> {getChannelName(note.channel_id)}
                          </Badge>
                        )}
                        <span className="font-medium text-foreground truncate">{note.title || "Untitled"}</span>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{formatDate(note.created_at)}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Note Detail Dialog */}
            <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl">
                    {isEditingInDialog ? "Note Edit করুন" : (selectedNote?.title || "Untitled")}
                  </DialogTitle>
                  <DialogDescription className="sr-only">Note details and editing</DialogDescription>
                </DialogHeader>

                {selectedNote && !isEditingInDialog && (
                  <div className="space-y-4">
                    {getChannelName(selectedNote.channel_id) && (
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <Youtube className="h-3 w-3 text-destructive" /> {getChannelName(selectedNote.channel_id)}
                      </Badge>
                    )}
                    {selectedNote.video_url && (
                      <a href={selectedNote.video_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                        <LinkIcon className="h-4 w-4" /> Video দেখুন
                      </a>
                    )}
                    <div className="prose prose-sm dark:prose-invert max-w-none border rounded-md p-4 bg-muted/20"
                      dangerouslySetInnerHTML={{ __html: selectedNote.text }} />
                    <p className="text-xs text-muted-foreground">{formatDate(selectedNote.created_at)}</p>
                  </div>
                )}

                {selectedNote && isEditingInDialog && (
                  <div className="space-y-3">
                    <Input placeholder="Note title..." value={editNoteTitle} onChange={(e) => setEditNoteTitle(e.target.value)} className="font-semibold" />
                    <Select value={editNoteChannelId} onValueChange={setEditNoteChannelId}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">কোনো Channel নেই</SelectItem>
                        {channels.map(ch => <SelectItem key={ch.id} value={ch.id}><span className="flex items-center gap-1.5"><Youtube className="h-3.5 w-3.5 text-destructive" /> {ch.name}</span></SelectItem>)}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                      <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <Input placeholder="Video URL..." value={editNoteVideoUrl} onChange={(e) => setEditNoteVideoUrl(e.target.value)} />
                    </div>
                    <RichTextEditor value={editNoteText} onChange={setEditNoteText} />
                  </div>
                )}

                <DialogFooter>
                  {selectedNote && !isEditingInDialog && (
                    <div className="flex gap-2 w-full">
                      <Button variant="outline" className="gap-2" onClick={startEditInDialog}><Pencil className="h-4 w-4" /> Edit</Button>
                      <Button variant="destructive" className="gap-2" onClick={() => deleteNote(selectedNote.id)}><Trash2 className="h-4 w-4" /> Delete</Button>
                    </div>
                  )}
                  {selectedNote && isEditingInDialog && (
                    <div className="flex gap-2 w-full">
                      <Button className="gap-2" onClick={saveEditNote} disabled={!editNoteText.trim()}><Check className="h-4 w-4" /> Save</Button>
                      <Button variant="outline" onClick={() => setIsEditingInDialog(false)}>বাতিল</Button>
                    </div>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        );

      case "showcase":
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2"><LayoutGrid className="h-5 w-5 text-primary" /> Landing Page Showcase</h2>
            <p className="text-sm text-muted-foreground">এখান থেকে Landing Page-এর "Your Learning Journey" section manage করুন।</p>

            {/* Add Form */}
            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Title *</Label>
                    <Input placeholder="Video title..." value={scTitle} onChange={(e) => setScTitle(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Channel Name</Label>
                    <Input placeholder="Channel name..." value={scChannel} onChange={(e) => setScChannel(e.target.value)} />
                  </div>
                </div>
                {/* Thumbnail Upload */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Thumbnail (drag & drop or click)</Label>
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleThumbnailDrop}
                    onClick={() => document.getElementById("sc-thumb-input")?.click()}
                    className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    {thumbnailUploading ? (
                      <div className="flex items-center justify-center gap-2 py-2"><Loader2 className="h-5 w-5 animate-spin text-primary" /><span className="text-sm text-muted-foreground">Uploading...</span></div>
                    ) : thumbnailPreview || scThumbnail ? (
                      <div className="space-y-2">
                        <img src={thumbnailPreview || scThumbnail} alt="Thumbnail" className="max-h-32 mx-auto rounded object-cover" />
                        <p className="text-xs text-muted-foreground">Click or drop to replace</p>
                      </div>
                    ) : (
                      <div className="py-4 space-y-1">
                        <Image className="h-8 w-8 mx-auto text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">Drop image here or click to browse</p>
                      </div>
                    )}
                    <input id="sc-thumb-input" type="file" accept="image/*" className="hidden" onChange={handleThumbnailFileSelect} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Video URL</Label>
                  <Input placeholder="https://youtube.com/watch?v=..." value={scVideoUrl} onChange={(e) => setScVideoUrl(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Tags (comma separated)</Label>
                    <div className="flex gap-2">
                      <Input placeholder="Business, Mindset, Money" value={scTags} onChange={(e) => setScTags(e.target.value)} className="flex-1" />
                      <Button type="button" variant="outline" size="sm" className="gap-1 shrink-0 h-9" disabled={!scTitle.trim()} onClick={() => { const tags = generateTagsFromTitle(scTitle); setScTags(tags.join(", ")); toast.success("Tags generated!"); }}>
                        <Sparkles className="h-3.5 w-3.5" /> Generate
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Display Date</Label>
                    <Input placeholder="March 19, 2025" value={scDate} onChange={(e) => setScDate(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Sort Order</Label>
                    <Input type="number" value={scOrder} onChange={(e) => setScOrder(Number(e.target.value))} />
                  </div>
                </div>
                <Button onClick={addShowcaseItem} disabled={!scTitle.trim()} className="gap-2"><Plus className="h-4 w-4" /> Add Showcase Item</Button>
              </CardContent>
            </Card>

            {/* Items List */}
            {showcaseLoading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : showcaseItems.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">No showcase items yet.</CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {showcaseItems.map(item => (
                  <Card key={item.id} className="overflow-hidden hover:border-primary/50 transition-colors">
                    {item.thumbnail_url ? (
                      <div className="aspect-video">
                        <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="aspect-video bg-muted flex items-center justify-center"><Image className="h-10 w-10 text-muted-foreground/30" /></div>
                    )}
                    <CardContent className="p-3 space-y-1.5">
                      <p className="text-xs font-medium text-primary">{item.channel_name}</p>
                      <h4 className="font-semibold text-sm text-foreground line-clamp-2">{item.title}</h4>
                      <p className="text-xs text-muted-foreground">{item.display_date}</p>
                      {item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {item.tags.map(t => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                        </div>
                      )}
                      <div className="flex gap-1 pt-2">
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => openEditShowcase(item)}><Pencil className="h-3 w-3" /> Edit</Button>
                        <Button variant="destructive" size="sm" className="h-7 text-xs gap-1" onClick={() => deleteShowcaseItem(item.id)}><Trash2 className="h-3 w-3" /> Delete</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={showcaseDialogOpen} onOpenChange={setShowcaseDialogOpen}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Edit Showcase Item</DialogTitle>
                  <DialogDescription className="sr-only">Edit showcase item details</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1.5"><Label className="text-xs">Title *</Label><Input value={scTitle} onChange={(e) => setScTitle(e.target.value)} /></div>
                  <div className="space-y-1.5"><Label className="text-xs">Channel Name</Label><Input value={scChannel} onChange={(e) => setScChannel(e.target.value)} /></div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Thumbnail</Label>
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleThumbnailDrop}
                      onClick={() => document.getElementById("sc-thumb-edit-input")?.click()}
                      className="border-2 border-dashed border-border rounded-lg p-3 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    >
                      {thumbnailUploading ? (
                        <div className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin text-primary" /><span className="text-xs text-muted-foreground">Uploading...</span></div>
                      ) : thumbnailPreview || scThumbnail ? (
                        <div className="space-y-1">
                          <img src={thumbnailPreview || scThumbnail} alt="Thumb" className="max-h-24 mx-auto rounded object-cover" />
                          <p className="text-xs text-muted-foreground">Click or drop to replace</p>
                        </div>
                      ) : (
                        <div className="py-2"><Image className="h-6 w-6 mx-auto text-muted-foreground/50" /><p className="text-xs text-muted-foreground mt-1">Drop image or click</p></div>
                      )}
                      <input id="sc-thumb-edit-input" type="file" accept="image/*" className="hidden" onChange={handleThumbnailFileSelect} />
                    </div>
                  </div>
                  <div className="space-y-1.5"><Label className="text-xs">Video URL</Label><Input value={scVideoUrl} onChange={(e) => setScVideoUrl(e.target.value)} /></div>
                  <div className="space-y-1.5"><Label className="text-xs">Tags (comma separated)</Label><div className="flex gap-2"><Input value={scTags} onChange={(e) => setScTags(e.target.value)} className="flex-1" /><Button type="button" variant="outline" size="sm" className="gap-1 shrink-0 h-9" disabled={!scTitle.trim()} onClick={() => { setScTags(generateTagsFromTitle(scTitle).join(", ")); toast.success("Tags generated!"); }}><Sparkles className="h-3.5 w-3.5" /> Generate</Button></div></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label className="text-xs">Display Date</Label><Input value={scDate} onChange={(e) => setScDate(e.target.value)} /></div>
                    <div className="space-y-1.5"><Label className="text-xs">Sort Order</Label><Input type="number" value={scOrder} onChange={(e) => setScOrder(Number(e.target.value))} /></div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={saveEditShowcase} disabled={!scTitle.trim()} className="gap-2"><Check className="h-4 w-4" /> Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        );

      case "profile":
        return (
          <div className="space-y-6 max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2"><User className="h-5 w-5 text-primary" /> Profile</h2>
            <Card>
              <CardHeader><CardTitle className="text-lg text-primary flex items-center gap-2"><Mail className="h-4 w-4" /> Email</CardTitle></CardHeader>
              <CardContent><Input value={user?.email || ""} disabled className="bg-muted" /><p className="text-xs text-muted-foreground mt-1">Email পরিবর্তন করা যায় না।</p></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg text-primary flex items-center gap-2"><User className="h-4 w-4" /> নাম</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2"><Label>আপনার নাম</Label><Input placeholder="আপনার নাম লিখুন..." value={profileName} onChange={(e) => setProfileName(e.target.value)} /></div>
                <Button onClick={handleSaveProfile} disabled={profileSaving} className="gap-2">{profileSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Profile</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg text-primary flex items-center gap-2"><Lock className="h-4 w-4" /> Password পরিবর্তন</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2"><Label>নতুন Password</Label><Input type="password" placeholder="নতুন password..." value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></div>
                <div className="space-y-2"><Label>Password নিশ্চিত করুন</Label><Input type="password" placeholder="আবার password লিখুন..." value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div>
                <Button onClick={handleChangePassword} disabled={changingPassword} className="gap-2">{changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />} Password পরিবর্তন করুন</Button>
              </CardContent>
            </Card>
          </div>
        );

      case "settings":
        return (
          <div className="space-y-6 max-w-2xl mx-auto">
            <Card>
              <CardHeader><CardTitle className="text-lg text-primary">AI Provider ও Model</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2"><Label>Provider নির্বাচন করুন</Label><Select value={settings.provider} onValueChange={handleProviderChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PROVIDERS.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Model নির্বাচন করুন</Label><Select value={settings.model} onValueChange={(v) => setSettingsState(prev => ({ ...prev, model: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{currentProvider.models.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between"><Label>{currentProvider.name} API Key</Label><a href={currentProvider.apiKeyUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">Key নিন <ExternalLink className="h-3 w-3" /></a></div>
                  <div className="flex gap-2"><Input type={showKey ? "text" : "password"} placeholder={currentProvider.apiKeyPlaceholder} value={settings.apiKey} onChange={(e) => setSettingsState(prev => ({ ...prev, apiKey: e.target.value }))} className="flex-1 font-mono text-sm" /><Button variant="outline" size="icon" onClick={() => setShowKey(!showKey)} type="button">{showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button></div>
                </div>
                <Button onClick={handleSaveSettings} className="w-full gap-2"><Check className="h-4 w-4" /> Save Settings</Button>
              </CardContent>
            </Card>
          </div>
        );

      case "tasks": return <TaskManager />;
      case "goals": return <GoalTracker />;
      case "money": return <MoneyManager />;
      case "payments": return <AdminPayments />;
      case "subscription-plans": return <AdminSubscriptionPlans />;
      case "payment-methods": return <AdminPaymentMethods />;
      case "support": return <AdminSupport />;
      case "analytics": return <AdminAnalytics />;
      case "user-mgmt": return <AdminUserManagement />;
      case "notifications": return <AdminNotifications />;
      case "team": return <AdminTeamManagement />;
      default: return null;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-12 flex items-center border-b border-border px-2">
            <SidebarTrigger className="ml-1" />
            <h1 className="ml-3 text-lg font-bold text-foreground flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" /> Admin Dashboard
            </h1>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {renderContent()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
