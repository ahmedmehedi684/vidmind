import { useState, useEffect } from "react";
import {
  CreditCard, Check, Clock, Loader2, Crown, Star, Zap,
  AlertCircle, CheckCircle2, Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { getPaymentLogo } from "@/lib/payment-logos";

interface Plan {
  id: string; name: string; description: string; price: number;
  duration_days: number; features: string[]; is_active: boolean; sort_order: number;
  currency: string; is_popular?: boolean; limit_period?: string; duration_months?: number | null;
  limits?: any;
}

interface Subscription {
  id: string; user_id: string; plan_id: string; status: string;
  starts_at: string | null; expires_at: string | null; created_at: string;
}

interface PaymentOrder {
  id: string; user_id: string; subscription_id: string; plan_id: string;
  amount: number; payment_method: string; transaction_id: string;
  payment_number: string; status: string; admin_note: string; created_at: string;
}

interface PaymentMethod {
  id: string; name: string; currency: string; account_number: string;
  account_name: string; instructions: string; icon: string;
  is_active: boolean; sort_order: number;
}

const UserSubscription = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [payments, setPayments] = useState<PaymentOrder[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [paymentNumber, setPaymentNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState("BDT");

  useEffect(() => { if (user) loadData(); }, [user]);

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz === "Asia/Dhaka" || tz === "Asia/Dacca") {
        setSelectedCurrency("BDT");
      } else {
        setSelectedCurrency("USD");
      }
    } catch {
      setSelectedCurrency("BDT");
    }
  }, []);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [plansRes, subsRes, payRes, methodsRes] = await Promise.all([
        supabase.from("subscription_plans").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("subscriptions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("payment_orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("payment_methods").select("*").eq("is_active", true).order("sort_order"),
      ]);
      if (plansRes.data) setPlans(plansRes.data as any[]);
      if (subsRes.data) setSubscriptions(subsRes.data as any[]);
      if (payRes.data) setPayments(payRes.data as any[]);
      if (methodsRes.data) setPaymentMethods(methodsRes.data as any[]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const activeSub = subscriptions.find(s => s.status === "active" && s.expires_at && new Date(s.expires_at) > new Date());
  const activePlan = activeSub ? plans.find(p => p.id === activeSub.plan_id) : null;

  // Filter plans by selected currency
  const currencyPlans = plans.filter(p => (p.currency || "BDT") === selectedCurrency);
  const filteredMethods = paymentMethods.filter(m => m.currency === selectedCurrency);
  const selectedMethodObj = paymentMethods.find(m => m.name.toLowerCase() === paymentMethod);

  const getDaysRemaining = () => {
    if (!activeSub?.expires_at) return 0;
    const diff = new Date(activeSub.expires_at).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const getDaysUsed = () => {
    if (!activeSub?.starts_at || !activeSub?.expires_at) return 0;
    const total = new Date(activeSub.expires_at).getTime() - new Date(activeSub.starts_at).getTime();
    const used = Date.now() - new Date(activeSub.starts_at).getTime();
    return Math.min(100, Math.max(0, (used / total) * 100));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  const openCheckout = (plan: Plan) => {
    if (plan.price === 0) {
      toast.info("This is a free plan — you already have access!");
      return;
    }
    setSelectedPlan(plan);
    const firstMethod = filteredMethods[0];
    setPaymentMethod(firstMethod ? firstMethod.name.toLowerCase() : "");
    setTransactionId("");
    setPaymentNumber("");
    setCheckoutOpen(true);
  };

  const canSubmit = selectedPlan && user && transactionId.trim() && paymentMethod;

  const handleSubmitPayment = async () => {
    if (!canSubmit) return;
    if (!paymentMethod) {
      toast.error("Please select a payment method first!");
      return;
    }
    setSubmitting(true);
    try {
      const { data: subData, error: subErr } = await supabase.from("subscriptions").insert({
        user_id: user!.id, plan_id: selectedPlan!.id, status: "pending",
      } as any).select().single();
      if (subErr) throw subErr;

      const { error: payErr } = await supabase.from("payment_orders").insert({
        user_id: user!.id,
        subscription_id: (subData as any).id,
        plan_id: selectedPlan!.id,
        amount: selectedPlan!.price,
        payment_method: paymentMethod,
        transaction_id: transactionId.trim(),
        payment_number: paymentNumber.trim(),
        status: "pending",
      } as any);
      if (payErr) throw payErr;

      toast.success("Payment submitted! Admin will verify shortly. Thank you! 🎉");
      setCheckoutOpen(false);
      loadData();
    } catch (e) {
      console.error(e);
      toast.error("Failed to submit payment");
    } finally { setSubmitting(false); }
  };

  const getPlanIcon = (idx: number) => {
    const icons = [Zap, Star, Crown];
    return icons[idx % icons.length];
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-primary" /> Subscription
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your plan and payments</p>
      </div>

      {/* Currency Selector */}
      <div className="flex items-center gap-3">
        <Label className="text-sm">Currency:</Label>
        <div className="flex gap-2">
          {["BDT", "USD"].map(c => (
            <Button key={c} variant={selectedCurrency === c ? "default" : "outline"} size="sm"
              onClick={() => setSelectedCurrency(c)}>
              {c === "BDT" ? "🇧🇩 BDT (৳)" : "🇺🇸 USD ($)"}
            </Button>
          ))}
        </div>
      </div>

      {/* Active Subscription */}
      {activeSub && activePlan && (
        <Card className="border-primary/30">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Badge className="bg-primary text-primary-foreground">Active</Badge>
                <h3 className="text-xl font-bold text-foreground mt-2">{activePlan.name}</h3>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">{getDaysRemaining()}</p>
                <p className="text-xs text-muted-foreground">days remaining</p>
              </div>
            </div>
            <Progress value={getDaysUsed()} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Expires: {new Date(activeSub.expires_at!).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Plans filtered by currency */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {currencyPlans.map((plan, idx) => {
            const Icon = getPlanIcon(idx);
            const isActive = activePlan?.id === plan.id;
            const isPopular = plan.is_popular;
            return (
              <Card key={plan.id} className={`relative hover:border-primary/50 transition-colors ${isActive ? "border-primary" : ""} ${isPopular ? "md:scale-105 md:shadow-lg md:shadow-primary/10 border-primary" : ""}`}>
                {isPopular && <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">Most Popular</Badge>}
                <CardContent className="pt-6 space-y-4">
                  <div className="text-center">
                    <Icon className="h-8 w-8 text-primary mx-auto mb-2" />
                    <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                  </div>
                  <div className="text-center">
                    <span className="text-3xl font-bold text-foreground">{selectedCurrency === "BDT" ? "৳" : "$"}{plan.price}</span>
                    <span className="text-sm text-muted-foreground">
                      /{plan.duration_months ? `${plan.duration_months} month${plan.duration_months > 1 ? "s" : ""}` : plan.duration_days === -1 ? "Unlimited" : `${plan.duration_days} days`}
                    </span>
                  </div>
                  {plan.limit_period && (
                    <p className="text-xs text-center text-muted-foreground">Limits reset {plan.limit_period}</p>
                  )}
                  <ul className="space-y-2">
                    {(plan.features as string[]).map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" variant={isActive ? "outline" : "default"} disabled={isActive}
                    onClick={() => openCheckout(plan)}>
                    {isActive ? "Current Plan" : (plan as any).button_text || (plan.price === 0 ? "Free Access" : "Subscribe Now")}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Payment History */}
      {payments.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Payment History</h2>
          <div className="space-y-2">
            {payments.map(p => (
              <Card key={p.id}>
                <CardContent className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${p.status === "confirmed" ? "bg-green-500/10" : p.status === "rejected" ? "bg-red-500/10" : "bg-amber-500/10"}`}>
                      {p.status === "confirmed" ? <CheckCircle2 className="h-5 w-5 text-green-400" /> : p.status === "rejected" ? <AlertCircle className="h-5 w-5 text-red-400" /> : <Clock className="h-5 w-5 text-amber-400" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{selectedCurrency === "BDT" ? "৳" : "$"}{p.amount} via {p.payment_method}</p>
                      <p className="text-xs text-muted-foreground">TxID: {p.transaction_id} · {new Date(p.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Badge variant={p.status === "confirmed" ? "default" : p.status === "rejected" ? "destructive" : "secondary"}>
                    {p.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
            <DialogDescription>Pay for {selectedPlan?.name} — {selectedCurrency === "BDT" ? "৳" : "$"}{selectedPlan?.price}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Currency toggle */}
            <div className="flex gap-2">
              {["BDT", "USD"].map(c => (
                <Button key={c} variant={selectedCurrency === c ? "default" : "outline"} size="sm" className="flex-1"
                  onClick={() => {
                    setSelectedCurrency(c);
                    const firstMethod = paymentMethods.filter(m => m.currency === c)[0];
                    setPaymentMethod(firstMethod ? firstMethod.name.toLowerCase() : "");
                  }}>
                  {c === "BDT" ? "🇧🇩 BDT" : "🇺🇸 USD"}
                </Button>
              ))}
            </div>

            <div className="space-y-1.5">
              <Label>Payment Method *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                <SelectContent>
                  {filteredMethods.map(m => {
                    const logo = getPaymentLogo(m.name);
                    return (
                      <SelectItem key={m.id} value={m.name.toLowerCase()}>
                        <span className="flex items-center gap-2">
                          {logo ? <img src={logo} alt={m.name} className="h-5 w-5 object-contain rounded" /> : <span>{m.icon}</span>}
                          {m.name}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {!paymentMethod && <p className="text-xs text-destructive">Please select a payment method</p>}
            </div>

            {/* Payment details with copy */}
            {selectedMethodObj && (
              <Card className="bg-muted/30">
                <CardContent className="py-3 text-center space-y-2">
                  <p className="text-sm text-muted-foreground">{selectedMethodObj.instructions || `Send ${selectedCurrency === "BDT" ? "৳" : "$"}${selectedPlan?.price} to:`}</p>
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-lg font-bold text-foreground">{selectedMethodObj.account_number}</p>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => copyToClipboard(selectedMethodObj.account_number)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">({selectedMethodObj.account_name} — {selectedMethodObj.name})</p>
                </CardContent>
              </Card>
            )}

            <div className="space-y-1.5">
              <Label>Your {selectedCurrency === "BDT" ? "Mobile" : "Payment"} Number</Label>
              <Input placeholder={selectedCurrency === "BDT" ? "Your bKash/Nagad number..." : "Your Payoneer email..."} value={paymentNumber} onChange={e => setPaymentNumber(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>Transaction ID *</Label>
              <Input placeholder="Enter transaction ID..." value={transactionId} onChange={e => setTransactionId(e.target.value)} />
            </div>

            <p className="text-xs text-muted-foreground flex items-start gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              After payment, enter the Transaction ID. Admin will verify and activate your subscription.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={handleSubmitPayment} disabled={submitting || !canSubmit} className="w-full gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Submit Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserSubscription;
