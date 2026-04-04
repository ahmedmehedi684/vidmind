import { Badge } from "@/components/ui/badge";
import { Crown, CheckCircle } from "lucide-react";

interface UsageLimitBadgeProps {
  count: number;
  limit: number;
  isUnlimited: boolean;
  planName: string;
  loading?: boolean;
}

const UsageLimitBadge = ({ count, limit, isUnlimited, planName, loading }: UsageLimitBadgeProps) => {
  if (loading) return null;

  if (isUnlimited) {
    return (
      <Badge variant="outline" className="gap-1 text-xs text-green-500 border-green-500/30">
        <CheckCircle className="h-3 w-3" /> Unlimited ✓
      </Badge>
    );
  }

  const atLimit = count >= limit;

  return (
    <Badge
      variant="outline"
      className={`gap-1 text-xs ${atLimit ? "text-red-400 border-red-500/30" : "text-muted-foreground"}`}
    >
      {count} / {limit} used
      {atLimit && <Crown className="h-3 w-3 ml-0.5 text-amber-400" />}
    </Badge>
  );
};

export default UsageLimitBadge;
