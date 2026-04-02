import { useState, useEffect } from "react";
import {
  CreditCard, Check, Plus, Loader2, Edit2, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PaymentMethod {
  id: string; name: string; currency: string; account_number: string;
  account_name: string; instructions: string; icon: string;
  is_active: boolean; sort_order: number;
}

const AdminPaymentMethods = () => {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMethod, setEditMethod] = useState<PaymentMethod | null>(null);
  const [mName, setMName] = useState("");
  const [mCurrency, setMCurrency] = useState("BDT");
  const [mAccountNumber, setMAccountNumber] = useState("");
  const [mAccountName, setMAccountName] = useState("");
  const [mInstructions, setMInstructions] = useState("");
  const [mIcon, setMIcon] = useState("📱");
  const [mOrder, setMOrder] = useState("0");

  useEffect(() => { loadMethods(); }, []);

  const loadMethods = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from("payment_methods").select("*").order("sort_order");
      if (data) setMethods(data as any[]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditMethod(null); setMName(""); setMCurrency("BDT"); setMAccountNumber("");
    setMAccountName(""); setMInstructions(""); setMIcon("📱"); setMOrder("0"); setDialogOpen(true);
  };

  const openEdit = (m: PaymentMethod) => {
    setEditMethod(m); setMName(m.name); setMCurrency(m.currency); setMAccountNumber(m.account_number);
    setMAccountName(m.account_name); setMInstructions(m.instructions); setMIcon(m.icon);
    setMOrder(m.sort_order.toString()); setDialogOpen(true);
  };

  const save = async () => {
    if (!mName.trim()) return;
    const data: any = {
      name: mName.trim(), currency: mCurrency, account_number: mAccountNumber.trim(),
      account_name: mAccountName.trim(), instructions: mInstructions.trim(),
      icon: mIcon, sort_order: parseInt(mOrder) || 0, is_active: true,
    };
    try {
      if (editMethod) {
        const { error } = await supabase.from("payment_methods").update(data).eq("id", editMethod.id);
        if (error) throw error;
        setMethods(methods.map(m => m.id === editMethod.id ? { ...m, ...data } : m));
        toast.success("Payment method updated!");
      } else {
        const { data: newData, error } = await supabase.from("payment_methods").insert(data).select().single();
        if (error) throw error;
        if (newData) setMethods([...methods, newData as any]);
        toast.success("Payment method added!");
      }
      setDialogOpen(false);
    } catch (e) { toast.error("Failed to save"); }
  };

  const deleteMethod = async (id: string) => {
    try {
      await supabase.from("payment_methods").delete().eq("id", id);
      setMethods(methods.filter(m => m.id !== id));
      toast.success("Deleted!");
    } catch (e) { toast.error("Failed to delete"); }
  };

  const bdtMethods = methods.filter(m => m.currency === "BDT");
  const usdMethods = methods.filter(m => m.currency === "USD");

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-primary" /> Payment Methods
        </h2>
        <Button onClick={openAdd} size="sm" className="gap-1"><Plus className="h-4 w-4" /> Add Method</Button>
      </div>

      {/* BDT Methods */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">🇧🇩 BDT (Bangladesh)</h3>
        {bdtMethods.length === 0 ? (
          <Card><CardContent className="py-6 text-center text-muted-foreground">No BDT methods. Add bKash, Nagad, etc.</CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {bdtMethods.map(m => (
              <Card key={m.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="pt-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{m.icon}</span>
                      <h4 className="font-bold text-foreground">{m.name}</h4>
                    </div>
                    <Badge variant={m.is_active ? "default" : "secondary"}>{m.is_active ? "Active" : "Inactive"}</Badge>
                  </div>
                  <div className="text-sm space-y-1">
                    <p className="text-muted-foreground">Number: <span className="text-foreground font-medium">{m.account_number}</span></p>
                    <p className="text-muted-foreground">Name: <span className="text-foreground font-medium">{m.account_name}</span></p>
                    {m.instructions && <p className="text-xs text-muted-foreground italic">{m.instructions}</p>}
                  </div>
                  <div className="flex gap-1 pt-1">
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => openEdit(m)}>
                      <Edit2 className="h-3 w-3" /> Edit
                    </Button>
                    <Button variant="destructive" size="sm" className="h-7 text-xs gap-1" onClick={() => deleteMethod(m.id)}>
                      <Trash2 className="h-3 w-3" /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* USD Methods */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">🇺🇸 USD (International)</h3>
        {usdMethods.length === 0 ? (
          <Card><CardContent className="py-6 text-center text-muted-foreground">No USD methods. Add Payoneer, etc.</CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {usdMethods.map(m => (
              <Card key={m.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="pt-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{m.icon}</span>
                      <h4 className="font-bold text-foreground">{m.name}</h4>
                    </div>
                    <Badge variant={m.is_active ? "default" : "secondary"}>{m.is_active ? "Active" : "Inactive"}</Badge>
                  </div>
                  <div className="text-sm space-y-1">
                    <p className="text-muted-foreground">Account: <span className="text-foreground font-medium">{m.account_number}</span></p>
                    <p className="text-muted-foreground">Name: <span className="text-foreground font-medium">{m.account_name}</span></p>
                    {m.instructions && <p className="text-xs text-muted-foreground italic">{m.instructions}</p>}
                  </div>
                  <div className="flex gap-1 pt-1">
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => openEdit(m)}>
                      <Edit2 className="h-3 w-3" /> Edit
                    </Button>
                    <Button variant="destructive" size="sm" className="h-7 text-xs gap-1" onClick={() => deleteMethod(m.id)}>
                      <Trash2 className="h-3 w-3" /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editMethod ? "Edit Payment Method" : "Add Payment Method"}</DialogTitle>
            <DialogDescription className="sr-only">Payment method form</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Name *</Label><Input value={mName} onChange={e => setMName(e.target.value)} placeholder="e.g. bKash" /></div>
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Select value={mCurrency} onValueChange={setMCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BDT">🇧🇩 BDT (Taka)</SelectItem>
                    <SelectItem value="USD">🇺🇸 USD (Dollar)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Account Number</Label><Input value={mAccountNumber} onChange={e => setMAccountNumber(e.target.value)} placeholder="01XXXXXXXXX" /></div>
              <div className="space-y-1.5"><Label>Account Name</Label><Input value={mAccountName} onChange={e => setMAccountName(e.target.value)} placeholder="Your Name" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Icon (emoji)</Label><Input value={mIcon} onChange={e => setMIcon(e.target.value)} placeholder="📱" /></div>
              <div className="space-y-1.5"><Label>Sort Order</Label><Input type="number" value={mOrder} onChange={e => setMOrder(e.target.value)} /></div>
            </div>
            <div className="space-y-1.5">
              <Label>Instructions</Label>
              <Textarea value={mInstructions} onChange={e => setMInstructions(e.target.value)} placeholder="Send Money করুন এই নম্বরে..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={save} disabled={!mName.trim()} className="gap-2"><Check className="h-4 w-4" /> {editMethod ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPaymentMethods;
