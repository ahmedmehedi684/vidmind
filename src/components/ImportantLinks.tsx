import { useState, useEffect } from "react";
import { Plus, Trash2, ExternalLink, Link2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ImportantLink {
  id: string;
  title: string;
  url: string;
  note: string;
  created_at: string;
}

const ImportantLinks = () => {
  const { user } = useAuth();
  const [links, setLinks] = useState<ImportantLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data } = await (supabase as any)
        .from("important_links")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setLinks(data as ImportantLink[]);
      setLoading(false);
    };
    load();
  }, []);

  const addLink = async () => {
    if (!title.trim() || !user) return;
    try {
      const { data, error } = await (supabase as any)
        .from("important_links")
        .insert({ title: title.trim(), url: url.trim(), note: note.trim(), user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      setLinks([data as ImportantLink, ...links]);
      setTitle(""); setUrl(""); setNote("");
      toast.success("Link saved");
    } catch {
      toast.error("There was a problem saving the link.");
    }
  };

  const deleteLink = async (id: string) => {
    try {
      await (supabase as any).from("important_links").delete().eq("id", id);
      setLinks(links.filter((l) => l.id !== id));
      toast.success("Link deleted");
    } catch {
      toast.error("There was a problem deleting the link.");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <Link2 className="h-4 w-4 text-primary" /> Important Links
      </h2>

      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Title</Label>
              <Input placeholder="Example: Course playlist" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Link</Label>
              <Input placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Note (optional)</Label>
            <Input placeholder="Why is this important?" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <Button onClick={addLink} disabled={!title.trim()} className="gap-2">
            <Plus className="h-4 w-4" /> Add Link
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : links.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No important links yet.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {links.map((l) => (
            <Card key={l.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="py-3 px-4 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">{l.title}</p>
                  {l.url && (
                    <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-0.5 truncate">
                      <ExternalLink className="h-3 w-3 shrink-0" /> {l.url}
                    </a>
                  )}
                  {l.note && <p className="text-xs text-muted-foreground truncate">{l.note}</p>}
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0" onClick={() => deleteLink(l.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImportantLinks;
