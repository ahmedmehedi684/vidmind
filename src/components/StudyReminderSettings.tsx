import { useState, useEffect } from "react";
import { BellRing, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const StudyReminderSettings = () => {
  const { user } = useAuth();
  const [time, setTime] = useState("20:00");
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data } = await (supabase as any)
        .from("study_reminders")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setTime(String(data.remind_at).slice(0, 5));
        setEnabled(data.is_enabled);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("study_reminders")
        .upsert(
          {
            user_id: user.id,
            remind_at: `${time}:00`,
            is_enabled: enabled,
            last_notified_on: null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );
      if (error) throw error;
      toast.success("Reminder time saved");
    } catch {
      toast.error("There was a problem saving your reminder.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <BellRing className="h-4 w-4 text-primary" /> Note-Taking Reminder
      </h2>
      <Card>
        <CardContent className="pt-6 space-y-4">
          {loading ? (
            <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Set a daily time — you'll get a notification here reminding you to take notes from a video.
              </p>
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Reminder time</Label>
                  <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-36" />
                </div>
                <div className="flex items-center gap-2 pb-2">
                  <Switch checked={enabled} onCheckedChange={setEnabled} id="reminder-enabled" />
                  <Label htmlFor="reminder-enabled" className="text-sm">Enabled</Label>
                </div>
              </div>
              <Button onClick={save} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Reminder
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudyReminderSettings;
