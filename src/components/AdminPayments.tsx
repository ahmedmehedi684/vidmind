import { useState, useEffect } from "react";
import {
  CreditCard, Check, X, Loader2, Search, Eye, Clock,
  CheckCircle2, AlertCircle, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Plan {
  id: string; name: string; description: string; price: number;
  duration_days: number; features: string[]; is_active: boolean; sort_order: number;
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

  // Plan form
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [pName, setPName] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pPrice, setPPrice] = useState("");
  const [pDays, setPDays] = useState("30");
  const [pFeatures, setPFeatures] = useState("");
  const [pOrder, setPOrder] = useState("0");

  // Order detail
  const [selectedOrder, setSelectedOrder] = useState<PaymentOrder | null>(null);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [profiles, setProfiles] = useState<Record<string, string>>({});

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [plansRes, ordersRes, profilesRes] = await Promise.all([
        supabase.from("subscription_plans").select("*").order("sort_order"),
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

  const openAddPlan = () => {
    setEditPlan(null); setPName(""); setPDesc(""); setPPrice(""); setPDays("30"); setPFeatures(""); setPOrder("0"); setPlanDialogOpen(true);
  };

  const openEditPlan = (plan: Plan) => {
    setEditPlan(plan); setPName(plan.name); setPDesc(plan.description); setPPrice(plan.price.toString());
    setPDays(plan.duration_days.toString()); setPFeatures((plan.features as string[]).join("\n")); setPOrder(plan.sort_order.toString());
    setPlanDialogOpen(true);
  };

  const savePlan = async () => {
    if (!pName.trim()) return;
    const features = pFeatures.split("\n").map(f => f.trim()).filter(Boolean);
    const planData: any = {
      name: pName.trim(), description: pDesc.trim(), price: parseFloat(pPrice) || 0,
      duration_days: parseInt(pDays) || 30, features, sort_order: parseInt(pOrder) || 0, is_active: true,
    };
    try {
      if (editPlan) {
        const { error } = await supabase.from("subscription_plans").update(planData).eq("id", editPlan.id);
        if (error) throw error;
        setPlans(plans.map(p => p.id === editPlan.id ? { ...p, ...planData } : p));
        toast.success("Plan updated!");
      } else {
        const { data, error } = await supabase.from("subscription_plans").insert(planData).select().single();
        if (error) throw error;
        if (data) setPlans([...plans, data as any]);
        toast.success("Plan created!");
      }
      setPlanDialogOpen(false);
    } catch (e) { toast.error("Failed to save plan"); }
  };

  const deletePlan = async (id: string) => {
    try {
      await supabase.from("subscription_plans").delete().eq("id", id);
      setPlans(plans.filter(p => p.id !== id));
      toast.success("Plan deleted!");
    } catch (e) { toast.error("Failed to delete plan"); }
  };

  const openOrder = (order: PaymentOrder) => {
    setSelectedOrder(order); setAdminNote(order.admin_note || ""); setOrderDialogOpen(true);
  };

  const updateOrderStatus = async (status: "confirmed" | "rejected") => {
    if (!selectedOrder) return;
    try {
      // Update payment order
      await supabase.from("payment_orders").update({
        status, admin_note: adminNote.trim(), updated_at: new Date().toISOString()
      } as any).eq("id", selectedOrder.id);

      // If confirmed, activate subscription
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
      return o.transaction_id.toLowerCase().includes(s) ||
        o.payment_number.toLowerCase().includes(s) ||
        (profiles[o.user_id] || "").toLowerCase().includes(s);
    }
    return true;
  });

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-primary" /> Payment Management
        </h2>
      </div>

      {/* Plans Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-foreground">Subscription Plans</h3>
          <Button onClick={openAddPlan} size="sm" className="gap-1">+ Add Plan</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {plans.map(plan => (
            <Card key={plan.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="pt-5 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-foreground">{plan.name}</h4>
                  <Badge variant={plan.is_active ? "default" : "secondary"}>{plan.is_active ? "Active" : "Inactive"}</Badge>
                </div>
                <p className="text-xl font-bold text-primary">৳{plan.price} <span className="text-xs text-muted-foreground font-normal">/ {plan.duration_days} days</span></p>
                <ul className="space-y-1">
                  {(plan.features as string[]).slice(0, 3).map((f, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <Check className="h-3 w-3 text-primary shrink-0 mt-0.5" />{f}
                    </li>
                  ))}
                </ul>
                <div className="flex gap-1 pt-1">
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => openEditPlan(plan)}>Edit</Button>
                  <Button variant="destructive" size="sm" className="h-7 text-xs" onClick={() => deletePlan(plan.id)}>Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Orders Section */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3">Payment Orders</h3>
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
      </div>

      {/* Plan Dialog */}
      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editPlan ? "Edit Plan" : "Create Plan"}</DialogTitle>
            <DialogDescription className="sr-only">Plan form</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Plan Name *</Label><Input value={pName} onChange={e => setPName(e.target.value)} placeholder="e.g. Pro Plan" /></div>
            <div className="space-y-1.5"><Label>Description</Label><Input value={pDesc} onChange={e => setPDesc(e.target.value)} placeholder="Short description" /></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label>Price (৳)</Label><Input type="number" value={pPrice} onChange={e => setPPrice(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Duration (days)</Label><Input type="number" value={pDays} onChange={e => setPDays(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Sort Order</Label><Input type="number" value={pOrder} onChange={e => setPOrder(e.target.value)} /></div>
            </div>
            <div className="space-y-1.5">
              <Label>Features (one per line)</Label>
              <Textarea value={pFeatures} onChange={e => setPFeatures(e.target.value)} placeholder="Unlimited summaries&#10;Priority support&#10;..." rows={5} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={savePlan} disabled={!pName.trim()} className="gap-2"><Check className="h-4 w-4" /> {editPlan ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
