"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export const HomePage = () => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("user");
    setIsAuthenticated(!!user);
  }, []);

  const handleLogout = (): void => {
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    router.push("/login");
  };

  const handleLogin = (): void => {
    router.push("/login");
  };

  const handleRegister = (): void => {
    router.push("/register");
  };
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="flex justify-end gap-4 mb-8">
        {isAuthenticated ? (
          <Button
            onClick={handleLogout}
            variant="outline"
            className="text-blue-800 hover:bg-blue-50"
          >
            Logout
          </Button>
        ) : (
          <>
            <Button
              onClick={handleLogin}
              className="bg-blue-800 hover:bg-blue-900 text-white"
            >
              Login
            </Button>
            <Button
              onClick={handleRegister}
              variant="outline"
              className="text-blue-800 hover:bg-blue-50"
            >
              Register
            </Button>
          </>
        )}
      </div>
      <h1 className="text-4xl md:text-5xl font-bold text-center text-blue-800 mb-4">
        Grocery Payroll Management
      </h1>
      <p className="text-lg text-gray-600 text-center">
        Streamline your grocery store payroll operations
      </p>
    </div>
  );
};
