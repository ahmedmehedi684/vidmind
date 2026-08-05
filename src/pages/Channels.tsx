import { useState, useEffect } from "react";
import { Loader2, Youtube, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ChannelManager, { type Channel } from "@/components/ChannelManager";
import ImportantLinks from "@/components/ImportantLinks";
import StudyReminderSettings from "@/components/StudyReminderSettings";

const Channels = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("channels").select("*").order("created_at", { ascending: false });
      if (data) setChannels(data as unknown as Channel[]);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 mb-2">
          <Youtube className="h-5 w-5 text-destructive" /> Channels
        </h1>
        <p className="text-muted-foreground text-sm flex items-center gap-1.5 mb-6">
          <Sparkles className="h-4 w-4 text-primary" />
          Save your favorite YouTube, Facebook, Instagram & TikTok channels — one video at a time!
        </p>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <ChannelManager channels={channels} onChannelsChange={setChannels} loading={loading} />
        )}
      </div>

      <ImportantLinks channels={channels} />

      <StudyReminderSettings />
    </div>
  );
};

export default Channels;
