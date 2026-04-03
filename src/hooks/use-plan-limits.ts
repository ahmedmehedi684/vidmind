import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PlanLimits {
  tasks: number;
  transactions: number;
  summaries: number;
  channels: number;
  goals: number;
  notes: number;
}

const FREE_LIMITS: PlanLimits = {
  tasks: 5, transactions: 10, summaries: 5, channels: 1, goals: 2, notes: 5
};

export function usePlanLimits() {
  const { user } = useAuth();
  const [limits, setLimits] = useState<PlanLimits>(FREE_LIMITS);
  const [planName, setPlanName] = useState("Free");
  const [limitPeriod, setLimitPeriod] = useState<"daily" | "monthly">("monthly");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadLimits();
  }, [user]);

  const loadLimits = async () => {
    if (!user) return;
    try {
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("plan_id, status, expires_at")
        .eq("user_id", user.id)
        .eq("status", "active");

      const activeSub = (subs || []).find(
        (s: any) => s.expires_at && new Date(s.expires_at) > new Date()
      );

      if (activeSub) {
        const { data: plan } = await supabase
          .from("subscription_plans")
          .select("name, limits, limit_period")
          .eq("id", (activeSub as any).plan_id)
          .single();

        if (plan) {
          const planLimits = (plan as any).limits as PlanLimits;
          setPlanName((plan as any).name);
          setLimitPeriod(((plan as any).limit_period || "monthly") as "daily" | "monthly");
          if (planLimits && Object.keys(planLimits).length > 0) {
            setLimits(planLimits);
          }
        }
      }
    } catch (e) {
      console.error("Failed to load plan limits:", e);
    } finally {
      setLoading(false);
    }
  };

  const isUnlimited = (feature: keyof PlanLimits) => {
    return limits[feature] === -1 || limits[feature] >= 99999;
  };

  const getLimit = (feature: keyof PlanLimits) => limits[feature];

  return { limits, planName, limitPeriod, loading, isUnlimited, getLimit };
}
