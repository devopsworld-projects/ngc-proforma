import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  unit: string;
  rate: number;
  hsn_code: string | null;
  category: string | null;
  stock_quantity: number;
  is_active: boolean;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  model_spec: string | null;
  gst_percent: number | null;
  image_url: string | null;
  profiles?: {
    full_name: string | null;
  } | null;
}

export function useProducts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      if (!user) return [];
      // Get products first
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (productsError) throw productsError;
      
      // Get unique user_ids and fetch their profiles
      const userIds = [...new Set(productsData.map(p => p.user_id).filter(Boolean))] as string[];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);
      
      const profilesMap = new Map(profilesData?.map(p => [p.id, p.full_name]) || []);
      
      // Attach profile info to products
      const productsWithProfiles = productsData.map(product => ({
        ...product,
        profiles: product.user_id ? { full_name: profilesMap.get(product.user_id) || null } : null
      }));
      
      return productsWithProfiles as Product[];
    },
    enabled: !!user,
  });
}

// Sanitize search input to prevent SQL injection via special LIKE pattern characters
function sanitizeSearchTerm(term: string): string {
  // Escape special characters used in SQL LIKE patterns: %, _, \
  // Also remove potential SQL injection characters: ', ", ;
  return term
    .replace(/[%_\\'"`;]/g, '')  // Remove dangerous characters
    .trim()
    .slice(0, 100);  // Limit length to prevent abuse
}

export function useSearchProducts(searchTerm: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["products", "search", searchTerm],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("name");

      const sanitizedTerm = sanitizeSearchTerm(searchTerm);
      if (sanitizedTerm) {
        query = query.or(`name.ilike.%${sanitizedTerm}%,sku.ilike.%${sanitizedTerm}%,description.ilike.%${sanitizedTerm}%`);
      }

      const { data, error } = await query.limit(20);
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!user,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (product: Omit<Product, "id" | "created_at" | "updated_at" | "user_id">) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("products")
        .insert({ ...product, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export interface BulkImportOptions {
  stockMode: "replace" | "add"; // replace = set stock to imported value, add = add to existing stock
}

export interface BulkImportResult {
  created: number;
  updated: number;
  total: number;
}

export function useBulkCreateProducts() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ 
      products, 
      options = { stockMode: "replace" } 
    }: { 
      products: Omit<Product, "id" | "created_at" | "updated_at" | "user_id">[]; 
      options?: BulkImportOptions;
    }): Promise<BulkImportResult> => {
      if (!user) throw new Error("Not authenticated");
      
      // Get existing products by SKU to determine new vs update
      const skus = products.filter(p => p.sku).map(p => p.sku);
      const { data: existingProducts } = await supabase
        .from("products")
        .select("id, sku, stock_quantity")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .in("sku", skus);
      
      const existingSkuMap = new Map(
        (existingProducts || []).map(p => [p.sku, { id: p.id, stock: p.stock_quantity }])
      );
      
      // Prepare products with adjusted stock if needed
      const productsWithUserId = products.map(p => {
        let finalStock = p.stock_quantity;
        
        if (options.stockMode === "add" && p.sku && existingSkuMap.has(p.sku)) {
          const existing = existingSkuMap.get(p.sku)!;
          finalStock = (existing.stock || 0) + p.stock_quantity;
        }
        
        return { ...p, stock_quantity: finalStock, user_id: user.id };
      });
      
      // Use upsert with the composite unique index on (user_id, sku)
      const { data, error } = await supabase
        .from("products")
        .upsert(productsWithUserId, { 
          onConflict: "user_id,sku",
          ignoreDuplicates: false 
        })
        .select();
      if (error) throw error;
      
      // Calculate stats
      const createdCount = products.filter(p => !p.sku || !existingSkuMap.has(p.sku)).length;
      const updatedCount = products.filter(p => p.sku && existingSkuMap.has(p.sku)).length;
      
      return {
        created: createdCount,
        updated: updatedCount,
        total: data?.length || 0,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, ...product }: Partial<Product> & { id: string }) => {
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("products")
        .update(product)
        .eq("id", id)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      
      // If no data returned, the update was blocked (likely RLS - not your product)
      if (!data) {
        throw new Error("You can only update products that you created");
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("products")
        .update({ is_active: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
