import bkashLogo from "@/assets/bkash_logo.png";
import nagadLogo from "@/assets/nagad_logo.png";
import rocketLogo from "@/assets/rocket_logo.webp";
import upayLogo from "@/assets/upay_logo.png";
import payoneerLogo from "@/assets/payoneer_logo.png";

const PAYMENT_LOGOS: Record<string, string> = {
  bkash: bkashLogo,
  "b-kash": bkashLogo,
  nagad: nagadLogo,
  rocket: rocketLogo,
  upay: upayLogo,
  payoneer: payoneerLogo,
};

export const getPaymentLogo = (name: string): string | null => {
  const key = name.toLowerCase().replace(/\s+/g, "");
  for (const [k, v] of Object.entries(PAYMENT_LOGOS)) {
    if (key.includes(k)) return v;
  }
  return null;
};

export default PAYMENT_LOGOS;
