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


  // Determine what goes in the footer
  const showTerms = settings.show_terms;
  const showBank = !!settings.bank_name;
  const showSignature = settings.show_signature;

  const renderFooter = () => {
    if (!showTerms && !showBank && !showSignature) return null;
    return (
      <>
        {(showTerms || showBank) && (
          <InvoiceFooter
            company={data.company}
            termsAndConditions={showTerms ? termsArray : []}
            bankDetails={showBank ? bankDetails : undefined}
            showSignature={false}
            settings={settings}
          />
        )}
        {showSignature && (
          <InvoiceFooter
            company={data.company}
            termsAndConditions={[]}
            bankDetails={undefined}
            showSignature={true}
            settings={settings}
          />
        )}
      </>
    );
  };

  return (
    <div 
      id={containerId} 
      className="invoice-container animate-fade-in"
      style={{
        position: "relative",
        fontFamily: settings.font_body,
        display: "flex",
        flexDirection: "column",
        "--invoice-primary": settings.primary_color,
        "--invoice-accent": settings.accent_color,
        "--invoice-header-text": settings.header_text_color,
      } as React.CSSProperties}
    >
      {/* Canvas overlay for custom elements from the template editor */}
      <CanvasOverlay />
      {/* Page break indicator - shows where page 2 would start */}
      <div className="invoice-page-indicator no-print" aria-hidden="true" />
      
      {/* ===== TOP ACCENT BAR ===== */}
      <div className="invoice-accent-bar" style={{ backgroundColor: settings.accent_color }} />

      {/* ===== HEADER: Company info + Invoice details ===== */}
      <InvoiceHeader
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

      {/* ===== PRODUCTS BODY: Items table ===== */}
      <div>
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

      {/* ===== PRICE BODY: Totals + Amount in words ===== */}
      <InvoiceTotals
        totals={data.totals}
        totalQuantity={data.totalQuantity}
        amountInWords={settings.show_amount_words ? data.amountInWords : ""}
        items={data.items}
        taxType={data.taxType}
        settings={settings}
      />

      {/* ===== FOOTER: Terms + Bank + Signature (pushed to bottom) ===== */}
      <div style={{ marginTop: "auto" }}>
        {renderFooter()}
        {/* Bottom Gold Accent */}
        <div className="invoice-accent-bar" style={{ backgroundColor: settings.accent_color }} />
      </div>
    </div>
  );
}
