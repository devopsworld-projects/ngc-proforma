import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Phone, Mail, Globe, PenLine, FileText, ImageIcon } from "lucide-react";

interface InvoicePreviewPaneProps {
  settings: {
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    header_text_color: string;
    table_header_bg: string;
    table_header_text: string;
    table_text_color: string;
    grand_total_bg: string;
    grand_total_text: string;
    invoice_title: string;
    bill_to_label: string;
    invoice_details_label: string;
    show_logo: boolean;
    show_gstin_header: boolean;
    show_contact_header: boolean;
    show_company_state: boolean;
    show_customer_email: boolean;
    show_customer_phone: boolean;
    show_image_column: boolean;
    show_terms: boolean;
    show_signature: boolean;
    show_amount_words: boolean;
    show_gst?: boolean;
    terms_line1: string | null;
    terms_line2: string | null;
    terms_line3: string | null;
    terms_line4?: string | null;
    bank_name: string | null;
    bank_account_no: string | null;
    bank_ifsc: string | null;
    bank_branch: string | null;
    font_heading: string;
    font_body: string;
    section_order?: string[];
    // Structural / layout settings
    header_layout_style?: string;
    header_padding?: string;
    compact_header?: boolean;
    logo_size?: string;
    section_spacing?: string;
    table_row_padding?: string;
    footer_padding?: string;
    show_invoice_title?: boolean;
    border_style?: string;
    table_border_color?: string;
  };
  companyName?: string;
  companyLogo?: string;
}

export function InvoicePreviewPane({ settings, companyName = "Your Company Name", companyLogo }: InvoicePreviewPaneProps) {
  const sampleItems = useMemo(() => [
    { id: "1", slNo: 1, brand: "Sample Product A", description: "High quality product", quantity: 2, unit: "NOS", rate: 1500, gstPercent: 18, total: 3000 },
    { id: "2", slNo: 2, brand: "Sample Product B", description: "Premium edition", quantity: 1, unit: "NOS", rate: 2500, gstPercent: 18, total: 2500 },
  ], []);

  const termsArray = [
    settings.terms_line1,
    settings.terms_line2,
    settings.terms_line3,
    settings.terms_line4,
  ].filter(Boolean) as string[];

  const showGst = settings.show_gst ?? true;

  const sectionOrder = settings.section_order || ["header", "customer_details", "items_table", "totals", "bank_details", "terms", "signature"];

  const headerLayout = settings.header_layout_style || "centered";
  const headerPadding = settings.header_padding || "normal";
  const isCompactHeader = settings.compact_header ?? false;
  const logoSize = settings.logo_size || "medium";
  const showInvoiceTitle = settings.show_invoice_title ?? true;
  const sectionSpacing = settings.section_spacing || "normal";
  const tableRowPadding = settings.table_row_padding || "normal";
  const footerPadding = settings.footer_padding || "normal";
  const borderStyle = settings.border_style || "subtle";
  const tableBorderColor = settings.table_border_color || "#e5e7eb";

  // Spacing helpers
  const headerPaddingClass = headerPadding === "compact" ? "px-3 py-2" : headerPadding === "relaxed" ? "px-5 py-5" : "px-4 py-3";
  const sectionSpacingClass = sectionSpacing === "compact" ? "py-1" : sectionSpacing === "relaxed" ? "py-3" : "py-2";
  const tableRowPaddingClass = tableRowPadding === "compact" ? "py-0.5 px-1.5" : tableRowPadding === "relaxed" ? "py-2.5 px-3" : "py-1.5 px-2";
  const footerPaddingClass = footerPadding === "compact" ? "px-2 py-1.5" : footerPadding === "relaxed" ? "px-4 py-3" : "px-3 py-2";
  const logoSizeClass = logoSize === "small" ? "w-7 h-7" : logoSize === "large" ? "w-14 h-14" : "w-10 h-10";
  const logoIconClass = logoSize === "small" ? "w-3.5 h-3.5" : logoSize === "large" ? "w-7 h-7" : "w-5 h-5";
  const tableBorder = borderStyle === "none" ? "border-transparent" : borderStyle === "bold" ? "border-b-2" : "border-b";

  // Logo element
  const logoElement = settings.show_logo ? (
    companyLogo ? (
      <img src={companyLogo} alt="Logo" className={`${logoSizeClass} rounded-lg object-contain`} />
    ) : (
      <div className={`${logoSizeClass} rounded-lg flex items-center justify-center`} style={{ backgroundColor: settings.accent_color }}>
        <Building2 className={logoIconClass} style={{ color: settings.primary_color }} />
      </div>
    )
  ) : null;

  // Render header section based on layout style
  const renderHeader = () => {
    if (headerLayout === "split") {
      return (
        <div
          key="header"
          className={`${headerPaddingClass} space-y-2`}
          style={{ backgroundColor: settings.primary_color, color: settings.header_text_color, fontFamily: settings.font_heading }}
        >
          {/* Split: logo+name left, contact right */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {logoElement}
              <div>
                <h1 className={`${isCompactHeader ? "text-sm" : "text-base"} font-bold`}>{companyName}</h1>
                <p className="text-xs opacity-80">123 Business Street, City, State 123456</p>
              </div>
            </div>
            {settings.show_contact_header && (
              <div className="text-right space-y-0.5">
                <span className="flex items-center justify-end gap-1 text-xs opacity-80"><Phone className="w-2.5 h-2.5" /> +91 12345 67890</span>
                <span className="flex items-center justify-end gap-1 text-xs opacity-80"><Mail className="w-2.5 h-2.5" /> email@company.com</span>
              </div>
            )}
          </div>

          {settings.show_gstin_header && (
            <div className="flex gap-2 text-xs">
              <span className="px-2 py-0.5 rounded" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>GSTIN: 29ABCDE1234F1ZH</span>
              {settings.show_company_state && <span className="px-2 py-0.5 rounded" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>State: Karnataka (29)</span>}
            </div>
          )}

          {showInvoiceTitle && (
            <div className="pt-1 border-t border-white/20">
              <h2 className="text-sm font-bold" style={{ color: settings.accent_color }}>{settings.invoice_title}</h2>
            </div>
          )}

          {/* Bill To & Invoice Details */}
          <div className="grid grid-cols-2 gap-3 pt-1 text-left border-t border-white/20">
            <div>
              <p className="text-xs opacity-60 uppercase tracking-wider">{settings.bill_to_label}</p>
              <p className="text-sm font-semibold mt-1">Customer Name</p>
              <p className="text-xs opacity-80">123 Customer Street</p>
              {settings.show_customer_phone && <p className="text-xs opacity-80">Phone: +91 98765 43210</p>}
              {settings.show_customer_email && <p className="text-xs opacity-80">Email: customer@email.com</p>}
            </div>
            <div className="text-right">
              <p className="text-xs opacity-60 uppercase tracking-wider">{settings.invoice_details_label}</p>
              <p className="text-xs mt-1">Proforma No: <span className="font-semibold">INV-001</span></p>
              <p className="text-xs">Date: <span className="font-medium">04-Feb-2026</span></p>
            </div>
          </div>
        </div>
      );
    }

    if (headerLayout === "left-aligned") {
      return (
        <div
          key="header"
          className={`${headerPaddingClass} space-y-2`}
          style={{ backgroundColor: settings.primary_color, color: settings.header_text_color, fontFamily: settings.font_heading }}
        >
          {/* Left-aligned: logo + name + contact all left */}
          <div className="flex items-center gap-2">
            {logoElement}
            <div>
              <h1 className={`${isCompactHeader ? "text-sm" : "text-base"} font-bold`}>{companyName}</h1>
              <p className="text-xs opacity-80">123 Business Street, City, State 123456</p>
              {settings.show_contact_header && (
                <div className="flex flex-wrap gap-2 text-xs opacity-80 mt-0.5">
                  <span className="flex items-center gap-1"><Phone className="w-2.5 h-2.5" /> +91 12345 67890</span>
                  <span className="flex items-center gap-1"><Mail className="w-2.5 h-2.5" /> email@company.com</span>
                  <span className="flex items-center gap-1"><Globe className="w-2.5 h-2.5" /> www.company.com</span>
                </div>
              )}
            </div>
          </div>

          {settings.show_gstin_header && (
            <div className="flex gap-2 text-xs">
              <span className="px-2 py-0.5 rounded" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>GSTIN: 29ABCDE1234F1ZH</span>
              {settings.show_company_state && <span className="px-2 py-0.5 rounded" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>State: Karnataka (29)</span>}
            </div>
          )}

          {showInvoiceTitle && (
            <div className="pt-1 border-t border-white/20">
              <h2 className="text-sm font-bold" style={{ color: settings.accent_color }}>{settings.invoice_title}</h2>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-1 text-left border-t border-white/20">
            <div>
              <p className="text-xs opacity-60 uppercase tracking-wider">{settings.bill_to_label}</p>
              <p className="text-sm font-semibold mt-1">Customer Name</p>
              <p className="text-xs opacity-80">123 Customer Street</p>
              {settings.show_customer_phone && <p className="text-xs opacity-80">Phone: +91 98765 43210</p>}
              {settings.show_customer_email && <p className="text-xs opacity-80">Email: customer@email.com</p>}
            </div>
            <div className="text-right">
              <p className="text-xs opacity-60 uppercase tracking-wider">{settings.invoice_details_label}</p>
              <p className="text-xs mt-1">Proforma No: <span className="font-semibold">INV-001</span></p>
              <p className="text-xs">Date: <span className="font-medium">04-Feb-2026</span></p>
            </div>
          </div>
        </div>
      );
    }

    // Default: centered layout
    return (
      <div
        key="header"
        className={`${headerPaddingClass} text-center space-y-2`}
        style={{ backgroundColor: settings.primary_color, color: settings.header_text_color, fontFamily: settings.font_heading }}
      >
        {logoElement && <div className="flex justify-center">{logoElement}</div>}

        <h1 className={`${isCompactHeader ? "text-sm" : "text-base"} font-bold`}>{companyName}</h1>
        <p className="text-xs opacity-80">123 Business Street, City, State 123456</p>

        {settings.show_contact_header && (
          <div className="flex flex-wrap justify-center gap-2 text-xs opacity-80">
            <span className="flex items-center gap-1"><Phone className="w-2.5 h-2.5" /> +91 12345 67890</span>
            <span className="flex items-center gap-1"><Mail className="w-2.5 h-2.5" /> email@company.com</span>
            <span className="flex items-center gap-1"><Globe className="w-2.5 h-2.5" /> www.company.com</span>
          </div>
        )}

        {settings.show_gstin_header && (
          <div className="flex justify-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>GSTIN: 29ABCDE1234F1ZH</span>
            {settings.show_company_state && <span className="px-2 py-0.5 rounded" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>State: Karnataka (29)</span>}
          </div>
        )}

        {showInvoiceTitle && (
          <div className="pt-2 border-t border-white/20">
            <h2 className="text-sm font-bold" style={{ color: settings.accent_color }}>{settings.invoice_title}</h2>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pt-2 text-left border-t border-white/20">
          <div>
            <p className="text-xs opacity-60 uppercase tracking-wider">{settings.bill_to_label}</p>
            <p className="text-sm font-semibold mt-1">Customer Name</p>
            <p className="text-xs opacity-80">123 Customer Street</p>
            {settings.show_customer_phone && <p className="text-xs opacity-80">Phone: +91 98765 43210</p>}
            {settings.show_customer_email && <p className="text-xs opacity-80">Email: customer@email.com</p>}
          </div>
          <div className="text-right">
            <p className="text-xs opacity-60 uppercase tracking-wider">{settings.invoice_details_label}</p>
            <p className="text-xs mt-1">Proforma No: <span className="font-semibold">INV-001</span></p>
            <p className="text-xs">Date: <span className="font-medium">04-Feb-2026</span></p>
          </div>
        </div>
      </div>
    );
  };

  // Render items table
  const renderItemsTable = () => (
    <div key="items_table" className={`px-3 ${sectionSpacingClass}`}>
      <table className="w-full text-xs" style={{ borderColor: tableBorderColor }}>
        <thead>
          <tr style={{ backgroundColor: settings.table_header_bg, color: settings.table_header_text }}>
            <th className={`${tableRowPaddingClass} text-left font-semibold uppercase text-[10px]`}>Sl</th>
            {settings.show_image_column && <th className={`${tableRowPaddingClass} text-left font-semibold uppercase text-[10px]`}>Img</th>}
            <th className={`${tableRowPaddingClass} text-left font-semibold uppercase text-[10px]`}>Product</th>
            <th className={`${tableRowPaddingClass} text-center font-semibold uppercase text-[10px]`}>Qty</th>
            <th className={`${tableRowPaddingClass} text-right font-semibold uppercase text-[10px]`}>Base Price</th>
            {showGst && <th className={`${tableRowPaddingClass} text-right font-semibold uppercase text-[10px]`}>GST %</th>}
            {showGst && <th className={`${tableRowPaddingClass} text-right font-semibold uppercase text-[10px]`}>GST Amt</th>}
            <th className={`${tableRowPaddingClass} text-right font-semibold uppercase text-[10px]`}>Total</th>
          </tr>
        </thead>
        <tbody style={{ color: settings.table_text_color }}>
          {sampleItems.map((item) => (
            <tr key={item.id} className={tableBorder} style={{ borderColor: tableBorderColor }}>
              <td className={tableRowPaddingClass}>{item.slNo}</td>
              {settings.show_image_column && (
                <td className={tableRowPaddingClass}>
                  <div className="w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: settings.table_header_bg }}>
                    <ImageIcon className="w-3 h-3" style={{ color: settings.table_text_color, opacity: 0.4 }} />
                  </div>
                </td>
              )}
              <td className={tableRowPaddingClass}>
                <p className="font-medium">{item.brand}</p>
                <p className="text-[10px] opacity-70">{item.description}</p>
              </td>
              <td className={`${tableRowPaddingClass} text-center`}>{item.quantity}</td>
              <td className={`${tableRowPaddingClass} text-right font-mono`}>₹{Math.round(item.rate * 100 / 118).toLocaleString()}</td>
              {showGst && <td className={`${tableRowPaddingClass} text-right font-mono`}>{item.gstPercent}%</td>}
              {showGst && <td className={`${tableRowPaddingClass} text-right font-mono`}>₹{Math.round(item.total - item.total * 100 / 118).toLocaleString()}</td>}
              <td className={`${tableRowPaddingClass} text-right font-mono font-medium`}>₹{item.total.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Render totals
  const renderTotals = () => (
    <div key="totals" className="px-3 py-2 bg-white">
      <div className="flex justify-between items-start">
        {settings.show_amount_words && (
          <div className="flex-1 p-2 bg-gray-50 border border-gray-200 mr-3">
            <p className="text-[10px] font-semibold uppercase text-gray-500">Amount in Words</p>
            <p className="text-xs font-medium">Five Thousand Five Hundred Only</p>
          </div>
        )}
        <div className="w-40 space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-mono">₹5,500</span>
          </div>
          {showGst && (
            <div className="flex justify-between">
              <span className="text-gray-600">GST (18%)</span>
              <span className="font-mono">₹990</span>
            </div>
          )}
          <div 
            className="flex justify-between py-1.5 px-2 -mx-2 mt-2"
            style={{ backgroundColor: settings.grand_total_bg, color: settings.grand_total_text }}
          >
            <span className="font-semibold">Grand Total</span>
            <span className="font-mono font-bold">₹6,490</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Render individual footer-type sections
  const renderBankDetails = () => {
    if (!settings.bank_name) return null;
    return (
      <div key="bank_details" className={`${footerPaddingClass}`} style={{ backgroundColor: settings.primary_color, color: settings.header_text_color }}>
        <p className="text-[10px] font-semibold uppercase opacity-70 mb-1">Bank Details</p>
        <p className="text-xs">{settings.bank_name}</p>
        {settings.bank_account_no && <p className="text-[10px] opacity-80">A/C: {settings.bank_account_no}</p>}
        {settings.bank_ifsc && <p className="text-[10px] opacity-80">IFSC: {settings.bank_ifsc}</p>}
        {settings.bank_branch && <p className="text-[10px] opacity-80">Branch: {settings.bank_branch}</p>}
      </div>
    );
  };

  const renderTerms = () => {
    if (!settings.show_terms || termsArray.length === 0) return null;
    return (
      <div key="terms" className={`${footerPaddingClass}`} style={{ backgroundColor: settings.primary_color, color: settings.header_text_color }}>
        <div className="flex items-center gap-1 mb-1">
          <FileText className="w-2.5 h-2.5 opacity-70" />
          <p className="text-[10px] font-semibold uppercase opacity-70">Terms & Conditions</p>
        </div>
        <ul className="text-[10px] opacity-80 pl-3 space-y-0">
          {termsArray.map((term, idx) => (
            <li key={idx}>{idx + 1}. {term}</li>
          ))}
        </ul>
      </div>
    );
  };

  const renderSignature = () => {
    if (!settings.show_signature) return null;
    return (
      <div key="signature" className={`${footerPaddingClass}`} style={{ backgroundColor: settings.primary_color, color: settings.header_text_color }}>
        <div className="flex justify-end pt-2">
          <div className="text-center w-28">
            <p className="text-[10px] font-medium mb-4">for {companyName}</p>
            <div className="border-t border-white/30 pt-1 flex items-center justify-center gap-1">
              <PenLine className="w-2 h-2 opacity-70" />
              <span className="text-[9px] opacity-70">Authorised Signatory</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render sections in order
  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case "header":
        return renderHeader();
      case "customer_details":
        return null;
      case "items_table":
        return renderItemsTable();
      case "totals":
        return renderTotals();
      case "bank_details":
        return renderBankDetails();
      case "terms":
        return renderTerms();
      case "signature":
        return renderSignature();
      default:
        return null;
    }
  };

  return (
    <div className="sticky top-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Live Preview</h3>
        <Badge variant="outline">A4 Size</Badge>
      </div>
      
      <Card className="overflow-hidden shadow-lg">
        <div 
          className="bg-white overflow-y-auto"
          style={{ 
            maxHeight: "70vh",
            fontFamily: settings.font_body,
          }}
        >
          {/* Gold Accent Bar */}
          <div className="h-1.5" style={{ backgroundColor: settings.accent_color }} />

          {/* Render ALL sections in order */}
          {sectionOrder.map(sectionId => renderSection(sectionId))}

          {/* Bottom Accent Bar */}
          <div className="h-1.5" style={{ backgroundColor: settings.accent_color }} />
        </div>
      </Card>
    </div>
  );
}