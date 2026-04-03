import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Users, DollarSign, Eye, Pencil } from "lucide-react";

interface Affiliate {
  id: string;
  user_id: string;
  referral_code: string;
  commission_percent: number;
  total_earnings: number;
  total_referrals: number;
  status: string;
  created_at: string;
  email?: string;
}

interface Referral {
  id: string;
  affiliate_id: string;
  referred_user_id: string;
  commission_amount: number;
  status: string;
  created_at: string;
}

const AdminAffiliates = () => {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editCommission, setEditCommission] = useState(10);
  const [editStatus, setEditStatus] = useState("active");
  const [viewReferrals, setViewReferrals] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: affData } = await supabase.from("affiliates").select("*").order("created_at", { ascending: false });
    const { data: profiles } = await supabase.from("profiles").select("id, email");
    const profileMap: Record<string, string> = {};
    (profiles || []).forEach((p: any) => { profileMap[p.id] = p.email || ""; });
    const enriched = (affData as any[] || []).map(a => ({ ...a, email: profileMap[a.user_id] || a.user_id }));
    setAffiliates(enriched);
    setLoading(false);
  };

  const loadReferrals = async (affiliateId: string) => {
    const { data } = await supabase.from("affiliate_referrals").select("*").eq("affiliate_id", affiliateId).order("created_at", { ascending: false });
    setReferrals((data as any[]) || []);
  };

  const openEdit = (a: Affiliate) => {
    setSelectedAffiliate(a);
    setEditCommission(a.commission_percent);
    setEditStatus(a.status);
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!selectedAffiliate) return;
    const { error } = await supabase.from("affiliates").update({
      commission_percent: editCommission,
      status: editStatus,
    } as any).eq("id", selectedAffiliate.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Updated!");
    setEditOpen(false);
    loadData();
  };

  const openReferrals = async (a: Affiliate) => {
    setSelectedAffiliate(a);
    await loadReferrals(a.id);
    setViewReferrals(true);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Affiliates</h2>
        <Badge variant="secondary">{affiliates.length} total</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6 text-center">
          <p className="text-3xl font-bold text-foreground">{affiliates.length}</p>
          <p className="text-sm text-muted-foreground">Total Affiliates</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <p className="text-3xl font-bold text-foreground">{affiliates.filter(a => a.status === "active").length}</p>
          <p className="text-sm text-muted-foreground">Active</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <p className="text-3xl font-bold text-foreground">৳{affiliates.reduce((s, a) => s + Number(a.total_earnings), 0)}</p>
          <p className="text-sm text-muted-foreground">Total Payouts</p>
        </CardContent></Card>
      </div>

      {affiliates.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No affiliates yet.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {affiliates.map(a => (
            <Card key={a.id}>
              <CardContent className="py-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <p className="font-medium text-foreground text-sm">{a.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Code: <code className="text-primary">{a.referral_code}</code> · {a.commission_percent}% commission · {a.total_referrals} referrals · ৳{a.total_earnings} earned
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={a.status === "active" ? "default" : a.status === "suspended" ? "destructive" : "secondary"}>{a.status}</Badge>
                  <Button size="icon" variant="ghost" onClick={() => openReferrals(a)}><Eye className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Edit Affiliate</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Commission %</Label>
              <Input type="number" value={editCommission} onChange={e => setEditCommission(Number(e.target.value))} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Referrals Dialog */}
      <Dialog open={viewReferrals} onOpenChange={setViewReferrals}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Referrals — {selectedAffiliate?.email}</DialogTitle></DialogHeader>
          {referrals.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">No referrals yet.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {referrals.map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm text-foreground">User: {r.referred_user_id.slice(0, 8)}...</p>
                    <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">৳{r.commission_amount}</p>
                    <Badge variant={r.status === "paid" ? "default" : "secondary"} className="text-xs">{r.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAffiliates;
