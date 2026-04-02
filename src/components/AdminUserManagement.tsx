import { useState, useEffect } from "react";
import {
  Users, Search, Loader2, Eye, EyeOff
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

interface UserInfo {
  id: string;
  email: string;
  name: string;
  created_at: string;
  renewalCount: number;
}

const AdminUserManagement = () => {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const [profilesRes, rolesRes, subsRes] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("subscriptions").select("user_id, status"),
      ]);

      const profiles = profilesRes.data || [];
      const roles = rolesRes.data || [];
      const subs = subsRes.data || [];

      // Get admin/moderator user IDs to exclude
      const nonUserIds = new Set(
        roles.filter((r: any) => r.role === "admin" || r.role === "moderator").map((r: any) => r.user_id)
      );

      // Count renewals per user (number of subscriptions)
      const renewalMap = new Map<string, number>();
      subs.forEach((s: any) => {
        renewalMap.set(s.user_id, (renewalMap.get(s.user_id) || 0) + 1);
      });

      const filteredUsers = profiles
        .filter((p: any) => !nonUserIds.has(p.id))
        .map((p: any) => ({
          id: p.id,
          email: p.email || "N/A",
          name: p.name || "",
          created_at: p.created_at,
          renewalCount: renewalMap.get(p.id) || 0,
        }))
        .sort((a: UserInfo, b: UserInfo) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setUsers(filteredUsers);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const toggleRevealId = (id: string) => {
    setRevealedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const getDaysSinceJoined = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const filteredUsers = users.filter(u => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return u.email.toLowerCase().includes(s) || u.name.toLowerCase().includes(s);
  });

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" /> User Management
        </h2>
        <Badge variant="outline" className="text-sm">{users.length} users</Badge>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by email or name..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="rounded-md border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead>Using Since</TableHead>
              <TableHead>Renewals</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No users found.</TableCell>
              </TableRow>
            ) : filteredUsers.map(u => {
              const days = getDaysSinceJoined(u.created_at);
              const revealed = revealedIds.has(u.id);
              return (
                <TableRow key={u.id}>
                  <TableCell className="text-sm font-medium text-foreground">{u.email}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.name || "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-mono text-muted-foreground">
                        {revealed ? u.id : `${u.id.slice(0, 8)}...`}
                      </span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleRevealId(u.id)}>
                        {revealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{days} days</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{u.renewalCount}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminUserManagement;
