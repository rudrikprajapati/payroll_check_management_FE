import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";

interface BlockNumberReasonDialogProps {
  isBlockDialogOpen: boolean;
  setIsBlockDialogOpen: (open: boolean) => void;
  setIsConfirmDialogOpen: (open: boolean) => void;
  blockForm: UseFormReturn<
    {
      reason: string;
    },
    any,
    {
      reason: string;
    }
  >;
}

export const BlockNumberReasonDialog = ({
  blockForm,
  isBlockDialogOpen,
  setIsBlockDialogOpen,
  setIsConfirmDialogOpen,
}: BlockNumberReasonDialogProps) => {
  return (
    <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Block Phone Number</DialogTitle>
          <DialogDescription>
            Please provide a reason for blocking this phone number.
          </DialogDescription>
        </DialogHeader>
        <Form {...blockForm}>
          <form
            onSubmit={blockForm.handleSubmit(() =>
              setIsConfirmDialogOpen(true)
            )}
            className="space-y-4"
          >
            <FormField
              control={blockForm.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter reason for blocking" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Continue</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsBlockDialogOpen(false)}
              >
                Cancel
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
