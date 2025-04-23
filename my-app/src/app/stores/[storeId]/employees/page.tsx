"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { Employee } from "@/app/_types";

const formSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  employee_code: z.string().min(1, "Employee code is required"),
  mobile_number: z.string().min(10, "Mobile number must be at least 10 digits"),
});

export default function EmployeesPage() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.storeId as string;
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setSelectedEmployee } = useEmployee();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      employee_code: "",
      mobile_number: "",
    },
  });

  useEffect(() => {
    fetchEmployees();
  }, [storeId]);

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
      setEmployees(data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const response = await fetch("http://localhost:8080/employee/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          store_id: parseInt(storeId),
          full_name: values.full_name,
          employee_code: values.employee_code,
          mobile_number: values.mobile_number,
        }),
      });

      if (response.ok) {
        form.reset();
        setIsAddingEmployee(false);
        fetchEmployees();
      }
    } catch (error) {
      console.error("Error creating employee:", error);
      setError("Please try with different mobile number or try again later...");
    }
  };

  const handleViewPayrollChecks = (employee: Employee) => {
    setSelectedEmployee(employee);
    router.push(`/stores/${storeId}/employees/${employee.id}/payroll_checks`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Store Employees</h1>
        <Button onClick={() => setIsAddingEmployee(true)}>
          Add New Employee
        </Button>
      </div>

      {isAddingEmployee && (
        <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Add New Employee</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter employee full name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="employee_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter employee code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mobile_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter mobile number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <div className="flex gap-4">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting
                    ? "Adding..."
                    : "Create Employee"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddingEmployee(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {!employees ? (
          <div className="text-center text-gray-600 mt-8">
            <p>No employees found. Please add an employee to get started.</p>
          </div>
        ) : (
          <>
            {employees?.map((employee) => (
              <div
                key={employee.id}
                className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
              >
                <h2 className="text-xl font-semibold mb-2">
                  {employee.full_name}
                </h2>
                <p className="text-gray-600 mb-2">
                  Code: {employee.employee_code}
                </p>
                <p className="text-gray-600 mb-4">
                  Mobile: {employee.mobile_number}
                </p>
                <div className="text-sm text-gray-500 mb-4">
                  <p>
                    Created:{" "}
                    {new Date(employee.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  onClick={() => handleViewPayrollChecks(employee)}
                  className="w-full"
                >
                  View Payroll Checks
                </Button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
