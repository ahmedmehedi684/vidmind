import { useState, useEffect } from "react";
import { Loader2, Link2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Channel } from "@/components/ChannelManager";
import ImportantLinks from "@/components/ImportantLinks";

const UserLinks = () => {
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
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 mb-1">
          <Link2 className="h-5 w-5 text-primary" /> Important Links
        </h1>
        <p className="text-sm text-muted-foreground">
          Pick a platform, choose a channel, then save the video or image link you want to take notes from.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <ImportantLinks channels={channels} />
      )}
    </div>
  );
};

export default UserLinks;
