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
    queryKey: ["companySettings", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
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
  // Use path-based ownership: {user_id}/logo-{timestamp}.{ext}
  const fileName = `${userId}/logo-${Date.now()}.${fileExt}`;
  
  const { error: uploadError } = await supabase.storage
    .from("company-logos")
    .upload(fileName, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from("company-logos")
    .getPublicUrl(fileName);

  return data.publicUrl;
}

export async function deleteCompanyLogo(url: string, userId: string): Promise<void> {
  // Extract the filename from the URL (format: {user_id}/logo-{timestamp}.{ext})
  const urlParts = url.split("/");
  const fileName = urlParts.pop();
  if (!fileName) return;
  
  // Reconstruct the path with user_id prefix for proper ownership validation
  const filePath = `${userId}/${fileName}`;
  await supabase.storage.from("company-logos").remove([filePath]);
}
