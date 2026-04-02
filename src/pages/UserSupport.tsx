import { useState, useEffect } from "react";
import { HeadphonesIcon, Plus, Send, Clock, Check, Loader2, MessageSquare, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Ticket {
  id: string; user_id: string; subject: string; message: string;
  status: string; admin_reply: string; created_at: string; updated_at: string;
}

const UserSupport = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [viewTicket, setViewTicket] = useState<Ticket | null>(null);

  useEffect(() => { if (user) loadTickets(); }, [user]);

  const loadTickets = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await supabase.from("support_tickets").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (data) setTickets(data as any[]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const submitTicket = async () => {
    if (!subject.trim() || !message.trim() || !user) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.from("support_tickets").insert({
        user_id: user.id, subject: subject.trim(), message: message.trim(),
      } as any).select().single();
      if (error) throw error;
      if (data) setTickets([data as any, ...tickets]);
      setDialogOpen(false); setSubject(""); setMessage("");
      toast.success("Support ticket submitted!");
    } catch (e) { toast.error("Failed to submit ticket"); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <HeadphonesIcon className="h-6 w-6 text-primary" /> Support
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Get help from our team</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> New Ticket</Button>
      </div>

      {/* Contact Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <Phone className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <p className="font-semibold text-foreground">WhatsApp</p>
              <a href="https://wa.me/8801XXXXXXXXX" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">+880 1XXXXXXXXX</a>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Mail className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Email</p>
              <a href="mailto:support@vidmind.app" className="text-sm text-primary hover:underline">support@vidmind.app</a>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tickets */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Your Tickets</h2>
        {tickets.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No tickets yet. Create one if you need help!</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {tickets.map(t => (
              <Card key={t.id} className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setViewTicket(t)}>
                <CardContent className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">{t.subject}</p>
                    <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</p>
                  </div>
                  <Badge variant={t.status === "resolved" ? "default" : t.status === "replied" ? "secondary" : "outline"}>
                    {t.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* View Ticket Dialog */}
      <Dialog open={!!viewTicket} onOpenChange={() => setViewTicket(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewTicket?.subject}</DialogTitle>
            <DialogDescription className="sr-only">Ticket details</DialogDescription>
          </DialogHeader>
          {viewTicket && (
            <div className="space-y-4">
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">Your message:</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{viewTicket.message}</p>
              </div>
              {viewTicket.admin_reply && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <p className="text-xs text-primary mb-1 font-medium">Admin Reply:</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{viewTicket.admin_reply}</p>
                </div>
              )}
              <Badge variant={viewTicket.status === "resolved" ? "default" : "outline"}>{viewTicket.status}</Badge>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New Ticket Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Support Ticket</DialogTitle>
            <DialogDescription>Describe your issue and we'll get back to you</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Subject *</Label>
              <Input placeholder="Brief description of your issue..." value={subject} onChange={e => setSubject(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Message *</Label>
              <Textarea placeholder="Explain in detail..." value={message} onChange={e => setMessage(e.target.value)} rows={5} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={submitTicket} disabled={submitting || !subject.trim() || !message.trim()} className="w-full gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Submit Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserSupport;
