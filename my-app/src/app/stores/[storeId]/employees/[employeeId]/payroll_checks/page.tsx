"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEmployee } from "@/contexts/EmployeeContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Employee } from "../../page";
import { uid } from "uid";

interface PayrollCheck {
  check_id: number;
  employee_id: number;
  phone_number: string;
  check_number: string;
  check_amount: number;
  transaction_date: string;
  status: string;
  location: string;
  created_at: string;
  updated_at: string;
}

const formSchema = z.object({
  phone_number: z.string().min(10, "Phone number must be at least 10 digits"),
  check_amount: z.string().min(1, "Check amount is required"),
  transaction_date: z.string().min(1, "Transaction date is required"),
  status: z.string().min(1, "Status is required"),
  location: z.string().min(1, "Location is required"),
});

const blockFormSchema = z.object({
  reason: z.string().min(1, "Reason is required"),
});

export default function PayrollChecksPage() {
  const params = useParams();
  const employeeId = params.employeeId as string;
  const { selectedEmployee, setSelectedEmployee } = useEmployee();
  const storeId = params.storeId as string;
  const [payrollChecks, setPayrollChecks] = useState<PayrollCheck[]>([]);
  const [isAddingCheck, setIsAddingCheck] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState<PayrollCheck | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"pay" | "reject" | null>(null);
  const [isBlockedAlertOpen, setIsBlockedAlertOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone_number: selectedEmployee?.mobile_number || "",
      check_amount: "",
      transaction_date: "",
      status: "PENDING",
      location: "",
    },
  });

  const blockForm = useForm<z.infer<typeof blockFormSchema>>({
    resolver: zodResolver(blockFormSchema),
    defaultValues: {
      reason: "",
    },
  });

  const fetchEmployees = async () => {
    try {
      const response = await fetch("http://localhost:8080/employee/get", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: parseInt(storeId) }),
      });
      const data = await response.json();
      const employee = data.find(
        (emp: Employee) => emp.id === parseInt(employeeId)
      );
      setSelectedEmployee(employee);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  useEffect(() => {
    if (selectedEmployee) {
      form.setValue("phone_number", selectedEmployee.mobile_number);
    } else {
      fetchEmployees();
    }
    fetchPayrollChecks();
  }, [employeeId, selectedEmployee]);

  const fetchPayrollChecks = async () => {
    try {
      const response = await fetch("http://localhost:8080/payroll-check/get", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ employee_id: parseInt(employeeId) }),
      });
      const data = await response.json();
      setPayrollChecks(data);
    } catch (error) {
      console.error("Error fetching payroll checks:", error);
    }
  };

  const generateCheckNumber = () => {
    return `CHK${uid(8)}`;
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const response = await fetch(
        "http://localhost:8080/payroll-check/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            employee_id: parseInt(employeeId),
            phone_number: values.phone_number,
            check_number: generateCheckNumber(),
            check_amount: parseFloat(values.check_amount),
            transaction_date: values.transaction_date,
            status: values.status,
            location: values.location,
          }),
        }
      );

      if (response.ok) {
        form.reset();
        setIsAddingCheck(false);
        fetchPayrollChecks();
      }
    } catch (error) {
      console.error("Error creating payroll check:", error);
      setError("Failed to create payroll check. Please try again.");
    }
  };

  const handlePayCheck = async (check: PayrollCheck) => {
    try {
      const response = await fetch(
        "http://localhost:8080/payroll-check/update",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            check_id: check.check_id,
            employee_id: check.employee_id,
            phone_number: check.phone_number,
            check_number: check.check_number,
            check_amount: check.check_amount,
            transaction_date: check.transaction_date,
            status: "COMPLETED",
            location: check.location,
          }),
        }
      );

      if (response.ok) {
        fetchPayrollChecks();
        setIsConfirmDialogOpen(false);
      }
    } catch (error) {
      console.error("Error updating payroll check:", error);
      setError("Failed to update payroll check. Please try again.");
    }
  };

  const handleRejectCheck = async (check: PayrollCheck) => {
    try {
      // First update the check status
      const updateResponse = await fetch(
        "http://localhost:8080/payroll-check/update",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            check_id: check.check_id,
            employee_id: check.employee_id,
            phone_number: check.phone_number,
            check_number: check.check_number,
            check_amount: check.check_amount,
            transaction_date: check.transaction_date,
            status: "REJECTED",
            location: check.location,
          }),
        }
      );

      if (updateResponse.ok) {
        // Check if phone is already blocked
        const isBlocked = await checkIfPhoneBlocked(check.phone_number);

        // Only block if not already blocked
        if (!isBlocked) {
          const blockResponse = await fetch(
            "http://localhost:8080/blocked-phone/add",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                phone_number: check.phone_number,
                reason: blockForm.getValues().reason,
                is_blocked: true,
              }),
            }
          );

          if (!blockResponse.ok) {
            throw new Error("Failed to block phone number");
          }
        }

        fetchPayrollChecks();
        setIsBlockDialogOpen(false);
        setIsConfirmDialogOpen(false);
        blockForm.reset();
      }
    } catch (error) {
      console.error("Error rejecting payroll check:", error);
      setError("Failed to reject payroll check. Please try again.");
    }
  };

  const checkIfPhoneBlocked = async (phoneNumber: string): Promise<boolean> => {
    try {
      const response = await fetch(
        "http://localhost:8080/blocked-phone/check",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: phoneNumber,
          }),
        }
      );
      const data = await response.json();
      return data.is_blocked === true;
    } catch (error) {
      console.error("Error checking blocked phone:", error);
      return false;
    }
  };

  const handleAction = async (
    check: PayrollCheck,
    action: "pay" | "reject"
  ) => {
    setSelectedCheck(check);
    setActionType(action);

    if (action === "pay") {
      const isBlocked = await checkIfPhoneBlocked(check.phone_number);
      if (isBlocked) {
        setIsBlockedAlertOpen(true);
        return;
      }
      setIsConfirmDialogOpen(true);
    } else {
      setIsBlockDialogOpen(true);
    }
  };

  const handleProceedWithBlockedPhone = () => {
    setIsBlockedAlertOpen(false);
    setIsConfirmDialogOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Payroll Checks</h1>
          {selectedEmployee && (
            <p className="text-gray-600 mt-2">
              Employee: {selectedEmployee.full_name} (
              {selectedEmployee.employee_code})
            </p>
          )}
        </div>
        <Button onClick={() => setIsAddingCheck(true)}>Add New Check</Button>
      </div>

      {isAddingCheck && (
        <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Add New Payroll Check</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={selectedEmployee?.mobile_number}
                        {...field}
                        disabled
                        className="bg-gray-100"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="check_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Check Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Enter check amount"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="transaction_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <div className="flex gap-4">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Adding..." : "Create Check"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddingCheck(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {!payrollChecks ? (
          <div className="text-center text-gray-600 mt-8">
            <p>No payroll checks found. Please add a check to get started.</p>
          </div>
        ) : (
          payrollChecks.map((check) => (
            <div
              key={check.check_id}
              className="bg-white rounded-lg shadow-md p-6"
            >
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
                    check.status === "COMPLETED" &&
                      "bg-green-100 text-green-800",
                    check.status === "REJECTED" && "bg-red-100 text-red-800",
                    check.status === "PENDING" &&
                      "bg-yellow-100 text-yellow-800"
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
                <p>
                  Created: {new Date(check.created_at).toLocaleDateString()}
                </p>
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
          ))
        )}
      </div>

      {/* Block Phone Dialog */}
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
                      <Input
                        placeholder="Enter reason for blocking"
                        {...field}
                      />
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

      {/* Confirmation Dialog */}
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

      {/* Blocked Phone Alert Dialog */}
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
            <Button
              variant="destructive"
              onClick={handleProceedWithBlockedPhone}
            >
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
    </div>
  );
}
