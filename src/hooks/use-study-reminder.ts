import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/**
 * Checks the user's note-taking reminder every minute and creates an
 * in-app notification once per day when the chosen time has arrived.
 */
export function useStudyReminder() {
  const { user } = useAuth();
  const busy = useRef(false);

  useEffect(() => {
    if (!user) return;

    const check = async () => {
      if (busy.current) return;
      busy.current = true;
      try {
        const { data } = await (supabase as any)
          .from("study_reminders")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        if (!data || !data.is_enabled) return;

        const today = todayStr();
        if (data.last_notified_on === today) return;

        const [h, m] = String(data.remind_at).split(":").map(Number);
        const now = new Date();
        if (now.getHours() * 60 + now.getMinutes() < h * 60 + m) return;

        await (supabase as any).from("notifications").insert({
          user_id: user.id,
          title: "Time to take notes 📝",
          message: "It's your set time — watch a video and write down your notes now!",
          type: "info",
          is_global: false,
        });
        await (supabase as any)
          .from("study_reminders")
          .update({ last_notified_on: today, updated_at: new Date().toISOString() })
          .eq("user_id", user.id);
        window.dispatchEvent(new CustomEvent("notifications:refresh"));
      } catch (e) {
        console.error("study reminder check failed", e);
      } finally {
        busy.current = false;
      }
    };

    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, [user]);
}
