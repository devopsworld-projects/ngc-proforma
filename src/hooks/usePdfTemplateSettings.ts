import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface PdfTemplateSettings {
  id: string;
  user_id: string;
  
  // Template style
  template_style: 'bold_corporate' | 'modern_minimal' | 'classic_professional';
  
  // Colors
  primary_color: string;
  secondary_color: string;
  header_text_color: string;
  table_text_color: string;
  accent_color: string;
  table_header_bg: string;
  table_header_text: string;
  grand_total_bg: string;
  grand_total_text: string;
  
  // Font customization
  font_heading: string;
  font_body: string;
  font_mono: string;
  font_size_scale: 'small' | 'normal' | 'large';
  
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
  
  // Layout options
  header_layout: 'centered' | 'left_aligned' | 'split';
  show_brand_column: boolean;
  show_unit_column: boolean;
  show_image_column: boolean;
  show_company_state: boolean;
  show_customer_email: boolean;
  show_customer_phone: boolean;
  
  // Custom labels
  invoice_title: string;
  bill_to_label: string;
  invoice_details_label: string;
  
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
  // Template style
  template_style: 'bold_corporate',
  
  // Colors
  primary_color: "#294172",
  secondary_color: "#3b82f6",
  header_text_color: "#ffffff",
  table_text_color: "#1f2937",
  accent_color: "#d4a02c",
  table_header_bg: "#f3f4f6",
  table_header_text: "#374151",
  grand_total_bg: "#1e2a4a",
  grand_total_text: "#ffffff",
  
  // Fonts
  font_heading: "Montserrat",
  font_body: "Inter",
  font_mono: "Roboto Mono",
  font_size_scale: "normal",
  
  // Section visibility
  show_logo: true,
  show_gstin_header: true,
  show_contact_header: true,
  show_shipping_address: false,
  show_serial_numbers: true,
  show_discount_column: true,
  show_terms: true,
  show_signature: true,
  show_amount_words: true,
  
  // Layout options
  header_layout: 'centered',
  show_brand_column: true,
  show_unit_column: true,
  show_image_column: true,
  show_company_state: true,
  show_customer_email: true,
  show_customer_phone: true,
  
  // Custom labels
  invoice_title: "PROFORMA INVOICE",
  bill_to_label: "Bill To",
  invoice_details_label: "Invoice Details",
  
  // Custom content
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
      
      // Fetch the most recently updated global PDF template settings record
      const { data, error } = await supabase
        .from("pdf_template_settings")
        .select("*")
        .order("updated_at", { ascending: false })
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
