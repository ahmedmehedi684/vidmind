import { useState, useEffect } from "react";
import { Users, Plus, Loader2, Trash2, Shield, UserCog, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface TeamMember {
  id: string; name: string; email: string; role: string; created_at: string;
}

const ROLE_OPTIONS = [
  { value: "staff", label: "Staff", icon: UserCog, color: "bg-blue-500/10 text-blue-400" },
  { value: "moderator", label: "Moderator", icon: Shield, color: "bg-amber-500/10 text-amber-400" },
  { value: "ceo", label: "CEO", icon: Crown, color: "bg-purple-500/10 text-purple-400" },
];

const AdminTeamManagement = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("staff");
  const [password, setPassword] = useState("");

  useEffect(() => { loadMembers(); }, []);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from("team_members").select("*").order("created_at", { ascending: false });
      if (data) setMembers(data as any[]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const addMember = async () => {
    if (!name.trim() || !email.trim() || !user) return;
    try {
      const { data, error } = await supabase.from("team_members").insert({
        name: name.trim(), email: email.trim(), role, created_by: user.id
      } as any).select().single();
      if (error) throw error;
      if (data) setMembers([data as any, ...members]);
      setDialogOpen(false);
      setName(""); setEmail(""); setRole("staff"); setPassword("");
      toast.success(`${role.charAt(0).toUpperCase() + role.slice(1)} added! Confirmation email will be sent to ${email.trim()}.`);
    } catch (e) { toast.error("Failed to add team member"); }
  };

  const deleteMember = async (id: string) => {
    try {
      await supabase.from("team_members").delete().eq("id", id);
      setMembers(members.filter(m => m.id !== id));
      toast.success("Team member removed!");
    } catch (e) { toast.error("Failed to remove"); }
  };

  const getRoleConfig = (r: string) => ROLE_OPTIONS.find(o => o.value === r) || ROLE_OPTIONS[0];

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" /> Team & Staff
        </h2>
        <Button onClick={() => setDialogOpen(true)} size="sm" className="gap-1">
          <Plus className="h-4 w-4" /> Add Member
        </Button>
      </div>

      {members.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No team members yet.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {members.map(m => {
            const rc = getRoleConfig(m.role);
            const Icon = rc.icon;
            return (
              <Card key={m.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${rc.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="capitalize">{m.role}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleDateString()}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMember(m.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription className="sr-only">Add new staff</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" />
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Role *</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Set password" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={addMember} disabled={!name.trim() || !email.trim()} className="gap-2">
              <Plus className="h-4 w-4" /> Add & Send Confirmation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTeamManagement;
