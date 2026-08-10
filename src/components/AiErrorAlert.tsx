import { AlertTriangle, KeyRound, CreditCard, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { AiError } from "@/lib/ai-error";

interface Props {
  error: AiError | null;
  className?: string;
}

const CONFIG = {
  no_api_key: {
    Icon: KeyRound,
    title: "API Key নেই",
    action: "Settings-এ API Key দিন",
  },
  invalid_api_key: {
    Icon: KeyRound,
    title: "API Key ভুল",
    action: "Settings-এ API Key ঠিক করুন",
  },
  no_credits: {
    Icon: CreditCard,
    title: "API Credit শেষ",
    action: "Settings-এ নতুন Key দিন",
  },
  rate_limit: {
    Icon: Clock,
    title: "Rate limit",
    action: null,
  },
  api_error: {
    Icon: AlertTriangle,
    title: "সমস্যা হয়েছে",
    action: null,
  },
} as const;

export default function AiErrorAlert({ error, className }: Props) {
  const navigate = useNavigate();
  if (!error) return null;

  const { Icon, title, action } = CONFIG[error.code] ?? CONFIG.api_error;
  const isWarning = error.code !== "api_error";

  return (
    <Alert variant={isWarning ? "default" : "destructive"} className={className}>
      <Icon className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>{error.message}</p>
        {action && (
          <Button size="sm" variant="outline" onClick={() => navigate("/app-settings")}>
            {action}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
