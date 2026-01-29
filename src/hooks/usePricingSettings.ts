import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface PricingSettings {
  id: string;
  user_id: string;
  customer_markup_percent: number;
  dealer_markup_percent: number;
  created_at: string;
  updated_at: string;
}

export function usePricingSettings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["pricing-settings", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("pricing_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as PricingSettings | null;
    },
    enabled: !!user,
  });
}

export function useUpsertPricingSettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (settings: {
      customer_markup_percent: number;
      dealer_markup_percent: number;
    }) => {
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("pricing_settings")
        .upsert({
          user_id: user.id,
          customer_markup_percent: settings.customer_markup_percent,
          dealer_markup_percent: settings.dealer_markup_percent,
        }, {
          onConflict: "user_id",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing-settings"] });
    },
  });
}
