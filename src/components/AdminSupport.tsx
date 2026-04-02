import { useState, useEffect } from "react";
import { HeadphonesIcon, Loader2, Send, Clock, Check, X, Search, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Ticket {
  id: string; user_id: string; subject: string; message: string;
  status: string; admin_reply: string; created_at: string; updated_at: string;
}

const AdminSupport = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reply, setReply] = useState("");
  const [profiles, setProfiles] = useState<Record<string, string>>({});

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ticketsRes, profilesRes] = await Promise.all([
        supabase.from("support_tickets").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("id, email"),
      ]);
      if (ticketsRes.data) setTickets(ticketsRes.data as any[]);
      if (profilesRes.data) {
        const map: Record<string, string> = {};
        (profilesRes.data as any[]).forEach(p => { map[p.id] = p.email || p.id; });
        setProfiles(map);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openTicket = (t: Ticket) => {
    setSelectedTicket(t); setReply(t.admin_reply || ""); setDialogOpen(true);
  };

  const sendReply = async (newStatus: string) => {
    if (!selectedTicket) return;
    try {
      await supabase.from("support_tickets").update({
        admin_reply: reply.trim(), status: newStatus, updated_at: new Date().toISOString(),
      } as any).eq("id", selectedTicket.id);
      setTickets(tickets.map(t => t.id === selectedTicket.id ? { ...t, admin_reply: reply.trim(), status: newStatus } : t));
      setDialogOpen(false);
      toast.success("Reply sent!");
    } catch (e) { toast.error("Failed to update ticket"); }
  };

  const filteredTickets = tickets.filter(t => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (search.trim()) {
      const s = search.toLowerCase();
      return t.subject.toLowerCase().includes(s) || t.message.toLowerCase().includes(s) || (profiles[t.user_id] || "").toLowerCase().includes(s);
    }
    return true;
  });

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
        <HeadphonesIcon className="h-6 w-6 text-primary" /> Support Tickets
      </h2>

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search tickets..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        {["all", "open", "replied", "resolved"].map(s => (
          <Button key={s} variant={filterStatus === s ? "default" : "outline"} size="sm" onClick={() => setFilterStatus(s)} className="capitalize">{s}</Button>
        ))}
      </div>

      {filteredTickets.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No tickets found.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filteredTickets.map(t => (
            <Card key={t.id} className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => openTicket(t)}>
              <CardContent className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs text-muted-foreground">{profiles[t.user_id] || t.user_id.slice(0, 8)}</span>
                  </div>
                  <p className="font-medium text-foreground truncate">{t.subject}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{new Date(t.created_at).toLocaleDateString()}</p>
                </div>
                <Badge variant={t.status === "resolved" ? "default" : t.status === "replied" ? "secondary" : "outline"}>
                  {t.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedTicket?.subject}</DialogTitle>
            <DialogDescription className="sr-only">Ticket details</DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div className="text-sm">
                <p className="text-muted-foreground">From: <span className="text-foreground">{profiles[selectedTicket.user_id] || selectedTicket.user_id}</span></p>
                <p className="text-muted-foreground text-xs">ID: <span className="font-mono">{selectedTicket.user_id}</span></p>
              </div>
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm text-foreground whitespace-pre-wrap">{selectedTicket.message}</p>
              </div>
              <div className="space-y-1.5">
                <Label>Admin Reply</Label>
                <Textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="Type your reply..." rows={4} />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 gap-2" onClick={() => sendReply("replied")}>
                  <Send className="h-4 w-4" /> Send Reply
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => sendReply("resolved")}>
                  <Check className="h-4 w-4" /> Resolve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSupport;
