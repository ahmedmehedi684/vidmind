import { useState, useEffect } from "react";
import { Plus, Trash2, ExternalLink, Youtube, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Channel {
  id: string;
  user_id: string;
  name: string;
  url: string;
  created_at: string;
}

interface ChannelManagerProps {
  channels: Channel[];
  onChannelsChange: (channels: Channel[]) => void;
  loading?: boolean;
}

const ChannelManager = ({ channels, onChannelsChange, loading }: ChannelManagerProps) => {
  const { user } = useAuth();
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");

  const addChannel = async () => {
    if (!newName.trim() || !user) return;
    try {
      const { data, error } = await supabase
        .from("channels")
        .insert({ name: newName.trim(), url: newUrl.trim(), user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      onChannelsChange([data as unknown as Channel, ...channels]);
      setNewName("");
      setNewUrl("");
      toast.success("Channel যোগ হয়েছে");
    } catch {
      toast.error("Channel যোগ করতে সমস্যা হয়েছে");
    }
  };

  const deleteChannel = async (id: string) => {
    try {
      await supabase.from("channels").delete().eq("id", id);
      onChannelsChange(channels.filter(c => c.id !== id));
      toast.success("Channel মুছে ফেলা হয়েছে");
    } catch {
      toast.error("Channel মুছতে সমস্যা হয়েছে");
    }
  };

  const startEdit = (ch: Channel) => {
    setEditingId(ch.id);
    setEditName(ch.name);
    setEditUrl(ch.url);
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    try {
      const { error } = await supabase
        .from("channels")
        .update({ name: editName.trim(), url: editUrl.trim() })
        .eq("id", editingId);
      if (error) throw error;
      onChannelsChange(channels.map(c => c.id === editingId ? { ...c, name: editName.trim(), url: editUrl.trim() } : c));
      setEditingId(null);
      toast.success("Channel আপডেট হয়েছে");
    } catch {
      toast.error("Channel আপডেট করতে সমস্যা হয়েছে");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Channel নাম</Label>
              <Input placeholder="যেমন: Ali Abdaal" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">YouTube Link</Label>
              <Input placeholder="https://youtube.com/@..." value={newUrl} onChange={(e) => setNewUrl(e.target.value)} />
            </div>
          </div>
          <Button onClick={addChannel} disabled={!newName.trim()} className="gap-2">
            <Plus className="h-4 w-4" /> Channel যোগ করুন
          </Button>
        </CardContent>
      </Card>

      {channels.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">কোনো channel নেই।</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {channels.map((ch) => (
            <Card key={ch.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="py-3 px-4">
                {editingId === ch.id ? (
                  <div className="space-y-2">
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Channel নাম" className="text-sm" />
                    <Input value={editUrl} onChange={(e) => setEditUrl(e.target.value)} placeholder="YouTube Link" className="text-sm" />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveEdit} disabled={!editName.trim()} className="gap-1 h-7 text-xs">
                        <Check className="h-3 w-3" /> Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="h-7 text-xs">
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Youtube className="h-5 w-5 text-destructive shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{ch.name}</p>
                        {ch.url && (
                          <a href={ch.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-0.5 truncate">
                            <ExternalLink className="h-3 w-3 shrink-0" /> {ch.url}
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => startEdit(ch)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteChannel(ch.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChannelManager;
