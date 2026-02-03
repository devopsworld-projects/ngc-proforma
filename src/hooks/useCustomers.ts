import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type TaxType = "cgst" | "igst";

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  gstin: string | null;
  state: string | null;
  state_code: string | null;
  is_active: boolean;
  notes: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  customer_type: string;
  tax_type: string; // "cgst" or "igst" - stored as string in DB
}

export interface Address {
  id: string;
  customer_id: string;
  address_type: "billing" | "shipping";
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  state_code: string | null;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerWithAddresses extends Customer {
  addresses: Address[];
}

export interface CustomerWithCreator extends Customer {
  creator_name?: string | null;
}

export function useCustomers() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      if (!user) return [];
      
      // Fetch customers
      const { data: customers, error: customersError } = await supabase
        .from("customers")
        .select("*")
        .order("name");
      if (customersError) throw customersError;
      if (!customers || customers.length === 0) return [];

      // Get unique user_ids to fetch profiles
      const userIds = [...new Set(customers.map(c => c.user_id).filter(Boolean))] as string[];
      
      // Fetch profiles for creator names
      let profilesMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);
        
        if (profiles) {
          profilesMap = profiles.reduce((acc, p) => {
            acc[p.id] = p.full_name || "Unknown";
            return acc;
          }, {} as Record<string, string>);
        }
      }

      // Map customers with creator names
      return customers.map((c) => ({
        ...c,
        creator_name: c.user_id ? profilesMap[c.user_id] || null : null,
      })) as CustomerWithCreator[];
    },
    enabled: !!user,
  });
}

export function useCustomer(id: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["customer", id],
    queryFn: async () => {
      if (!id) return null;
      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (customerError) throw customerError;
      if (!customer) return null;

      const { data: addresses, error: addressError } = await supabase
        .from("addresses")
        .select("*")
        .eq("customer_id", id)
        .order("address_type");
      if (addressError) throw addressError;

      return { ...customer, addresses: addresses || [] } as CustomerWithAddresses;
    },
    enabled: !!id && !!user,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (customer: Omit<Customer, "id" | "created_at" | "updated_at" | "user_id">) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("customers")
        .insert({ ...customer, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...customer }: Partial<Customer> & { id: string }) => {
      const { data, error } = await supabase
        .from("customers")
        .update(customer)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer", data.id] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (address: Omit<Address, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("addresses")
        .insert(address)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["customer", data.customer_id] });
    },
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...address }: Partial<Address> & { id: string }) => {
      const { data, error } = await supabase
        .from("addresses")
        .update(address)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["customer", data.customer_id] });
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, customerId }: { id: string; customerId: string }) => {
      const { error } = await supabase.from("addresses").delete().eq("id", id);
      if (error) throw error;
      return { customerId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["customer", data.customerId] });
    },
  });
}
