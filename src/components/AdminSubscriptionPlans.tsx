import { useState, useEffect } from "react";
import {
  CreditCard, Check, Plus, Loader2, Edit2, Trash2, ToggleLeft, ToggleRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PlanLimits {
  tasks: number; transactions: number; summaries: number;
  channels: number; goals: number; notes: number;
}

interface Plan {
  id: string; name: string; description: string; price: number;
  duration_days: number; features: string[]; is_active: boolean;
  sort_order: number; currency: string; limits: PlanLimits;
  is_popular: boolean; limit_period: string; duration_months: number | null;
}

const DEFAULT_LIMITS: PlanLimits = { tasks: 5, transactions: 10, summaries: 5, channels: 1, goals: 2, notes: 5 };

const AdminSubscriptionPlans = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [pName, setPName] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pPrice, setPPrice] = useState("");
  const [pDays, setPDays] = useState("30");
  const [pFeatures, setPFeatures] = useState("");
  const [pOrder, setPOrder] = useState("0");
  const [pCurrency, setPCurrency] = useState("BDT");
  const [pLimits, setPLimits] = useState<PlanLimits>(DEFAULT_LIMITS);
  const [pPopular, setPPopular] = useState(false);
  const [pLimitPeriod, setPLimitPeriod] = useState("monthly");
  const [pDurationMonths, setPDurationMonths] = useState("");

  useEffect(() => { loadPlans(); }, []);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from("subscription_plans").select("*").order("sort_order");
      if (data) setPlans(data as any[]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditPlan(null); setPName(""); setPDesc(""); setPPrice(""); setPDays("30");
    setPFeatures(""); setPOrder("0"); setPCurrency("BDT"); setPLimits(DEFAULT_LIMITS);
    setDialogOpen(true);
  };

  const openEdit = (plan: Plan) => {
    setEditPlan(plan); setPName(plan.name); setPDesc(plan.description); setPPrice(plan.price.toString());
    setPDays(plan.duration_days.toString()); setPFeatures((plan.features as string[]).join("\n"));
    setPOrder(plan.sort_order.toString()); setPCurrency(plan.currency || "BDT");
    setPLimits(plan.limits && Object.keys(plan.limits).length > 0 ? plan.limits : DEFAULT_LIMITS);
    setDialogOpen(true);
  };

  const updateLimit = (key: keyof PlanLimits, value: string) => {
    const num = value === "" ? 0 : parseInt(value);
    setPLimits({ ...pLimits, [key]: isNaN(num) ? 0 : num });
  };

  const toggleUnlimitedLimit = (key: keyof PlanLimits) => {
    setPLimits({ ...pLimits, [key]: pLimits[key] === -1 ? 5 : -1 });
  };

  const toggleUnlimitedDuration = () => {
    setPDays(pDays === "-1" ? "30" : "-1");
  };

  const save = async () => {
    if (!pName.trim()) return;
    const features = pFeatures.split("\n").map(f => f.trim()).filter(Boolean);
    const planData: any = {
      name: pName.trim(), description: pDesc.trim(), price: parseFloat(pPrice) || 0,
      duration_days: parseInt(pDays) || 30, features, sort_order: parseInt(pOrder) || 0,
      is_active: true, currency: pCurrency, limits: pLimits,
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
      setDialogOpen(false);
    } catch (e) { toast.error("Failed to save plan"); }
  };

  const toggleActive = async (plan: Plan) => {
    try {
      const { error } = await supabase.from("subscription_plans").update({ is_active: !plan.is_active }).eq("id", plan.id);
      if (error) throw error;
      setPlans(plans.map(p => p.id === plan.id ? { ...p, is_active: !plan.is_active } : p));
      toast.success(plan.is_active ? "Plan deactivated!" : "Plan activated!");
    } catch (e) { toast.error("Failed to update plan"); }
  };

  const deletePlan = async (id: string) => {
    try {
      await supabase.from("subscription_plans").delete().eq("id", id);
      setPlans(plans.filter(p => p.id !== id));
      toast.success("Plan deleted!");
    } catch (e) { toast.error("Failed to delete plan"); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const bdtPlans = plans.filter(p => (p.currency || "BDT") === "BDT");
  const usdPlans = plans.filter(p => (p.currency || "BDT") === "USD");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-primary" /> Subscription Plans
        </h2>
        <Button onClick={openAdd} size="sm" className="gap-1"><Plus className="h-4 w-4" /> Add Plan</Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Plans manage করুন। Currency অনুযায়ী আলাদা plans দেখাবে। Limits set করে feature access control করুন। -1 মানে unlimited।
      </p>

      {/* BDT Plans */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3">🇧🇩 BDT Plans</h3>
        {bdtPlans.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">No BDT plans yet.</CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bdtPlans.map(plan => renderPlanCard(plan))}
          </div>
        )}
      </div>

      {/* USD Plans */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3">🇺🇸 USD Plans</h3>
        {usdPlans.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">No USD plans yet.</CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {usdPlans.map(plan => renderPlanCard(plan))}
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editPlan ? "Edit Plan" : "Create Plan"}</DialogTitle>
            <DialogDescription className="sr-only">Plan form</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Plan Name *</Label><Input value={pName} onChange={e => setPName(e.target.value)} placeholder="e.g. Pro Plan" /></div>
              <div className="space-y-1.5">
                <Label>Currency *</Label>
                <Select value={pCurrency} onValueChange={setPCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BDT">🇧🇩 BDT (৳)</SelectItem>
                    <SelectItem value="USD">🇺🇸 USD ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>Description</Label><Input value={pDesc} onChange={e => setPDesc(e.target.value)} placeholder="Short description" /></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label>Price ({pCurrency === "BDT" ? "৳" : "$"})</Label><Input type="number" value={pPrice} onChange={e => setPPrice(e.target.value)} /></div>
              <div className="space-y-1.5">
                <Label>Duration (days)</Label>
                <div className="flex gap-1">
                  <Input type="number" value={pDays === "-1" ? "" : pDays} onChange={e => setPDays(e.target.value)} disabled={pDays === "-1"} placeholder={pDays === "-1" ? "∞" : ""} />
                  <Button type="button" variant={pDays === "-1" ? "default" : "outline"} size="sm" className="shrink-0 text-xs h-9" onClick={toggleUnlimitedDuration}>∞</Button>
                </div>
              </div>
              <div className="space-y-1.5"><Label>Sort Order</Label><Input type="number" value={pOrder} onChange={e => setPOrder(e.target.value)} /></div>
            </div>
            <div className="space-y-1.5">
              <Label>Features (one per line)</Label>
              <Textarea value={pFeatures} onChange={e => setPFeatures(e.target.value)} placeholder="Unlimited summaries&#10;Priority support&#10;..." rows={4} />
            </div>
            {/* Feature Limits */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Feature Limits (-1 = unlimited)</Label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(pLimits) as (keyof PlanLimits)[]).map(key => (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs capitalize">{key}</Label>
                    <div className="flex gap-1">
                      <Input type="number" value={pLimits[key] === -1 ? "" : pLimits[key]} onChange={e => updateLimit(key, e.target.value)} className="h-8 text-sm" disabled={pLimits[key] === -1} placeholder={pLimits[key] === -1 ? "∞" : ""} />
                      <Button type="button" variant={pLimits[key] === -1 ? "default" : "outline"} size="sm" className="shrink-0 text-xs h-8 px-2" onClick={() => toggleUnlimitedLimit(key)}>∞</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={save} disabled={!pName.trim()} className="gap-2"><Check className="h-4 w-4" /> {editPlan ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  function renderPlanCard(plan: Plan) {
    const limits = plan.limits || {};
    return (
      <Card key={plan.id} className="hover:border-primary/30 transition-colors">
        <CardContent className="pt-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-foreground text-lg">{plan.name}</h4>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs">{plan.currency || "BDT"}</Badge>
              <Badge variant={plan.is_active ? "default" : "secondary"}>{plan.is_active ? "Active" : "Inactive"}</Badge>
            </div>
          </div>
          {plan.description && <p className="text-sm text-muted-foreground">{plan.description}</p>}
          <p className="text-2xl font-bold text-primary">
            {(plan.currency || "BDT") === "USD" ? "$" : "৳"}{plan.price}
            <span className="text-sm text-muted-foreground font-normal"> / {plan.duration_days === -1 ? "Unlimited" : `${plan.duration_days} days`}</span>
          </p>
          {/* Limits display */}
          {Object.keys(limits).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {Object.entries(limits).map(([k, v]) => (
                <Badge key={k} variant="outline" className="text-xs capitalize">
                  {k}: {(v as number) === -1 ? "∞" : String(v)}
                </Badge>
              ))}
            </div>
          )}
          <ul className="space-y-1.5">
            {(plan.features as string[]).map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />{f}
              </li>
            ))}
          </ul>
          <div className="flex gap-2 pt-2">
            <Button variant={plan.is_active ? "outline" : "default"} size="sm" className="gap-1 flex-1" onClick={() => toggleActive(plan)}>
              {plan.is_active ? <ToggleRight className="h-3 w-3" /> : <ToggleLeft className="h-3 w-3" />}
              {plan.is_active ? "Deactivate" : "Activate"}
            </Button>
            <Button variant="outline" size="sm" className="gap-1" onClick={() => openEdit(plan)}>
              <Edit2 className="h-3 w-3" />
            </Button>
            <Button variant="destructive" size="sm" className="gap-1" onClick={() => deletePlan(plan.id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
};

export default AdminSubscriptionPlans;
