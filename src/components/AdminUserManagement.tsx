import { useState, useEffect } from "react";
import {
  Users, Search, Loader2, Shield, FileText, KeyRound,
  ChevronDown, UserCog, Crown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserInfo {
  id: string;
  email: string;
  name: string;
  created_at: string;
  summaryCount: number;
  hasApiKey: boolean;
  role: string;
  subscriptionStatus: string;
}

const AdminUserManagement = () => {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [savingRole, setSavingRole] = useState(false);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const [profilesRes, summariesRes, settingsRes, rolesRes, subsRes] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("summaries").select("id, user_id"),
        supabase.from("user_settings").select("user_id, api_keys"),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("subscriptions").select("user_id, status"),
      ]);

      const profiles = profilesRes.data || [];
      const summaries = summariesRes.data || [];
      const settings = settingsRes.data || [];
      const roles = rolesRes.data || [];
      const subs = subsRes.data || [];

      const countMap = new Map<string, number>();
      summaries.forEach((s: any) => countMap.set(s.user_id, (countMap.get(s.user_id) || 0) + 1));

      const keyMap = new Map<string, boolean>();
      settings.forEach((s: any) => {
        const keys = s.api_keys as Record<string, string> || {};
        keyMap.set(s.user_id, Object.values(keys).some((k: any) => k?.trim()));
      });

      const roleMap = new Map<string, string>();
      roles.forEach((r: any) => roleMap.set(r.user_id, r.role));

      const subMap = new Map<string, string>();
      subs.forEach((s: any) => subMap.set(s.user_id, s.status));

      setUsers(profiles.map((p: any) => ({
        id: p.id,
        email: p.email || "N/A",
        name: p.name || "",
        created_at: p.created_at,
        summaryCount: countMap.get(p.id) || 0,
        hasApiKey: keyMap.get(p.id) || false,
        role: roleMap.get(p.id) || "user",
        subscriptionStatus: subMap.get(p.id) || "none",
      })).sort((a: UserInfo, b: UserInfo) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openUserDetail = (user: UserInfo) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setDialogOpen(true);
  };

  const changeRole = async () => {
    if (!selectedUser || newRole === selectedUser.role) return;
    setSavingRole(true);
    try {
      if (selectedUser.role !== "user") {
        // Delete existing role
        await supabase.from("user_roles").delete().eq("user_id", selectedUser.id);
      }
      if (newRole !== "user") {
        // Insert new role
        const { error } = await supabase.from("user_roles").insert({
          user_id: selectedUser.id,
          role: newRole as any,
        });
        if (error) throw error;
      }
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, role: newRole } : u));
      setSelectedUser({ ...selectedUser, role: newRole });
      toast.success(`Role changed to ${newRole}!`);
    } catch (e) { toast.error("Failed to change role"); }
    finally { setSavingRole(false); }
  };

  const filteredUsers = users.filter(u => {
    if (filterRole !== "all" && u.role !== filterRole) return false;
    if (search.trim()) {
      const s = search.toLowerCase();
      return u.email.toLowerCase().includes(s) || u.name.toLowerCase().includes(s);
    }
    return true;
  });

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <UserCog className="h-6 w-6 text-primary" /> User Management
        </h2>
        <Badge variant="outline" className="text-sm">{users.length} users</Badge>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by email or name..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        {["all", "admin", "moderator", "user"].map(r => (
          <Button key={r} variant={filterRole === r ? "default" : "outline"} size="sm" onClick={() => setFilterRole(r)} className="capitalize">{r}</Button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-foreground">{users.length}</p><p className="text-xs text-muted-foreground">Total Users</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-foreground">{users.filter(u => u.role === "admin").length}</p><p className="text-xs text-muted-foreground">Admins</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-foreground">{users.filter(u => u.subscriptionStatus === "active").length}</p><p className="text-xs text-muted-foreground">Active Subs</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-foreground">{users.filter(u => u.hasApiKey).length}</p><p className="text-xs text-muted-foreground">Has API Key</p></CardContent></Card>
      </div>

      {/* User List */}
      {filteredUsers.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No users found.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filteredUsers.map(u => (
            <Card key={u.id} className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => openUserDetail(u)}>
              <CardContent className="py-3 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${u.role === "admin" ? "bg-primary/10" : "bg-muted"}`}>
                    {u.role === "admin" ? <Crown className="h-5 w-5 text-primary" /> : <Users className="h-5 w-5 text-muted-foreground" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground truncate">{u.email}</p>
                      {u.role === "admin" && <Badge variant="default" className="text-xs gap-1"><Shield className="h-3 w-3" /> Admin</Badge>}
                      {u.role === "moderator" && <Badge variant="secondary" className="text-xs">Moderator</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{u.name || "No name"} · Joined {new Date(u.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={u.hasApiKey ? "default" : "secondary"} className="text-xs gap-1"><KeyRound className="h-3 w-3" />{u.hasApiKey ? "Key" : "No Key"}</Badge>
                  <Badge variant="outline" className="text-xs gap-1"><FileText className="h-3 w-3" />{u.summaryCount}</Badge>
                  <Badge variant={u.subscriptionStatus === "active" ? "default" : "secondary"} className="text-xs capitalize">{u.subscriptionStatus}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* User Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription className="sr-only">User management details</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-muted-foreground">Email</p><p className="font-medium text-foreground">{selectedUser.email}</p></div>
                <div><p className="text-muted-foreground">Name</p><p className="font-medium text-foreground">{selectedUser.name || "N/A"}</p></div>
                <div><p className="text-muted-foreground">Joined</p><p className="font-medium text-foreground">{new Date(selectedUser.created_at).toLocaleDateString()}</p></div>
                <div><p className="text-muted-foreground">Summaries</p><p className="font-medium text-foreground">{selectedUser.summaryCount}</p></div>
                <div><p className="text-muted-foreground">API Key</p><Badge variant={selectedUser.hasApiKey ? "default" : "secondary"}>{selectedUser.hasApiKey ? "Yes" : "No"}</Badge></div>
                <div><p className="text-muted-foreground">Subscription</p><Badge variant={selectedUser.subscriptionStatus === "active" ? "default" : "secondary"} className="capitalize">{selectedUser.subscriptionStatus}</Badge></div>
              </div>
              <div className="border-t pt-4 space-y-3">
                <Label className="font-semibold">Change Role</Label>
                <div className="flex gap-2">
                  <Select value={newRole} onValueChange={setNewRole}>
                    <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={changeRole} disabled={savingRole || newRole === selectedUser.role}>
                    {savingRole ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Role"}
                  </Button>
                </div>
              </div>
              <div className="text-xs text-muted-foreground font-mono break-all">ID: {selectedUser.id}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUserManagement;
