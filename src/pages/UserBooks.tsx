import { useEffect, useState } from "react";
import {
  BookOpen, Plus, Trash2, Loader2, ExternalLink, Pencil, Library,
  ShoppingCart, Clock, CircleDashed, Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Book {
  id: string;
  title: string;
  author: string | null;
  cover_url: string | null;
  buy_link: string | null;
  note: string | null;
  status: string;
  reading_status: string;
  price: number | null;
  currency: string | null;
  target_date: string | null;
  created_at: string;
}

const BUY_STATUSES = [
  { value: "not_bought", label: "Not bought", icon: CircleDashed },
  { value: "pending", label: "Pending", icon: Clock },
  { value: "bought", label: "Bought", icon: ShoppingCart },
];

const READ_STATUSES = [
  { value: "not_started", label: "Not reading yet" },
  { value: "reading", label: "Reading now" },
  { value: "finished", label: "Done reading" },
];

const money = (n: number) => `৳${(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

const emptyForm = {
  title: "", author: "", coverUrl: "", buyLink: "", note: "",
  status: "not_bought", readingStatus: "not_started", price: "", targetDate: "",
};

const UserBooks = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const set = (k: keyof typeof emptyForm, v: string) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    const load = async () => {
      const { data } = await (supabase as any)
        .from("books")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setBooks(data as Book[]);
      setLoading(false);
    };
    load();
  }, []);

  const openAdd = () => { setEditingId(null); setForm({ ...emptyForm }); setOpen(true); };

  const openEdit = (b: Book) => {
    setEditingId(b.id);
    setForm({
      title: b.title,
      author: b.author || "",
      coverUrl: b.cover_url || "",
      buyLink: b.buy_link || "",
      note: b.note || "",
      status: b.status || "not_bought",
      readingStatus: b.reading_status || "not_started",
      price: b.price != null ? String(b.price) : "",
      targetDate: b.target_date || "",
    });
    setOpen(true);
  };

  const payload = () => ({
    title: form.title.trim(),
    author: form.author.trim() || null,
    cover_url: form.coverUrl.trim() || null,
    buy_link: form.buyLink.trim() || null,
    note: form.note.trim() || null,
    status: form.status,
    reading_status: form.status === "bought" ? form.readingStatus : "not_started",
    price: form.price ? Number(form.price) : 0,
    target_date: form.targetDate || null,
  });

  const saveBook = async () => {
    if (!form.title.trim() || !user) return;
    if (editingId) {
      const patch = payload();
      const { error } = await (supabase as any).from("books").update(patch).eq("id", editingId);
      if (error) { toast.error("Could not update the book"); return; }
      setBooks(books.map(b => (b.id === editingId ? { ...b, ...patch } as Book : b)));
      toast.success("Book updated");
    } else {
      const { data, error } = await (supabase as any)
        .from("books")
        .insert({ user_id: user.id, ...payload() })
        .select()
        .single();
      if (error) { toast.error("Could not save the book"); return; }
      setBooks([data as Book, ...books]);
      toast.success("Book added");
    }
    setOpen(false);
    setEditingId(null);
    setForm({ ...emptyForm });
  };

  const updateBook = async (id: string, patch: Partial<Book>) => {
    const { error } = await (supabase as any).from("books").update(patch).eq("id", id);
    if (error) { toast.error("Could not update the book"); return; }
    setBooks(books.map(b => (b.id === id ? { ...b, ...patch } : b)));
  };

  const deleteBook = async (id: string) => {
    await (supabase as any).from("books").delete().eq("id", id);
    setBooks(books.filter(b => b.id !== id));
    toast.success("Book removed");
  };

  const filtered = books.filter(b => filter === "all" || b.status === filter);
  const sumBy = (s: string) => books.filter(b => b.status === s).reduce((t, b) => t + Number(b.price || 0), 0);
  const countBy = (s: string) => books.filter(b => b.status === s).length;
  const totalPrice = books.reduce((t, b) => t + Number(b.price || 0), 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-background to-accent/10 p-6 md:p-8">
        <div className="absolute -top-16 -right-10 h-48 w-48 rounded-full bg-primary/10 blur-3xl" aria-hidden />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <Library className="h-6 w-6 text-primary" /> My Books
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track what you own, what's pending, and what's still on the wishlist.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All books</SelectItem>
                {BUY_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={openAdd} className="gap-2"><Plus className="h-4 w-4" /> Add Book</Button>
          </div>
        </div>

        <div className="relative mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Total books", count: books.length, amount: totalPrice, icon: BookOpen, tone: "text-primary" },
            { label: "Bought", count: countBy("bought"), amount: sumBy("bought"), icon: ShoppingCart, tone: "text-emerald-500" },
            { label: "Pending", count: countBy("pending"), amount: sumBy("pending"), icon: Clock, tone: "text-amber-500" },
            { label: "Not bought", count: countBy("not_bought"), amount: sumBy("not_bought"), icon: CircleDashed, tone: "text-muted-foreground" },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-border bg-card/70 backdrop-blur p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                <s.icon className={`h-4 w-4 ${s.tone}`} />
              </div>
              <p className="mt-1 text-2xl font-bold text-foreground">{s.count}</p>
              <p className="text-xs text-muted-foreground">{money(s.amount)}</p>
            </div>
          ))}
        </div>

        <div className="relative mt-3 flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
          <Wallet className="h-4 w-4 text-primary" />
          <span className="text-sm text-muted-foreground">Total value of all books</span>
          <span className="ml-auto text-lg font-bold text-primary">{money(totalPrice)}</span>
        </div>
      </section>

      {/* Add / Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Book" : "Add Book"}</DialogTitle>
            <DialogDescription>Book details, price, where to buy and status.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Book name</Label>
                <Input placeholder="Atomic Habits" value={form.title} onChange={e => set("title", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Author</Label>
                <Input placeholder="James Clear" value={form.author} onChange={e => set("author", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Price (৳)</Label>
                <Input type="number" min="0" placeholder="450" value={form.price} onChange={e => set("price", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Buy status</Label>
                <Select value={form.status} onValueChange={v => set("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BUY_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {form.status === "bought" && (
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs">Reading status</Label>
                  <Select value={form.readingStatus} onValueChange={v => set("readingStatus", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {READ_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">Buy by (reminder date)</Label>
                <Input type="date" value={form.targetDate} onChange={e => set("targetDate", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Where to buy (link)</Label>
              <Input placeholder="https://rokomari.com/..." value={form.buyLink} onChange={e => set("buyLink", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Cover image link</Label>
              <Input placeholder="https://..." value={form.coverUrl} onChange={e => set("coverUrl", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Note</Label>
              <Input placeholder="Why do you want to read it?" value={form.note} onChange={e => set("note", e.target.value)} />
            </div>
            <p className="text-xs text-muted-foreground">You get a reminder notification 3 days before the date.</p>
          </div>
          <DialogFooter>
            <Button onClick={saveBook} disabled={!form.title.trim()} className="gap-2">
              <Plus className="h-4 w-4" /> {editingId ? "Save changes" : "Add Book"}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">No books yet.</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[70px]">Cover</TableHead>
                  <TableHead>Book</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Buy link</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reading</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(b => {
                  const bought = b.status === "bought";
                  return (
                    <TableRow key={b.id}>
                      <TableCell>
                        {b.cover_url ? (
                          <img src={b.cover_url} alt={`${b.title} book cover`} loading="lazy" className="h-16 w-11 object-cover rounded border" />
                        ) : (
                          <div className="h-16 w-11 rounded border bg-muted flex items-center justify-center">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium max-w-[220px]">
                        <span className="block truncate">{b.title}</span>
                        {b.target_date && <span className="text-xs text-muted-foreground">Buy by {b.target_date}</span>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[140px] truncate">{b.author || "—"}</TableCell>
                      <TableCell>
                        {b.buy_link ? (
                          <a href={b.buy_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 text-sm">
                            <ExternalLink className="h-3.5 w-3.5" /> Buy
                          </a>
                        ) : <span className="text-muted-foreground text-sm">—</span>}
                      </TableCell>
                      <TableCell className="font-medium">{money(Number(b.price || 0))}</TableCell>
                      <TableCell>
                        <Select value={b.status} onValueChange={v => updateBook(b.id, { status: v, ...(v !== "bought" ? { reading_status: "not_started" } : {}) })}>
                          <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {BUY_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {bought ? (
                          <Select value={b.reading_status || "not_started"} onValueChange={v => updateBook(b.id, { reading_status: v })}>
                            <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {READ_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="outline" className="text-[11px] text-muted-foreground">Not bought yet</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button variant="ghost" size="icon" aria-label="Edit book" onClick={() => openEdit(b)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label="Delete book" className="text-muted-foreground hover:text-destructive" onClick={() => deleteBook(b.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserBooks;
