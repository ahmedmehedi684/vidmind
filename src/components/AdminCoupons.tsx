import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Ticket, Copy } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_purchase: number;
  max_uses: number;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);

  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState(0);
  const [minPurchase, setMinPurchase] = useState(0);
  const [maxUses, setMaxUses] = useState(-1);
  const [expiresAt, setExpiresAt] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => { loadCoupons(); }, []);

  const loadCoupons = async () => {
    setLoading(true);
    const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
    setCoupons((data as any[]) || []);
    setLoading(false);
  };

  const openAdd = () => {
    setEditing(null);
    setCode("");
    setDiscountType("percentage");
    setDiscountValue(0);
    setMinPurchase(0);
    setMaxUses(-1);
    setExpiresAt("");
    setIsActive(true);
    setDialogOpen(true);
  };

  const openEdit = (c: Coupon) => {
    setEditing(c);
    setCode(c.code);
    setDiscountType(c.discount_type);
    setDiscountValue(c.discount_value);
    setMinPurchase(c.min_purchase);
    setMaxUses(c.max_uses);
    setExpiresAt(c.expires_at ? c.expires_at.split("T")[0] : "");
    setIsActive(c.is_active);
    setDialogOpen(true);
  };

  const save = async () => {
    if (!code.trim()) { toast.error("Code is required"); return; }
    const payload: any = {
      code: code.trim().toUpperCase(),
      discount_type: discountType,
      discount_value: discountValue,
      min_purchase: minPurchase,
      max_uses: maxUses,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      is_active: isActive,
    };
    if (editing) {
      const { error } = await supabase.from("coupons").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Coupon updated!");
    } else {
      const { error } = await supabase.from("coupons").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Coupon created!");
    }
    setDialogOpen(false);
    loadCoupons();
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    await supabase.from("coupons").delete().eq("id", id);
    toast.success("Deleted");
    loadCoupons();
  };

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "VM";
    for (let i = 0; i < 6; i++) result += chars[Math.floor(Math.random() * chars.length)];
    setCode(result);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2"><Ticket className="h-5 w-5 text-primary" /> Coupons</h2>
        <Button onClick={openAdd} size="sm"><Plus className="h-4 w-4 mr-1" /> Add Coupon</Button>
      </div>

      {coupons.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No coupons yet.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {coupons.map(c => (
            <Card key={c.id} className={`${!c.is_active ? "opacity-60" : ""}`}>
              <CardContent className="py-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Ticket className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="font-bold text-foreground text-sm">{c.code}</code>
                      <button onClick={() => { navigator.clipboard.writeText(c.code); toast.success("Copied!"); }}>
                        <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                      </button>
                      {c.is_active ? <Badge className="bg-green-500/10 text-green-500 text-xs">Active</Badge> : <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {c.discount_type === "percentage" ? `${c.discount_value}% off` : `৳${c.discount_value} off`}
                      {c.max_uses > 0 && ` · ${c.used_count}/${c.max_uses} used`}
                      {c.max_uses === -1 && ` · ${c.used_count} used (unlimited)`}
                      {c.expires_at && ` · Expires: ${new Date(c.expires_at).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteCoupon(c.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Coupon" : "Create Coupon"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Coupon Code</Label>
              <div className="flex gap-2">
                <Input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="e.g. SAVE20" />
                <Button variant="outline" size="sm" onClick={generateCode}>Generate</Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Discount Type</Label>
                <Select value={discountType} onValueChange={setDiscountType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Value</Label>
                <Input type="number" value={discountValue} onChange={e => setDiscountValue(Number(e.target.value))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Min Purchase</Label>
                <Input type="number" value={minPurchase} onChange={e => setMinPurchase(Number(e.target.value))} />
              </div>
              <div>
                <Label>Max Uses (-1 = unlimited)</Label>
                <Input type="number" value={maxUses} onChange={e => setMaxUses(Number(e.target.value))} />
              </div>
            </div>
            <div>
              <Label>Expires At (optional)</Label>
              <Input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCoupons;
