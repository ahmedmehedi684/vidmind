import { useEffect, useState } from "react";
import { BookOpen, Plus, Trash2, Loader2, CalendarDays, Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Book {
  id: string;
  title: string;
  author: string | null;
  cover_url: string | null;
  note: string | null;
  status: string;
  target_date: string | null;
  created_at: string;
}

const STATUSES = [
  { value: "not_started", label: "Not started" },
  { value: "reading", label: "Reading" },
  { value: "done", label: "Done" },
];

const daysLeft = (date: string | null) => {
  if (!date) return null;
  const d = new Date(date + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86_400_000);
};

const UserBooks = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("not_started");
  const [targetDate, setTargetDate] = useState("");

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

  const addBook = async () => {
    if (!title.trim() || !user) return;
    const { data, error } = await (supabase as any)
      .from("books")
      .insert({
        user_id: user.id,
        title: title.trim(),
        author: author.trim() || null,
        cover_url: coverUrl.trim() || null,
        note: note.trim() || null,
        status,
        target_date: targetDate || null,
      })
      .select()
      .single();
    if (error) { toast.error("Could not save the book"); return; }
    setBooks([data as Book, ...books]);
    setTitle(""); setAuthor(""); setCoverUrl(""); setNote(""); setStatus("not_started"); setTargetDate("");
    toast.success("Book added");
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

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" /> My Books
        </h1>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All books</SelectItem>
            {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">1. Book name</Label>
              <Input placeholder="Example: Atomic Habits" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">2. Author (optional)</Label>
              <Input placeholder="Example: James Clear" value={author} onChange={e => setAuthor(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">3. Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">4. Finish by (reminder date)</Label>
              <Input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Cover image link (optional)</Label>
            <Input placeholder="https://..." value={coverUrl} onChange={e => setCoverUrl(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Note (optional)</Label>
            <Input placeholder="Why do you want to read it?" value={note} onChange={e => setNote(e.target.value)} />
          </div>
          <p className="text-xs text-muted-foreground">You get a reminder notification 3 days before the finish date.</p>
          <Button onClick={addBook} disabled={!title.trim()} className="gap-2"><Plus className="h-4 w-4" /> Add Book</Button>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">No books yet.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(b => {
            const left = daysLeft(b.target_date);
            const done = b.status === "done";
            return (
              <Card key={b.id}>
                <CardContent className="p-3 flex gap-3 items-start">
                  {b.cover_url && (
                    <img src={b.cover_url} alt={`${b.title} cover`} loading="lazy" className="h-20 w-14 object-cover rounded-md border shrink-0" />
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className={`font-medium truncate ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>{b.title}</p>
                    {b.author && <p className="text-xs text-muted-foreground truncate">{b.author}</p>}
                    {b.note && <p className="text-xs text-muted-foreground truncate">{b.note}</p>}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <Badge variant={done ? "default" : "secondary"} className="gap-1 text-[11px]">
                        {done ? <Check className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                        {STATUSES.find(s => s.value === b.status)?.label ?? b.status}
                      </Badge>
                      {b.target_date && (
                        <Badge variant={!done && left !== null && left <= 3 ? "destructive" : "outline"} className="gap-1 text-[11px]">
                          <CalendarDays className="h-3 w-3" />
                          {b.target_date}{!done && left !== null && ` · ${left < 0 ? `${-left} days late` : `${left} days left`}`}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <Select value={b.status} onValueChange={(v) => updateBook(b.id, { status: v })}>
                      <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive gap-1" onClick={() => deleteBook(b.id)}>
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UserBooks;
