import { useState, useEffect } from "react";
import { Globe, Plus, Loader2, ExternalLink, Pencil, Trash2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { openExternal } from "@/components/MediaPreview";

interface WebLink {
  id: string;
  site_name: string;
  site_url: string;
  purpose: string;
  category: string;
  created_at: string;
}

const CATEGORIES = [
  { value: "tools", label: "Tools" },
  { value: "software", label: "Software" },
  { value: "learning", label: "Learning" },
  { value: "design", label: "Design" },
  { value: "ai", label: "AI" },
  { value: "work", label: "Work" },
  { value: "shopping", label: "Shopping" },
  { value: "other", label: "Other" },
];

const faviconOf = (url: string) => {
  try {
    const u = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=64`;
  } catch {
    return "";
  }
};

const UserSites = () => {
  const { user } = useAuth();
  const [sites, setSites] = useState<WebLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<WebLink | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [purpose, setPurpose] = useState("");
  const [category, setCategory] = useState("tools");

  useEffect(() => {
    const load = async () => {
      const { data } = await (supabase as any)
        .from("web_links")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setSites(data as WebLink[]);
      setLoading(false);
    };
    load();
  }, []);

  const reset = () => {
    setEditing(null);
    setName(""); setUrl(""); setPurpose(""); setCategory("tools");
  };

  const openAdd = () => { reset(); setOpen(true); };

  const openEdit = (s: WebLink) => {
    setEditing(s);
    setName(s.site_name); setUrl(s.site_url); setPurpose(s.purpose); setCategory(s.category);
    setOpen(true);
  };

  const save = async () => {
    if (!name.trim() || !url.trim() || !user) return;
    const payload = {
      site_name: name.trim(),
      site_url: url.trim(),
      purpose: purpose.trim(),
      category,
      user_id: user.id,
    };
    try {
      if (editing) {
        const { data, error } = await (supabase as any)
          .from("web_links").update(payload).eq("id", editing.id).select().single();
        if (error) throw error;
        setSites(sites.map((s) => (s.id === editing.id ? (data as WebLink) : s)));
        toast.success("Site updated");
      } else {
        const { data, error } = await (supabase as any)
          .from("web_links").insert(payload).select().single();
        if (error) throw error;
        setSites([data as WebLink, ...sites]);
        toast.success("Site saved");
      }
      setOpen(false);
      reset();
    } catch {
      toast.error("There was a problem saving this site.");
    }
  };

  const remove = async (id: string) => {
    try {
      await (supabase as any).from("web_links").delete().eq("id", id);
      setSites(sites.filter((s) => s.id !== id));
      toast.success("Site deleted");
    } catch {
      toast.error("There was a problem deleting this site.");
    }
  };

  const visible = sites.filter((s) => {
    const q = query.trim().toLowerCase();
    const matchQ = !q || s.site_name.toLowerCase().includes(q) || s.site_url.toLowerCase().includes(q) || s.purpose.toLowerCase().includes(q);
    const matchC = filter === "all" || s.category === filter;
    return matchQ && matchC;
  });

  const labelOf = (v: string) => CATEGORIES.find((c) => c.value === v)?.label ?? "Other";

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="rounded-xl border border-border bg-gradient-to-br from-primary/10 via-background to-background p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" /> My Websites
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Save any website — name, link, and what you use it for — so you never forget it.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">{sites.length}</p>
              <p className="text-xs text-muted-foreground">Saved sites</p>
            </div>
            <Button onClick={openAdd} className="gap-2"><Plus className="h-4 w-4" /> Add Site</Button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search site, link or purpose" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Site" : "Add Site"}</DialogTitle>
            <DialogDescription>Save the site name, its link and what you use it for.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">1. Site name</Label>
              <Input placeholder="Example: Canva" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">2. Site link</Label>
              <Input placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">3. What is it used for?</Label>
              <Textarea rows={3} placeholder="Example: Thumbnail design for my videos" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">4. Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={save} disabled={!name.trim() || !url.trim()} className="gap-2">
              <Plus className="h-4 w-4" /> {editing ? "Save Changes" : "Add Site"}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : visible.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No sites saved yet.</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Site</TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead>Used for</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-0">
                        {faviconOf(s.site_url) ? (
                          <img src={faviconOf(s.site_url)} alt={`${s.site_name} icon`} loading="lazy" className="h-6 w-6 rounded" />
                        ) : (
                          <Globe className="h-5 w-5 text-muted-foreground" />
                        )}
                        <span className="font-medium text-foreground truncate">{s.site_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[220px]">
                      <button onClick={() => openExternal(s.site_url)} className="text-xs text-primary hover:underline flex items-center gap-1 truncate max-w-full">
                        <ExternalLink className="h-3 w-3 shrink-0" /> <span className="truncate">{s.site_url}</span>
                      </button>
                    </TableCell>
                    <TableCell className="max-w-[260px]">
                      <span className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{s.purpose || "—"}</span>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{labelOf(s.category)}</Badge></TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => remove(s.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserSites;
