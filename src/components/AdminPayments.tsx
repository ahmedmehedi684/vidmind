import { useState, useEffect } from "react";
import {
  CreditCard, X, Loader2, Search, Clock,
  CheckCircle2, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Plan {
  id: string; name: string; price: number; duration_days: number;
}

interface PaymentOrder {
  id: string; user_id: string; subscription_id: string; plan_id: string;
  amount: number; payment_method: string; transaction_id: string;
  payment_number: string; status: string; admin_note: string; created_at: string;
}

const AdminPayments = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [selectedOrder, setSelectedOrder] = useState<PaymentOrder | null>(null);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [profiles, setProfiles] = useState<Record<string, string>>({});

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [plansRes, ordersRes, profilesRes] = await Promise.all([
        supabase.from("subscription_plans").select("id, name, price, duration_days"),
        supabase.from("payment_orders").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("id, email"),
      ]);
      if (plansRes.data) setPlans(plansRes.data as any[]);
      if (ordersRes.data) setOrders(ordersRes.data as any[]);
      if (profilesRes.data) {
        const map: Record<string, string> = {};
        (profilesRes.data as any[]).forEach(p => { map[p.id] = p.email || p.id; });
        setProfiles(map);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openOrder = (order: PaymentOrder) => {
    setSelectedOrder(order); setAdminNote(order.admin_note || ""); setOrderDialogOpen(true);
  };

  const updateOrderStatus = async (status: "confirmed" | "rejected") => {
    if (!selectedOrder) return;
    try {
      await supabase.from("payment_orders").update({
        status, admin_note: adminNote.trim(), updated_at: new Date().toISOString()
      } as any).eq("id", selectedOrder.id);
      if (status === "confirmed" && selectedOrder.subscription_id) {
        const plan = plans.find(p => p.id === selectedOrder.plan_id);
        const now = new Date();
        const expires = new Date(now.getTime() + (plan?.duration_days || 30) * 24 * 60 * 60 * 1000);
        await supabase.from("subscriptions").update({
          status: "active", starts_at: now.toISOString(), expires_at: expires.toISOString(),
          updated_at: now.toISOString(),
        } as any).eq("id", selectedOrder.subscription_id);
      }
      setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, status, admin_note: adminNote } : o));
      setOrderDialogOpen(false);
      toast.success(`Order ${status}!`);
    } catch (e) { toast.error("Failed to update order"); }
  };

  const filteredOrders = orders.filter(o => {
    if (filterStatus !== "all" && o.status !== filterStatus) return false;
    if (search.trim()) {
      const s = search.toLowerCase();
      return (o.transaction_id || "").toLowerCase().includes(s) ||
        (o.payment_number || "").toLowerCase().includes(s) ||
        (profiles[o.user_id] || "").toLowerCase().includes(s);
    }
    return true;
  });

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-primary" /> Payment Orders
        </h2>
        <Badge variant="outline">{orders.length} total orders</Badge>
      </div>

      <div className="flex gap-2 mb-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by TxID, number, email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        {["all", "pending", "confirmed", "rejected"].map(s => (
          <Button key={s} variant={filterStatus === s ? "default" : "outline"} size="sm" onClick={() => setFilterStatus(s)} className="capitalize">{s}</Button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No orders found.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filteredOrders.map(o => (
            <Card key={o.id} className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => openOrder(o)}>
              <CardContent className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${o.status === "confirmed" ? "bg-green-500/10" : o.status === "rejected" ? "bg-red-500/10" : "bg-amber-500/10"}`}>
                    {o.status === "confirmed" ? <CheckCircle2 className="h-5 w-5 text-green-400" /> : o.status === "rejected" ? <X className="h-5 w-5 text-red-400" /> : <Clock className="h-5 w-5 text-amber-400" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm">{profiles[o.user_id] || o.user_id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">৳{o.amount} · {o.payment_method} · TxID: {o.transaction_id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={o.status === "confirmed" ? "default" : o.status === "rejected" ? "destructive" : "secondary"}>{o.status}</Badge>
                  <span className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Order Detail Dialog */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription className="sr-only">Payment order details</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-muted-foreground">User</p><p className="font-medium text-foreground">{profiles[selectedOrder.user_id] || selectedOrder.user_id}</p></div>
                <div><p className="text-muted-foreground">User ID</p><p className="font-medium text-foreground text-xs font-mono">{selectedOrder.user_id}</p></div>
                <div><p className="text-muted-foreground">Amount</p><p className="font-medium text-foreground">৳{selectedOrder.amount}</p></div>
                <div><p className="text-muted-foreground">Method</p><p className="font-medium text-foreground capitalize">{selectedOrder.payment_method}</p></div>
                <div><p className="text-muted-foreground">Transaction ID</p><p className="font-medium text-foreground">{selectedOrder.transaction_id}</p></div>
                <div><p className="text-muted-foreground">Payment Number</p><p className="font-medium text-foreground">{selectedOrder.payment_number || "N/A"}</p></div>
                <div><p className="text-muted-foreground">Status</p><Badge variant={selectedOrder.status === "confirmed" ? "default" : selectedOrder.status === "rejected" ? "destructive" : "secondary"}>{selectedOrder.status}</Badge></div>
                <div><p className="text-muted-foreground">Date</p><p className="font-medium text-foreground">{new Date(selectedOrder.created_at).toLocaleString()}</p></div>
              </div>
              {selectedOrder.status === "pending" && (
                <>
                  <div className="space-y-1.5">
                    <Label>Admin Note</Label>
                    <Textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="Optional note..." rows={2} />
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1 gap-2" onClick={() => updateOrderStatus("confirmed")}>
                      <CheckCircle2 className="h-4 w-4" /> Confirm
                    </Button>
                    <Button variant="destructive" className="flex-1 gap-2" onClick={() => updateOrderStatus("rejected")}>
                      <X className="h-4 w-4" /> Reject
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPayments;
