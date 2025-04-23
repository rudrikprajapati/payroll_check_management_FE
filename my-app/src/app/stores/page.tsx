"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Store, User } from "../_types";

const formSchema = z.object({
  store_name: z.string().min(1, "Store name is required"),
  address: z.string().min(1, "Address is required"),
});

export default function StoresPage() {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [isAddingStore, setIsAddingStore] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      store_name: "",
      address: "",
    },
  });

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (user?.user_id) {
      fetchStores();
    }
  }, [user]);

  const fetchStores = async () => {
    if (!user?.user_id) return;

    try {
      const response = await fetch("http://localhost:8080/store/get", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: user.user_id }),
      });
      const data = await response.json();
      setStores(data);
    } catch (error) {
      console.error("Error fetching stores:", error);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user?.user_id) return;

    try {
      const response = await fetch("http://localhost:8080/store/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.user_id,
          store_name: values.store_name,
          address: values.address,
        }),
      });

      if (response.ok) {
        form.reset();
        setIsAddingStore(false);
        fetchStores();
      }
    } catch (error) {
      console.error("Error creating store:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Stores</h1>
        <Button onClick={() => setIsAddingStore(true)}>Add New Store</Button>
      </div>

      {isAddingStore && (
        <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Add New Store</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="store_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter store name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter store address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-4">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Adding..." : "Create Store"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddingStore(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {!stores && !isAddingStore ? (
          <div className="text-center text-gray-600 mt-8">
            <p>You have no stores. Please add a store to get started.</p>
          </div>
        ) : (
          <>
            {stores?.map((store) => (
              <div
                key={store.store_id}
                className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() =>
                  router.push(`/stores/${store.store_id}/employees`)
                }
              >
                <h2 className="text-xl font-semibold mb-2">
                  {store.store_name}
                </h2>
                <p className="text-gray-600 mb-4">{store.address}</p>
                <div className="text-sm text-gray-500">
                  <p>
                    Created: {new Date(store.created_at).toLocaleDateString()}
                  </p>
                  {store.updated_by && (
                    <p>Last updated by: {store.updated_by}</p>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
