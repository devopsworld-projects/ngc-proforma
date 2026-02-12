import { createContext, useContext, ReactNode } from "react";
import { usePdfTemplateSettings, PdfTemplateSettings } from "@/hooks/usePdfTemplateSettings";

// Default settings matching the database schema
const defaultSettings: Omit<PdfTemplateSettings, "id" | "user_id" | "created_at" | "updated_at"> = {
  primary_color: "#294172",
  secondary_color: "#3b82f6",
  accent_color: "#d4a02c",
  header_text_color: "#ffffff",
  table_header_bg: "#f3f4f6",
  table_header_text: "#374151",
  table_text_color: "#1f2937",
  grand_total_bg: "#1e2a4a",
  grand_total_text: "#ffffff",
  template_style: "bold_corporate",
  header_layout: "centered",
  font_heading: "Montserrat",
  font_body: "Inter",
  font_mono: "Roboto Mono",
  font_size_scale: "normal",
  invoice_title: "PROFORMA INVOICE",
  bill_to_label: "Bill To",
  invoice_details_label: "Invoice Details",
  show_logo: true,
  show_gstin_header: true,
  show_contact_header: true,
  show_company_state: true,
  show_shipping_address: false,
  show_customer_email: true,
  show_customer_phone: true,
  show_image_column: true,
  show_brand_column: true,
  show_unit_column: true,
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
  section_order: ["header", "customer_details", "items_table", "totals", "bank_details", "terms", "signature"],
  // Spacing & Sizing
  header_padding: "normal",
  header_layout_style: "centered",
  logo_size: "medium",
  section_spacing: "normal",
  table_row_padding: "normal",
  footer_padding: "normal",
  show_invoice_title: true,
  compact_header: false,
  border_style: "subtle",
  table_border_color: "#e5e7eb",
  custom_canvas_data: null,
};

export interface PdfTemplateContextValue {
  settings: typeof defaultSettings;
  isLoading: boolean;
}

const PdfTemplateContext = createContext<PdfTemplateContextValue | undefined>(undefined);

export function PdfTemplateProvider({ children }: { children: ReactNode }) {
  const { data: templateSettings, isLoading } = usePdfTemplateSettings();

  const settings = {
    ...defaultSettings,
    ...(templateSettings || {}),
  };

  return (
    <PdfTemplateContext.Provider value={{ settings, isLoading }}>
      {children}
    </PdfTemplateContext.Provider>
  );
}

export function usePdfTemplate() {
  const context = useContext(PdfTemplateContext);
  if (!context) {
    // Return defaults if used outside provider
    return { settings: defaultSettings, isLoading: false };
  }
  return context;
}
