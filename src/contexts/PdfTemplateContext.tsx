import { createContext, useContext, ReactNode } from "react";
import { usePdfTemplateSettings, PdfTemplateSettings } from "@/hooks/usePdfTemplateSettings";

// Default settings matching the database schema
const defaultSettings: Omit<PdfTemplateSettings, "id" | "user_id" | "created_at" | "updated_at"> = {
  primary_color: "#000000",
  secondary_color: "#333333",
  accent_color: "#666666",
  header_text_color: "#ffffff",
  table_header_bg: "#f5f5f5",
  table_header_text: "#000000",
  table_text_color: "#1a1a1a",
  grand_total_bg: "#000000",
  grand_total_text: "#ffffff",
  template_style: "clean_bw",
  header_layout: "centered",
  font_heading: "Inter",
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
  // Spacing & Sizing - compact defaults to fit single-product on one page
  header_padding: "compact",
  header_layout_style: "centered",
  logo_size: "small",
  section_spacing: "compact",
  table_row_padding: "compact",
  footer_padding: "compact",
  show_invoice_title: true,
  compact_header: true,
  border_style: "subtle",
  table_border_color: "#d4d4d4",
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
