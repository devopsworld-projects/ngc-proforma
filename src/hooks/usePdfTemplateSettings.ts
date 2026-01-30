import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface PdfTemplateSettings {
  id: string;
  user_id: string;
  
  // Colors
  primary_color: string;
  secondary_color: string;
  header_text_color: string;
  table_text_color: string;
  
  // Section visibility
  show_logo: boolean;
  show_gstin_header: boolean;
  show_contact_header: boolean;
  show_shipping_address: boolean;
  show_serial_numbers: boolean;
  show_discount_column: boolean;
  show_terms: boolean;
  show_signature: boolean;
  show_amount_words: boolean;
  
  // Custom content
  terms_line1: string | null;
  terms_line2: string | null;
  terms_line3: string | null;
  custom_footer_text: string | null;
  bank_name: string | null;
  bank_account_no: string | null;
  bank_ifsc: string | null;
  bank_branch: string | null;
  
  created_at: string;
  updated_at: string;
}

export const defaultPdfTemplateSettings: Omit<PdfTemplateSettings, "id" | "user_id" | "created_at" | "updated_at"> = {
  primary_color: "#294172",
  secondary_color: "#3b82f6",
  header_text_color: "#ffffff",
  table_text_color: "#1f2937",
  show_logo: true,
  show_gstin_header: true,
  show_contact_header: true,
  show_shipping_address: false,
  show_serial_numbers: true,
  show_discount_column: true,
  show_terms: true,
  show_signature: true,
  show_amount_words: true,
  terms_line1: "Goods once sold will not be taken back.",
  terms_line2: "Subject to local jurisdiction only.",
  terms_line3: "E&OE - Errors and Omissions Excepted.",
  custom_footer_text: null,
  bank_name: null,
  bank_account_no: null,
  bank_ifsc: null,
  bank_branch: null,
};

export function usePdfTemplateSettings() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["pdfTemplateSettings"],
    queryFn: async () => {
      if (!user) return null;
      
      // Fetch the single global PDF template settings record
      const { data, error } = await supabase
        .from("pdf_template_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as PdfTemplateSettings | null;
    },
    enabled: !!user,
  });
}

export function useUpdatePdfTemplateSettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (settings: Partial<PdfTemplateSettings> & { id?: string }) => {
      if (!user) throw new Error("Not authenticated");
      
      if (settings.id) {
        // Update existing global settings
        const { id, user_id, created_at, updated_at, ...updateData } = settings as PdfTemplateSettings;
        const { data, error } = await supabase
          .from("pdf_template_settings")
          .update(updateData)
          .eq("id", id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Insert new global settings (user_id stored for audit trail)
        const { id, user_id, created_at, updated_at, ...insertData } = settings as any;
        const { data, error } = await supabase
          .from("pdf_template_settings")
          .insert({ ...insertData, user_id: user.id })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdfTemplateSettings"] });
    },
  });
}
