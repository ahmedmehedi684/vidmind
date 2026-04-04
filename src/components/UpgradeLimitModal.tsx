import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, ArrowRight } from "lucide-react";

interface UpgradeLimitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName: string;
}

const UpgradeLimitModal = ({ open, onOpenChange, featureName }: UpgradeLimitModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader className="items-center">
          <div className="h-14 w-14 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-2">
            <Crown className="h-7 w-7 text-amber-400" />
          </div>
          <DialogTitle className="text-lg">Limit Reached</DialogTitle>
          <DialogDescription className="text-sm">
            You have reached your free limit for <strong>{featureName}</strong>. Upgrade to Pro to add more.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <Link to="/app-subscription">
            <Button className="gap-2">
              Upgrade Now <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeLimitModal;
