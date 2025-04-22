"use client";

import { createContext, useContext, ReactNode, useState } from "react";

interface Employee {
  id: number;
  full_name: string;
  employee_code: string;
  mobile_number: string;
}

interface EmployeeContextType {
  selectedEmployee: Employee | null;
  setSelectedEmployee: (employee: Employee | null) => void;
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

export function EmployeeProvider({ children }: { children: ReactNode }) {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  return (
    <EmployeeContext.Provider value={{ selectedEmployee, setSelectedEmployee }}>
      {children}
    </EmployeeContext.Provider>
  );
}

export function useEmployee() {
  const context = useContext(EmployeeContext);
  if (context === undefined) {
    throw new Error("useEmployee must be used within an EmployeeProvider");
  }
  return context;
} 