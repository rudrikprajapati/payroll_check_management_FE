import { PayrollCheck } from "@/app/_types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ConfirmationDialogProps {
  isConfirmDialogOpen: boolean;
  setIsConfirmDialogOpen: (open: boolean) => void;
  handlePayCheck: (check: PayrollCheck) => void;
  handleRejectCheck: (check: PayrollCheck) => void;
  selectedCheck: PayrollCheck | null;
  actionType: "pay" | "reject" | null;
}

export const ConfirmationDialog = ({
  actionType,
  handlePayCheck,
  handleRejectCheck,
  isConfirmDialogOpen,
  selectedCheck,
  setIsConfirmDialogOpen,
}: ConfirmationDialogProps) => {
  return (
    <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {actionType === "pay" ? "Confirm Payment" : "Confirm Rejection"}
          </DialogTitle>
          <DialogDescription>
            {actionType === "pay"
              ? "Are you sure you want to mark this check as paid?"
              : "Are you sure you want to reject this check and block the phone number?"}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            onClick={() => {
              if (selectedCheck) {
                if (actionType === "pay") {
                  handlePayCheck(selectedCheck);
                } else {
                  handleRejectCheck(selectedCheck);
                }
              }
            }}
          >
            Confirm
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsConfirmDialogOpen(false)}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
