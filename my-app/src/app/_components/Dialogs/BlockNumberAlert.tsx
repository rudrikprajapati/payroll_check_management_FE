import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BlockNumberAlertProps {
  isBlockedAlertOpen: boolean;
  setIsBlockedAlertOpen: (open: boolean) => void;
  handleProceedWithBlockedPhone: () => void;
}

export const BlockNumberAlert = ({
  handleProceedWithBlockedPhone,
  isBlockedAlertOpen,
  setIsBlockedAlertOpen,
}: BlockNumberAlertProps) => {
  return (
    <Dialog open={isBlockedAlertOpen} onOpenChange={setIsBlockedAlertOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Warning: Blocked Phone Number</DialogTitle>
          <DialogDescription>
            This phone number is currently blocked. Are you sure you want to
            proceed with the payment?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2">
          <Button variant="destructive" onClick={handleProceedWithBlockedPhone}>
            Proceed Anyway
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsBlockedAlertOpen(false)}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
