import { InvoiceData } from "@/types/invoice";
import { InvoiceHeader } from "./InvoiceHeader";
import { InvoiceTable } from "./InvoiceTable";
import { InvoiceTotals } from "./InvoiceTotals";
import { InvoiceFooter } from "./InvoiceFooter";
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
      case "terms":
      case "signature":
        // These are handled by InvoiceFooter
        return null;
      default:
        return null;
    }
  };

  // Get footer visibility based on section order
  const footerSections = useMemo(() => {
    const order = settings.section_order || [];
    return {
      showBankDetails: order.includes("bank_details") && !!settings.bank_name,
      showTerms: order.includes("terms") && settings.show_terms,
      showSignature: order.includes("signature") && settings.show_signature,
    };
  }, [settings.section_order, settings.bank_name, settings.show_terms, settings.show_signature]);

  // Determine if we should show the footer
  const showFooter = footerSections.showBankDetails || footerSections.showTerms || footerSections.showSignature;

  // Filter section order to only include main sections
  const mainSections = (settings.section_order || ["header", "customer_details", "items_table", "totals"])
    .filter(s => ["header", "customer_details", "items_table", "totals"].includes(s));

  return (
    <div 
      id={containerId} 
      className="invoice-container animate-fade-in"
      style={{
        fontFamily: settings.font_body,
        "--invoice-primary": settings.primary_color,
        "--invoice-accent": settings.accent_color,
        "--invoice-header-text": settings.header_text_color,
      } as React.CSSProperties}
    >
      {/* Page break indicator - shows where page 2 would start */}
      <div className="invoice-page-indicator no-print" aria-hidden="true" />
      
      {/* Gold Accent Bar */}
      <div className="invoice-accent-bar" style={{ backgroundColor: settings.accent_color }} />
      
      {/* Render sections in order */}
      {mainSections.map(sectionId => renderSection(sectionId))}

      {/* Footer - Terms, Bank Details, Signature */}
      {showFooter && (
        <InvoiceFooter 
          company={data.company} 
          termsAndConditions={footerSections.showTerms ? termsArray : []}
          bankDetails={footerSections.showBankDetails ? bankDetails : undefined}
          showSignature={footerSections.showSignature}
          settings={settings}
        />
      )}

      {/* Bottom Gold Accent */}
      <div className="invoice-accent-bar" style={{ backgroundColor: settings.accent_color }} />
    </div>
  );
}
