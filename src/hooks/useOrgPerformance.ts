import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useIsAdmin } from "./useAdmin";

export interface UserPerformance {
  user_id: string;
  full_name: string | null;
  email: string;
  proformas_created: number;
  proformas_sent: number;
  proformas_paid: number;
  total_revenue: number;
  customers_added: number;
  products_added: number;
  session_count: number;
  last_login: string | null;
}

export interface TopProduct {
  product_name: string;
  total_quantity: number;
  total_amount: number;
  invoice_count: number;
  seller_name: string;
}

export function useOrgPerformanceStats() {
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ["orgPerformanceStats"],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_org_performance_stats");
      if (error) throw error;
      return data as UserPerformance[];
    },
    enabled: !!user && isAdmin === true,
  });
}

export function useTopProductsStats() {
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ["topProductsStats"],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_top_products_stats", { limit_count: 20 });
      if (error) throw error;
      return data as TopProduct[];
    },
    enabled: !!user && isAdmin === true,
  });
}
