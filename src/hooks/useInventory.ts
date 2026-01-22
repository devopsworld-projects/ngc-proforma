import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

// Stock Movements
export interface StockMovement {
  id: string;
  product_id: string;
  movement_type: "in" | "out" | "adjustment";
  quantity: number;
  serial_numbers: string[];
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  user_id: string | null;
  created_at: string;
  products?: { name: string; sku: string | null };
}

export function useStockMovements(productId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["stock_movements", productId, user?.id],
    queryFn: async () => {
      let query = supabase
        .from("stock_movements")
        .select("*, products(name, sku)")
        .order("created_at", { ascending: false })
        .limit(100);
      
      if (productId) {
        query = query.eq("product_id", productId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as StockMovement[];
    },
    enabled: !!user,
  });
}

export function useCreateStockMovement() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (movement: Omit<StockMovement, "id" | "created_at" | "user_id" | "products">) => {
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("stock_movements")
        .insert({ ...movement, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      
      // Update product stock quantity directly
      const multiplier = movement.movement_type === "in" ? 1 : -1;
      const { data: product } = await supabase
        .from("products")
        .select("stock_quantity")
        .eq("id", movement.product_id)
        .single();
      
      if (product) {
        await supabase
          .from("products")
          .update({ stock_quantity: (product.stock_quantity || 0) + (movement.quantity * multiplier) })
          .eq("id", movement.product_id);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock_movements"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

// Product Serials
export interface ProductSerial {
  id: string;
  product_id: string;
  serial_number: string;
  status: "in_stock" | "sold" | "in_service" | "defective" | "returned";
  purchase_date: string | null;
  warranty_expiry: string | null;
  supplier_id: string | null;
  purchase_price: number;
  sold_date: string | null;
  sold_invoice_id: string | null;
  notes: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  products?: { name: string; sku: string | null };
  suppliers?: { name: string } | null;
}

export function useProductSerials(productId?: string, status?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["product_serials", productId, status, user?.id],
    queryFn: async () => {
      let query = supabase
        .from("product_serials")
        .select("*, products(name, sku), suppliers(name)")
        .order("created_at", { ascending: false });
      
      if (productId) {
        query = query.eq("product_id", productId);
      }
      if (status) {
        query = query.eq("status", status);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as ProductSerial[];
    },
    enabled: !!user,
  });
}

export function useCreateProductSerial() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (serial: Omit<ProductSerial, "id" | "created_at" | "updated_at" | "user_id" | "products" | "suppliers">) => {
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("product_serials")
        .insert({ ...serial, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product_serials"] });
    },
  });
}

export function useUpdateProductSerial() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...serial }: Partial<ProductSerial> & { id: string }) => {
      const { data, error } = await supabase
        .from("product_serials")
        .update(serial)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product_serials"] });
    },
  });
}

export function useBulkCreateProductSerials() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (serials: Omit<ProductSerial, "id" | "created_at" | "updated_at" | "user_id" | "products" | "suppliers">[]) => {
      if (!user) throw new Error("Not authenticated");
      
      const serialsWithUserId = serials.map(s => ({ ...s, user_id: user.id }));
      const { data, error } = await supabase
        .from("product_serials")
        .insert(serialsWithUserId)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product_serials"] });
    },
  });
}
