import { PayrollCheck } from "@/app/_types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PayrollCardProps {
  check: PayrollCheck;
  handleAction: (check: any, action: "pay" | "reject") => void;
}

export const PayrollCard = ({ check, handleAction }: PayrollCardProps) => {
  return (
    <div key={check.check_id} className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-2">
        Check #{check.check_number}
      </h2>
      <p className="text-gray-600 mb-2">
        Amount: ${check.check_amount.toFixed(2)}
      </p>
      <p className="text-gray-600 mb-2">Phone: {check.phone_number}</p>
      <p className="text-gray-600 mb-2">
        Status:{" "}
        <Badge
          className={cn(
            "text-sm",
            check.status === "COMPLETED" && "bg-green-100 text-green-800",
            check.status === "REJECTED" && "bg-red-100 text-red-800",
            check.status === "PENDING" && "bg-yellow-100 text-yellow-800"
          )}
        >
          {check.status}
        </Badge>
      </p>
      <p className="text-gray-600 mb-2">Location: {check.location}</p>
      <p className="text-gray-600 mb-2">
        Date: {new Date(check.transaction_date).toLocaleDateString()}
      </p>
      <div className="text-sm text-gray-500">
        <p>Created: {new Date(check.created_at).toLocaleDateString()}</p>
      </div>
      {check.status === "PENDING" && (
        <div className="flex gap-2 mt-4">
          <Button
            onClick={() => handleAction(check, "pay")}
            className="flex-1"
            variant="default"
          >
            Pay
          </Button>
          <Button
            onClick={() => handleAction(check, "reject")}
            className="flex-1"
            variant="destructive"
          >
            Reject
          </Button>
        </div>
      )}
    </div>
  );
};
