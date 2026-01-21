import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  created_at: string;
  updated_at: string;
}

export function useCompanySettings() {
  return useQuery({
    queryKey: ["companySettings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data as CompanySettings | null;
    },
  });
}

export function useUpdateCompanySettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settings: Partial<CompanySettings> & { id?: string; name: string }) => {
      if (settings.id) {
        // Update existing
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
        // Insert new
        const { id, ...insertData } = settings;
        const { data, error } = await supabase
          .from("company_settings")
          .insert(insertData)
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

export async function uploadCompanyLogo(file: File): Promise<string> {
  const fileExt = file.name.split(".").pop();
  const fileName = `logo-${Date.now()}.${fileExt}`;
  
  const { error: uploadError } = await supabase.storage
    .from("company-logos")
    .upload(fileName, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from("company-logos")
    .getPublicUrl(fileName);

  return data.publicUrl;
}

export async function deleteCompanyLogo(url: string): Promise<void> {
  const fileName = url.split("/").pop();
  if (!fileName) return;
  
  await supabase.storage.from("company-logos").remove([fileName]);
}
