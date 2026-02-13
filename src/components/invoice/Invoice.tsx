import { InvoiceData } from "@/types/invoice";
import { InvoiceHeader } from "./InvoiceHeader";
import { InvoiceTable } from "./InvoiceTable";
import { InvoiceTotals } from "./InvoiceTotals";
import { InvoiceFooter } from "./InvoiceFooter";
import { CanvasOverlay } from "./CanvasOverlay";
import { usePdfTemplate } from "@/contexts/PdfTemplateContext";
import { useMemo } from "react";

interface InvoiceProps {
  data: InvoiceData;
  containerId?: string;
}

export function Invoice({ data, containerId = "invoice-container" }: InvoiceProps) {
  const { settings } = usePdfTemplate();

  // Build terms array from settings
  const termsArray = useMemo(() => {
    return [
      settings.terms_line1,
      settings.terms_line2,
      settings.terms_line3,
      settings.terms_line4,
    ].filter(Boolean) as string[];
  }, [settings.terms_line1, settings.terms_line2, settings.terms_line3]);

  // Build bank details from settings
  const bankDetails = useMemo(() => {
    if (!settings.bank_name) return undefined;
    return {
      bankName: settings.bank_name || undefined,
      accountNo: settings.bank_account_no || undefined,
      ifsc: settings.bank_ifsc || undefined,
      branch: settings.bank_branch || undefined,
    };
  }, [settings.bank_name, settings.bank_account_no, settings.bank_ifsc, settings.bank_branch]);

  // Get spacing classes for sections
  const getSectionSpacingClass = () => {
    switch (settings.section_spacing) {
      case "compact": return "py-1";
      case "relaxed": return "py-4";
      default: return "py-2";
    }
  };

  // Render sections based on order
  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case "header":
        return (
          <InvoiceHeader
            key="header"
            company={data.company}
            invoiceNo={data.invoiceNo}
            date={data.date}
            eWayBillNo={data.eWayBillNo}
            supplierInvoiceNo={data.supplierInvoiceNo}
            supplierInvoiceDate={data.supplierInvoiceDate}
            otherReferences={data.otherReferences}
            customer={{
              name: data.supplier.name,
              address: data.supplier.address,
              gstin: data.supplier.gstin,
              state: data.supplier.state,
              stateCode: data.supplier.stateCode,
              email: settings.show_customer_email ? data.supplier.email : undefined,
              phone: settings.show_customer_phone ? data.supplier.phone : undefined,
            }}
            settings={{
              ...settings,
              header_padding: settings.header_padding,
              header_layout_style: settings.header_layout_style,
              logo_size: settings.logo_size,
              show_invoice_title: settings.show_invoice_title,
              compact_header: settings.compact_header,
            }}
          />
        );
      case "customer_details":
        // Customer details are now part of the header section
        return null;
      case "items_table":
        return (
          <div key="items_table">
            <InvoiceTable 
              items={data.items} 
              settings={{
                ...settings,
                show_gst: settings.show_gst,
                table_row_padding: settings.table_row_padding,
                border_style: settings.border_style,
                table_border_color: settings.table_border_color,
              }} 
            />
            <div className="border-t border-dashed border-gray-300" />
          </div>
        );
      case "totals":
        return settings.show_amount_words ? (
          <InvoiceTotals
            key="totals"
            totals={data.totals}
            totalQuantity={data.totalQuantity}
            amountInWords={data.amountInWords}
            items={data.items}
            taxType={data.taxType}
            settings={settings}
          />
        ) : (
          <InvoiceTotals
            key="totals"
            totals={data.totals}
            totalQuantity={data.totalQuantity}
            amountInWords=""
            items={data.items}
            taxType={data.taxType}
            settings={settings}
          />
        );
      case "bank_details":
      case "terms": {
        // Render terms and bank details together side-by-side on whichever comes first
        const otherKey = sectionId === "bank_details" ? "terms" : "bank_details";
        const allSects = settings.section_order || [];
        const otherIndex = allSects.indexOf(otherKey);
        const thisIndex = allSects.indexOf(sectionId);
        // Only render combined on the first occurrence; skip the second
        if (otherIndex >= 0 && otherIndex < thisIndex) return null;
        
        const showTermsHere = settings.show_terms;
        const showBankHere = !!settings.bank_name;
        if (!showTermsHere && !showBankHere) return null;
        
        return (
          <InvoiceFooter
            key="terms_bank"
            company={data.company}
            termsAndConditions={showTermsHere ? termsArray : []}
            bankDetails={showBankHere ? bankDetails : undefined}
            showSignature={false}
            settings={settings}
          />
        );
      }
      case "signature":
        if (!settings.show_signature) return null;
        return (
          <InvoiceFooter
            key="signature"
            company={data.company}
            termsAndConditions={[]}
            bankDetails={undefined}
            showSignature={true}
            settings={settings}
          />
        );
      default:
        return null;
    }
  };

  // Use full section order for rendering
  const allSections = settings.section_order || ["header", "customer_details", "items_table", "totals", "bank_details", "terms", "signature"];

  return (
    <div 
      id={containerId} 
      className="invoice-container animate-fade-in"
      style={{
        position: "relative",
        fontFamily: settings.font_body,
        "--invoice-primary": settings.primary_color,
        "--invoice-accent": settings.accent_color,
        "--invoice-header-text": settings.header_text_color,
      } as React.CSSProperties}
    >
      {/* Canvas overlay for custom elements from the template editor */}
      <CanvasOverlay />
      {/* Page break indicator - shows where page 2 would start */}
      <div className="invoice-page-indicator no-print" aria-hidden="true" />
      
      {/* Gold Accent Bar */}
      <div className="invoice-accent-bar" style={{ backgroundColor: settings.accent_color }} />
      
      {/* Render ALL sections in order */}
      {allSections.map(sectionId => renderSection(sectionId))}

      {/* Bottom Gold Accent */}
      <div className="invoice-accent-bar" style={{ backgroundColor: settings.accent_color }} />
    </div>
  );
}
