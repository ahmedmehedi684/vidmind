import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/**
 * Creates an in-app notification when a book's finish date is 3 days away
 * (or closer) and no reminder has been sent yet.
 */
export function useBookReminders() {
  const { user } = useAuth();
  const busy = useRef(false);

  useEffect(() => {
    if (!user) return;

    const check = async () => {
      if (busy.current) return;
      busy.current = true;
      try {
        const today = todayStr();
        const limit = new Date();
        limit.setDate(limit.getDate() + 3);
        const limitStr = `${limit.getFullYear()}-${String(limit.getMonth() + 1).padStart(2, "0")}-${String(limit.getDate()).padStart(2, "0")}`;

        const { data } = await (supabase as any)
          .from("books")
          .select("*")
          .eq("user_id", user.id)
          .neq("status", "bought")
          .not("target_date", "is", null)
          .lte("target_date", limitStr);

        const due = ((data ?? []) as any[]).filter(b => b.reminded_at !== today);
        if (due.length === 0) return;

        for (const b of due) {
          const left = Math.round((new Date(b.target_date + "T00:00:00").getTime() - new Date(today + "T00:00:00").getTime()) / 86_400_000);
          await (supabase as any).from("notifications").insert({
            user_id: user.id,
            title: "Book deadline coming up 📚",
            message:
              left < 0
                ? `"${b.title}" is ${-left} day(s) overdue. Finish it soon!`
                : `"${b.title}" should be finished in ${left} day(s) (${b.target_date}).`,
            type: "warning",
            is_global: false,
          });
          await (supabase as any).from("books").update({ reminded_at: today }).eq("id", b.id);
        }
        window.dispatchEvent(new CustomEvent("notifications:refresh"));
      } catch (e) {
        console.error("book reminder check failed", e);
      } finally {
        busy.current = false;
      }
    };

    check();
    const id = setInterval(check, 10 * 60_000);
    return () => clearInterval(id);
  }, [user]);
}
