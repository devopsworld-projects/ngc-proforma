import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface CompanySettings {
  id: string;
  name: string;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  state_code: string | null;
  postal_code: string | null;
  phone: string[] | null;
  email: string | null;
  website: string | null;
  gstin: string | null;
  logo_url: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useCompanySettings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["companySettings"],
    queryFn: async () => {
      if (!user) return null;
      // Fetch the most recently updated global company settings record
      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as CompanySettings | null;
    },
    enabled: !!user,
  });
}

export function useUpdateCompanySettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (settings: Partial<CompanySettings> & { id?: string; name: string }) => {
      if (!user) throw new Error("Not authenticated");
      if (settings.id) {
        // Update existing global settings
        const { id, ...updateData } = settings;
        const { data, error } = await supabase
          .from("company_settings")
          .update(updateData)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        // Insert new global settings (user_id stored for audit trail)
        const { id, ...insertData } = settings;
        const { data, error } = await supabase
          .from("company_settings")
          .insert({ ...insertData, user_id: user.id })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companySettings"] });
    },
  });
}

export async function uploadCompanyLogo(file: File, userId: string): Promise<string> {
  const fileExt = file.name.split(".").pop();
  // Use shared path for global logos
  const fileName = `shared/logo-${Date.now()}.${fileExt}`;
  
  const { error: uploadError } = await supabase.storage
    .from("company-logos")
    .upload(fileName, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from("company-logos")
    .getPublicUrl(fileName);

  return data.publicUrl;
}

export async function deleteCompanyLogo(url: string, _userId: string): Promise<void> {
  // Extract the path from the URL
  const urlParts = url.split("/company-logos/");
  if (urlParts.length < 2) return;
  
  const filePath = urlParts[1];
  await supabase.storage.from("company-logos").remove([filePath]);
}
