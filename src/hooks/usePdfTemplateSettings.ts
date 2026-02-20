import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface PdfTemplateSettings {
  id: string;
  user_id: string;
  
  // Colors
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  header_text_color: string;
  table_header_bg: string;
  table_header_text: string;
  table_text_color: string;
  grand_total_bg: string;
  grand_total_text: string;
  
  // Template style
  template_style: string;
  header_layout: string;
  
  // Fonts
  font_heading: string;
  font_body: string;
  font_mono: string;
  font_size_scale: string;
  
  // Labels
  invoice_title: string;
  bill_to_label: string;
  invoice_details_label: string;
  
  // Section visibility
  show_logo: boolean;
  show_gstin_header: boolean;
  show_contact_header: boolean;
  show_company_state: boolean;
  show_shipping_address: boolean;
  show_customer_email: boolean;
  show_customer_phone: boolean;
  show_image_column: boolean;
  show_brand_column: boolean;
  show_unit_column: boolean;
  show_serial_numbers: boolean;
  show_discount_column: boolean;
  show_terms: boolean;
  show_signature: boolean;
  show_amount_words: boolean;
  show_gst: boolean;
  
  // Custom content
  terms_line1: string | null;
  terms_line2: string | null;
  terms_line3: string | null;
  terms_line4: string | null;
  terms_line5: string | null;
  terms_line6: string | null;
  custom_footer_text: string | null;
  bank_name: string | null;
  bank_account_no: string | null;
  bank_ifsc: string | null;
  bank_branch: string | null;
  
  // Layout
  section_order: string[];
  
  // Spacing & Sizing (new)
  header_padding: string;
  header_layout_style: string;
  logo_size: string;
  section_spacing: string;
  table_row_padding: string;
  footer_padding: string;
  show_invoice_title: boolean;
  compact_header: boolean;
  border_style: string;
  table_border_color: string;
  
  // Canvas data
  custom_canvas_data: any | null;
  
  created_at: string;
  updated_at: string;
}

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
