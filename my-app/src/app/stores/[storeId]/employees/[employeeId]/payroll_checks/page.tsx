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
import { uid } from "uid";
import { BlockNumberAlert } from "@/app/_components/Dialogs/BlockNumberAlert";
import { ConfirmationDialog } from "@/app/_components/Dialogs/Confirmation";
import { BlockNumberReasonDialog } from "@/app/_components/Dialogs/BlockNumberReasonDialog";
import { PayrollCard } from "@/app/_components/payroll/PayrollCard";
import { Employee, PayrollCheck } from "@/app/_types";

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
      console.log({ check });
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
          payrollChecks.map((check, index) => (
            <>
              <PayrollCard
                key={index}
                check={check}
                handleAction={handleAction}
              />
              {/* <pre>{JSON.stringify(check, null, 2)}</pre> */}
            </>
          ))
        )}
      </div>

      <BlockNumberReasonDialog
        blockForm={blockForm}
        isBlockDialogOpen={isBlockDialogOpen}
        setIsBlockDialogOpen={setIsBlockDialogOpen}
        setIsConfirmDialogOpen={setIsConfirmDialogOpen}
      />

      <ConfirmationDialog
        actionType={actionType}
        handlePayCheck={handlePayCheck}
        handleRejectCheck={handleRejectCheck}
        isConfirmDialogOpen={isConfirmDialogOpen}
        selectedCheck={selectedCheck}
        setIsConfirmDialogOpen={setIsConfirmDialogOpen}
      />

      <BlockNumberAlert
        handleProceedWithBlockedPhone={handleProceedWithBlockedPhone}
        isBlockedAlertOpen={isBlockedAlertOpen}
        setIsBlockedAlertOpen={setIsBlockedAlertOpen}
      />
    </div>
  );
}
