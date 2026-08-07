import { useState, useEffect } from "react";
import { Plus, Trash2, ExternalLink, Link2, Loader2 } from "lucide-react";
import MediaPreview, { openExternal } from "@/components/MediaPreview";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PLATFORMS, getPlatform, type Channel } from "@/components/ChannelManager";

interface ImportantLink {
  id: string;
  title: string;
  url: string;
  note: string;
  channel_id: string | null;
  created_at: string;
}

interface ImportantLinksProps {
  channels: Channel[];
}

const ImportantLinks = ({ channels }: ImportantLinksProps) => {
  const { user } = useAuth();
  const [links, setLinks] = useState<ImportantLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState("youtube");
  const [channelId, setChannelId] = useState("");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");

  const platformChannels = channels.filter((c) => (c.platform || "youtube") === platform);

  useEffect(() => {
    setChannelId("");
  }, [platform]);

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
    if (!title.trim() || !channelId || !user) return;
    try {
      const { data, error } = await (supabase as any)
        .from("important_links")
        .insert({
          title: title.trim(),
          url: url.trim(),
          note: note.trim(),
          channel_id: channelId,
          user_id: user.id,
        })
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

  const channelOf = (id: string | null) => channels.find((c) => c.id === id);

  const isYoutube = platform === "youtube";




  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <Link2 className="h-4 w-4 text-primary" /> Important Links
      </h2>

      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">1. Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      <span className="flex items-center gap-1.5"><p.icon className={`h-3.5 w-3.5 ${p.className}`} /> {p.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">2. Channel</Label>
              <Select value={channelId} onValueChange={setChannelId} disabled={platformChannels.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder={platformChannels.length === 0 ? "No channel on this platform" : "Select a channel"} />
                </SelectTrigger>
                <SelectContent>
                  {platformChannels.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">3. {isYoutube ? "Title" : "Caption"}</Label>
              <Input placeholder={isYoutube ? "Example: Course playlist" : "Example: Reel caption"} value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">4. Video / Image Link</Label>
              <Input placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Note (optional)</Label>
            <Input placeholder="Why is this important?" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <Button onClick={addLink} disabled={!title.trim() || !channelId} className="gap-2">
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
          {links.map((l) => {
            const ch = channelOf(l.channel_id);
            const P = getPlatform(ch?.platform);
            return (
              <Card key={l.id} className="hover:border-primary/30 transition-colors overflow-hidden">
                <CardContent className="p-3 space-y-2">
                  {l.url && <MediaPreview url={l.url} platform={ch?.platform} />}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {ch && (
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                          <P.icon className={`h-3 w-3 shrink-0 ${P.className}`} /> {ch.name}
                        </p>
                      )}
                      <p className="font-medium text-foreground text-sm truncate">{l.title}</p>
                      {l.url && (
                        <button onClick={() => openExternal(l.url)} className="text-xs text-primary hover:underline flex items-center gap-0.5 truncate max-w-full">
                          <ExternalLink className="h-3 w-3 shrink-0" /> <span className="truncate">{l.url}</span>
                        </button>
                      )}

                      {l.note && <p className="text-xs text-muted-foreground truncate">{l.note}</p>}
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0" onClick={() => deleteLink(l.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
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

export default ImportantLinks;
