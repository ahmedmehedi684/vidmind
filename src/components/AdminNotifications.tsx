import { useState, useEffect } from "react";
import { Bell, Send, Loader2, Users, User, Trash2, Globe, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Notification {
  id: string;
  user_id: string | null;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  is_global: boolean;
  created_at: string;
  created_by: string | null;
}

const AdminNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Form
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  const [target, setTarget] = useState("global");
  const [targetUserId, setTargetUserId] = useState("");
  const [userList, setUserList] = useState<{ id: string; email: string }[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [notifRes, profilesRes] = await Promise.all([
        supabase.from("notifications").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("id, email"),
      ]);
      if (notifRes.data) setNotifications(notifRes.data as any[]);
      if (profilesRes.data) {
        const map: Record<string, string> = {};
        const list: { id: string; email: string }[] = [];
        (profilesRes.data as any[]).forEach(p => {
          map[p.id] = p.email || p.id;
          list.push({ id: p.id, email: p.email || p.id });
        });
        setProfiles(map);
        setUserList(list);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const sendNotification = async () => {
    if (!title.trim() || !message.trim() || !user) return;
    setSending(true);
    try {
      if (target === "global") {
        // Send global notification
        const { data, error } = await supabase.from("notifications").insert({
          title: title.trim(),
          message: message.trim(),
          type,
          is_global: true,
          user_id: null,
          created_by: user.id,
        } as any).select().single();
        if (error) throw error;
        if (data) setNotifications([data as any, ...notifications]);
        toast.success("Global notification sent!");
      } else if (target === "all_users") {
        // Send to each user individually
        const inserts = userList.map(u => ({
          title: title.trim(),
          message: message.trim(),
          type,
          is_global: false,
          user_id: u.id,
          created_by: user.id,
        }));
        const { data, error } = await supabase.from("notifications").insert(inserts as any[]).select();
        if (error) throw error;
        if (data) setNotifications([...(data as any[]), ...notifications]);
        toast.success(`Sent to ${userList.length} users!`);
      } else {
        // Send to specific user
        if (!targetUserId) { toast.error("Select a user"); setSending(false); return; }
        const { data, error } = await supabase.from("notifications").insert({
          title: title.trim(),
          message: message.trim(),
          type,
          is_global: false,
          user_id: targetUserId,
          created_by: user.id,
        } as any).select().single();
        if (error) throw error;
        if (data) setNotifications([data as any, ...notifications]);
        toast.success(`Notification sent to ${profiles[targetUserId] || targetUserId}!`);
      }
      setTitle(""); setMessage("");
    } catch (e) { toast.error("Failed to send notification"); }
    finally { setSending(false); }
  };

  const deleteNotification = async (id: string) => {
    try {
      await supabase.from("notifications").delete().eq("id", id);
      setNotifications(notifications.filter(n => n.id !== id));
      toast.success("Notification deleted");
    } catch (e) { toast.error("Failed to delete"); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
        <Bell className="h-6 w-6 text-primary" /> Notification System
      </h2>

      {/* Send Form */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Send Notification</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Notification title..." />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">ℹ️ Info</SelectItem>
                  <SelectItem value="success">✅ Success</SelectItem>
                  <SelectItem value="warning">⚠️ Warning</SelectItem>
                  <SelectItem value="alert">🚨 Alert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Message *</Label>
            <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Notification message..." rows={3} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Target</Label>
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="global"><span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> Global (everyone)</span></SelectItem>
                  <SelectItem value="all_users"><span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> All Users (individual)</span></SelectItem>
                  <SelectItem value="specific"><span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> Specific User</span></SelectItem>
                </SelectContent>
              </Select>
            </div>
            {target === "specific" && (
              <div className="space-y-1.5">
                <Label>Select User</Label>
                <Select value={targetUserId} onValueChange={setTargetUserId}>
                  <SelectTrigger><SelectValue placeholder="Choose user..." /></SelectTrigger>
                  <SelectContent>
                    {userList.map(u => <SelectItem key={u.id} value={u.id}>{u.email}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <Button onClick={sendNotification} disabled={sending || !title.trim() || !message.trim()} className="gap-2">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send Notification
          </Button>
        </CardContent>
      </Card>

      {/* Sent Notifications */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3">Sent Notifications ({notifications.length})</h3>
        {notifications.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">No notifications sent yet.</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <Card key={n.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                      n.type === "success" ? "bg-green-500/10" : n.type === "warning" ? "bg-amber-500/10" : n.type === "alert" ? "bg-red-500/10" : "bg-primary/10"
                    }`}>
                      <MessageSquare className={`h-5 w-5 ${
                        n.type === "success" ? "text-green-400" : n.type === "warning" ? "text-amber-400" : n.type === "alert" ? "text-red-400" : "text-primary"
                      }`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground text-sm truncate">{n.title}</p>
                        {n.is_global && <Badge variant="secondary" className="text-xs gap-1"><Globe className="h-3 w-3" /> Global</Badge>}
                        {!n.is_global && n.user_id && <Badge variant="outline" className="text-xs">{profiles[n.user_id] || "User"}</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={n.type === "alert" ? "destructive" : "secondary"} className="text-xs capitalize">{n.type}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleDateString()}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteNotification(n.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNotifications;
