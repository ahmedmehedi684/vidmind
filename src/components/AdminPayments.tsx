import { useState, useEffect } from "react";
import {
  CreditCard, Loader2, Search, Clock,
  CheckCircle2, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Plan {
  id: string; name: string; price: number; duration_days: number; currency: string;
}

interface PaymentOrder {
  id: string; user_id: string; subscription_id: string; plan_id: string;
  amount: number; payment_method: string; transaction_id: string;
  payment_number: string; status: string; admin_note: string; created_at: string;
}

interface Subscription {
  id: string; user_id: string; plan_id: string; status: string;
  starts_at: string | null; expires_at: string | null;
}

interface UserProfile {
  id: string; email: string; name: string;
}

const AdminPayments = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});

  // For note dialog before confirm/reject
  const [actionOrder, setActionOrder] = useState<PaymentOrder | null>(null);
  const [actionType, setActionType] = useState<"confirmed" | "rejected">("confirmed");
  const [adminNote, setAdminNote] = useState("");
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [plansRes, ordersRes, profilesRes, subsRes] = await Promise.all([
        supabase.from("subscription_plans").select("id, name, price, duration_days, currency"),
        supabase.from("payment_orders").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("id, email, name"),
        supabase.from("subscriptions").select("*"),
      ]);
      if (plansRes.data) setPlans(plansRes.data as any[]);
      if (ordersRes.data) setOrders(ordersRes.data as any[]);
      if (subsRes.data) setSubscriptions(subsRes.data as any[]);
      if (profilesRes.data) {
        const map: Record<string, UserProfile> = {};
        (profilesRes.data as any[]).forEach(p => { map[p.id] = p; });
        setProfiles(map);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const startAction = (order: PaymentOrder, type: "confirmed" | "rejected") => {
    setActionOrder(order);
    setActionType(type);
    setAdminNote(order.admin_note || "");
    setNoteDialogOpen(true);
  };

  const executeAction = async () => {
    if (!actionOrder) return;
    try {
      await supabase.from("payment_orders").update({
        status: actionType, admin_note: adminNote.trim(), updated_at: new Date().toISOString()
      } as any).eq("id", actionOrder.id);
      if (actionType === "confirmed" && actionOrder.subscription_id) {
        const plan = plans.find(p => p.id === actionOrder.plan_id);
        const now = new Date();
        const expires = new Date(now.getTime() + (plan?.duration_days || 30) * 24 * 60 * 60 * 1000);
        await supabase.from("subscriptions").update({
          status: "active", starts_at: now.toISOString(), expires_at: expires.toISOString(),
          updated_at: now.toISOString(),
        } as any).eq("id", actionOrder.subscription_id);
      }
      setNoteDialogOpen(false);
      toast.success(`Order ${actionType}!`);
      loadData();
    } catch (e) { toast.error("Failed to update order"); }
  };

  const getPlanName = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    return plan ? plan.name : "Unknown";
  };

  const getPlanCurrency = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    return plan?.currency || "BDT";
  };

  const getSubExpiry = (subId: string) => {
    const sub = subscriptions.find(s => s.id === subId);
    return sub?.expires_at ? new Date(sub.expires_at).toLocaleDateString() : "N/A";
  };

  const filteredOrders = orders.filter(o => {
    if (filterStatus !== "all" && o.status !== filterStatus) return false;
    if (search.trim()) {
      const s = search.toLowerCase();
      const profile = profiles[o.user_id];
      return (o.transaction_id || "").toLowerCase().includes(s) ||
        (o.payment_number || "").toLowerCase().includes(s) ||
        (profile?.email || "").toLowerCase().includes(s) ||
        (profile?.name || "").toLowerCase().includes(s);
    }
    return true;
  });

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-primary" /> Payment Orders
        </h2>
        <Badge variant="outline">{orders.length} total</Badge>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by TxID, number, email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        {["all", "pending", "confirmed", "rejected"].map(s => (
          <Button key={s} variant={filterStatus === s ? "default" : "outline"} size="sm" onClick={() => setFilterStatus(s)} className="capitalize">{s}</Button>
        ))}
      </div>

      <div className="rounded-md border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>TxID</TableHead>
              <TableHead>Pay Number</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground py-8">No orders found.</TableCell>
              </TableRow>
            ) : filteredOrders.map(o => {
              const profile = profiles[o.user_id];
              const cur = getPlanCurrency(o.plan_id);
              const sym = cur === "USD" ? "$" : "৳";
              return (
                <TableRow key={o.id}>
                  <TableCell>
                    <div className="min-w-[120px]">
                      <p className="font-medium text-foreground text-sm truncate">{profile?.name || "—"}</p>
                      <p className="text-xs text-muted-foreground truncate">{profile?.email || o.user_id.slice(0, 8)}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{getPlanName(o.plan_id)}</TableCell>
                  <TableCell className="text-sm font-medium">{sym}{o.amount}</TableCell>
                  <TableCell className="text-sm capitalize">{o.payment_method}</TableCell>
                  <TableCell className="text-xs font-mono max-w-[100px] truncate">{o.transaction_id || "—"}</TableCell>
                  <TableCell className="text-xs">{o.payment_number || "—"}</TableCell>
                  <TableCell className="text-xs">{getSubExpiry(o.subscription_id)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(o.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={o.status === "confirmed" ? "default" : o.status === "rejected" ? "destructive" : "secondary"}>
                      {o.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {o.status === "pending" ? (
                      <div className="flex gap-1">
                        <Button size="sm" variant="default" className="h-7 px-2 text-xs gap-1" onClick={() => startAction(o, "confirmed")}>
                          <CheckCircle2 className="h-3 w-3" /> Confirm
                        </Button>
                        <Button size="sm" variant="destructive" className="h-7 px-2 text-xs gap-1" onClick={() => startAction(o, "rejected")}>
                          <X className="h-3 w-3" /> Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Note dialog for confirm/reject */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{actionType === "confirmed" ? "Confirm" : "Reject"} Order</DialogTitle>
            <DialogDescription>Add an optional note before proceeding.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Admin Note</Label>
            <Textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="Optional note..." rows={2} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>Cancel</Button>
            <Button variant={actionType === "confirmed" ? "default" : "destructive"} onClick={executeAction}>
              {actionType === "confirmed" ? "Confirm" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPayments;
