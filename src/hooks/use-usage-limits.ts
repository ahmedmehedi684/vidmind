import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type FeatureKey = "summaries" | "notes" | "tasks" | "goals" | "channels" | "transactions";

interface UsageData {
  count: number;
  limit: number;
  isUnlimited: boolean;
  planName: string;
}

const FREE_LIMITS: Record<FeatureKey, number> = {
  summaries: 5,
  notes: 5,
  tasks: 1,
  goals: 2,
  channels: 1,
  transactions: 1,
};

const TABLE_MAP: Record<FeatureKey, string> = {
  summaries: "summaries",
  notes: "admin_notes",
  tasks: "tasks",
  goals: "goals",
  channels: "channels",
  transactions: "transactions",
};

export function useUsageLimits(feature: FeatureKey) {
  const { user } = useAuth();
  const [usage, setUsage] = useState<UsageData>({
    count: 0,
    limit: FREE_LIMITS[feature],
    isUnlimited: false,
    planName: "Free",
  });
  const [loading, setLoading] = useState(true);

  const loadUsage = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Get count
      const { count } = await supabase
        .from(TABLE_MAP[feature] as any)
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Get plan limits
      let limit = FREE_LIMITS[feature];
      let planName = "Free";
      let isUnlimited = false;

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
          .select("name, limits")
          .eq("id", (activeSub as any).plan_id)
          .single();

        if (plan) {
          planName = (plan as any).name;
          const planLimits = (plan as any).limits as Record<string, number>;
          if (planLimits && planLimits[feature] !== undefined) {
            limit = planLimits[feature];
            isUnlimited = limit === -1 || limit >= 99999;
          }
        }
      }

      setUsage({ count: count || 0, limit, isUnlimited, planName });
    } catch (e) {
      console.error("Failed to load usage:", e);
    } finally {
      setLoading(false);
    }
  }, [user, feature]);

  useEffect(() => {
    loadUsage();
  }, [loadUsage]);

  const canCreate = usage.isUnlimited || usage.count < usage.limit;

  const refreshCount = loadUsage;

  return { ...usage, canCreate, loading, refreshCount };
}
