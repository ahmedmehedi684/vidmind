import { useState, useEffect } from "react";
import { Plus, Trash2, ExternalLink, Youtube, Pencil, Check, X, Facebook, Instagram, Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUsageLimits } from "@/hooks/use-usage-limits";
import UsageLimitBadge from "@/components/UsageLimitBadge";
import UpgradeLimitModal from "@/components/UpgradeLimitModal";

export interface Channel {
  id: string;
  user_id: string;
  name: string;
  url: string;
  platform?: string;
  created_at: string;
}

export const PLATFORMS = [
  { value: "youtube", label: "YouTube", icon: Youtube, className: "text-destructive", placeholder: "https://youtube.com/@..." },
  { value: "facebook", label: "Facebook", icon: Facebook, className: "text-blue-500", placeholder: "https://facebook.com/..." },
  { value: "instagram", label: "Instagram", icon: Instagram, className: "text-pink-500", placeholder: "https://instagram.com/..." },
  { value: "tiktok", label: "TikTok", icon: Music2, className: "text-foreground", placeholder: "https://tiktok.com/@..." },
] as const;

export const getPlatform = (value?: string) =>
  PLATFORMS.find((p) => p.value === value) ?? PLATFORMS[0];

interface ChannelManagerProps {
  channels: Channel[];
  onChannelsChange: (channels: Channel[]) => void;
  loading?: boolean;
}

const ChannelManager = ({ channels, onChannelsChange, loading }: ChannelManagerProps) => {
  const { user } = useAuth();
  const usageLimits = useUsageLimits("channels");
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newPlatform, setNewPlatform] = useState("youtube");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editPlatform, setEditPlatform] = useState("youtube");

  const addChannel = async () => {
    if (!newName.trim() || !user) return;
    if (!usageLimits.canCreate) { setUpgradeOpen(true); return; }
    try {
      const { data, error } = await (supabase as any)
        .from("channels")
        .insert({ name: newName.trim(), url: newUrl.trim(), platform: newPlatform, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      onChannelsChange([data as unknown as Channel, ...channels]);
      setNewName("");
      setNewUrl("");
      toast.success("Channel added");
      usageLimits.refreshCount();
    } catch {
      toast.error("There was a problem adding the channel.");
    }
  };

  const deleteChannel = async (id: string) => {
    try {
      await supabase.from("channels").delete().eq("id", id);
      onChannelsChange(channels.filter((c) => c.id !== id));
      toast.success("Channel deleted");
    } catch {
      toast.error("There was a problem deleting the channel.");
    }
  };

  const startEdit = (ch: Channel) => {
    setEditingId(ch.id);
    setEditName(ch.name);
    setEditUrl(ch.url);
    setEditPlatform(ch.platform || "youtube");
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    try {
      const { error } = await (supabase as any)
        .from("channels")
        .update({ name: editName.trim(), url: editUrl.trim(), platform: editPlatform })
        .eq("id", editingId);
      if (error) throw error;
      onChannelsChange(
        channels.map((c) =>
          c.id === editingId ? { ...c, name: editName.trim(), url: editUrl.trim(), platform: editPlatform } : c,
        ),
      );
      setEditingId(null);
      toast.success("Channel updated");
    } catch {
      toast.error("There was a problem updating the channel.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <UsageLimitBadge count={usageLimits.count} limit={usageLimits.limit} isUnlimited={usageLimits.isUnlimited} planName={usageLimits.planName} loading={usageLimits.loading} />
      </div>
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Platform</Label>
              <Select value={newPlatform} onValueChange={setNewPlatform}>
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
              <Label className="text-xs">Channel Name</Label>
              <Input
                placeholder="Example: Noman Ali Khan"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{getPlatform(newPlatform).label} Link</Label>
              <Input
                placeholder={getPlatform(newPlatform).placeholder}
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={addChannel} disabled={!newName.trim()} className="gap-2">
            <Plus className="h-4 w-4" /> Add Channel
          </Button>
        </CardContent>
      </Card>


      {channels.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">No channels yet.</CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {channels.map((ch) => (
            <Card key={ch.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="py-3 px-4">
                {editingId === ch.id ? (
                  <div className="space-y-2">
                    <Select value={editPlatform} onValueChange={setEditPlatform}>
                      <SelectTrigger className="text-sm h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PLATFORMS.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            <span className="flex items-center gap-1.5"><p.icon className={`h-3.5 w-3.5 ${p.className}`} /> {p.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Channel Name"
                      className="text-sm"
                    />
                    <Input
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.target.value)}
                      placeholder={getPlatform(editPlatform).placeholder}
                      className="text-sm"
                    />
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
                      {(() => { const P = getPlatform(ch.platform); return <P.icon className={`h-5 w-5 shrink-0 ${P.className}`} />; })()}

                      <div className="min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{ch.name}</p>
                        {ch.url && (
                          <a
                            href={ch.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-0.5 truncate"
                          >
                            <ExternalLink className="h-3 w-3 shrink-0" /> {ch.url}
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                        onClick={() => startEdit(ch)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteChannel(ch.id)}
                      >
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
      <UpgradeLimitModal open={upgradeOpen} onOpenChange={setUpgradeOpen} featureName="Channels" />
    </div>
  );
};

export default ChannelManager;
