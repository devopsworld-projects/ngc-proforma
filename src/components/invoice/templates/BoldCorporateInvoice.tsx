import { InvoiceData } from "@/types/invoice";
import { PdfTemplateSettings, defaultPdfTemplateSettings } from "@/hooks/usePdfTemplateSettings";
import { Building2, Phone, Mail, Globe, PenLine, FileText } from "lucide-react";
import { TemplateInvoiceTable } from "./TemplateInvoiceTable";

interface BoldCorporateInvoiceProps {
  data: InvoiceData;
  settings: PdfTemplateSettings;
  containerId?: string;
}

export function BoldCorporateInvoice({ 
  data, 
  settings, 
  containerId = "invoice-container" 
}: BoldCorporateInvoiceProps) {
  const s = { ...defaultPdfTemplateSettings, ...settings };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Font size scale mapping
  const fontScale = {
    small: { heading: 'text-base', body: 'text-xs', title: 'text-lg' },
    normal: { heading: 'text-lg', body: 'text-sm', title: 'text-xl' },
    large: { heading: 'text-xl', body: 'text-base', title: 'text-2xl' },
  };
  const fonts = fontScale[s.font_size_scale] || fontScale.normal;

  return (
    <div 
      id={containerId} 
      className="invoice-container animate-fade-in"
      style={{ 
        fontFamily: `'${s.font_body}', sans-serif`,
        backgroundColor: '#ffffff'
      }}
    >
      {/* Page break indicator */}
      <div className="invoice-page-indicator no-print" aria-hidden="true" />
      
      {/* Top Accent Bar */}
      <div 
        className="h-2" 
        style={{ backgroundColor: s.accent_color }}
      />
      
      {/* Header */}
      <div 
        className="px-4 py-4"
        style={{ 
          backgroundColor: s.primary_color, 
          color: s.header_text_color 
        }}
      >
        {/* Company Info */}
        <div 
          className={`space-y-2 pb-3 border-b border-white/20 ${
            s.header_layout === 'centered' ? 'text-center' : 
            s.header_layout === 'left_aligned' ? 'text-left' : ''
          }`}
        >
          <div className={`flex ${s.header_layout === 'centered' ? 'justify-center' : 'justify-start'}`}>
            {s.show_logo && data.company.logoUrl ? (
              <img 
                src={data.company.logoUrl} 
                alt={`${data.company.name} logo`} 
                className="w-14 h-14 rounded-lg object-contain" 
              />
            ) : s.show_logo ? (
              <div 
                className="w-14 h-14 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: s.accent_color }}
              >
                <Building2 className="w-7 h-7" style={{ color: s.primary_color }} />
              </div>
            ) : null}
          </div>

          <h1 
            className={`${fonts.title} font-bold tracking-tight`}
            style={{ fontFamily: `'${s.font_heading}', sans-serif` }}
          >
            {data.company.name}
          </h1>

          <div className="text-xs opacity-90">
            {data.company.address.map((line, i) => (
              <span key={i}>
                {line}{i < data.company.address.length - 1 ? ", " : ""}
              </span>
            ))}
          </div>

          {s.show_contact_header && (
            <div className={`flex flex-wrap gap-4 text-xs opacity-80 ${
              s.header_layout === 'centered' ? 'justify-center' : 'justify-start'
            }`}>
              {data.company.phone.length > 0 && (
                <div className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  <span>{data.company.phone.join(", ")}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Mail className="w-3 h-3" />
                <span>{data.company.email}</span>
              </div>
              <div className="flex items-center gap-1">
                <Globe className="w-3 h-3" />
                <span>{data.company.website}</span>
              </div>
            </div>
          )}

          {(s.show_gstin_header || s.show_company_state) && (
            <div className={`flex gap-3 text-xs ${
              s.header_layout === 'centered' ? 'justify-center' : 'justify-start'
            }`}>
              {s.show_gstin_header && (
                <div className="bg-white/10 px-3 py-1 rounded">
                  <span className="opacity-70">GSTIN: </span>
                  <span className="font-semibold">{data.company.gstin}</span>
                </div>
              )}
              {s.show_company_state && (
                <div className="bg-white/10 px-3 py-1 rounded">
                  <span className="opacity-70">State: </span>
                  <span className="font-semibold">
                    {data.company.state}, Code: {data.company.stateCode}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Invoice Title */}
        <div className="text-center py-3">
          <h2 
            className={`${fonts.heading} font-bold`}
            style={{ 
              fontFamily: `'${s.font_heading}', sans-serif`,
              color: s.accent_color 
            }}
          >
            {s.invoice_title}
          </h2>
        </div>

        {/* Customer & Invoice Details Grid */}
        <div className="grid grid-cols-2 gap-6 pt-3 border-t border-white/20">
          {/* Bill To */}
          <div className="space-y-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider opacity-60">
              {s.bill_to_label}
            </h3>
            <div className="space-y-0.5">
              <p className={`${fonts.body} font-semibold`}>{data.supplier.name}</p>
              <p className="text-xs opacity-80">{data.supplier.address}</p>
              {s.show_customer_phone && data.supplier.phone && (
                <p className="text-xs opacity-80">Phone: {data.supplier.phone}</p>
              )}
              {s.show_customer_email && data.supplier.email && (
                <p className="text-xs opacity-80">Email: {data.supplier.email}</p>
              )}
              {data.supplier.gstin && (
                <p className="text-xs">
                  <span className="opacity-60">GSTIN: </span>
                  <span className="font-medium">{data.supplier.gstin}</span>
                </p>
              )}
              {data.supplier.state && (
                <p className="text-xs opacity-80">
                  State: {data.supplier.state}
                  {data.supplier.stateCode && ` (${data.supplier.stateCode})`}
                </p>
              )}
            </div>
          </div>

          {/* Invoice Details */}
          <div className="space-y-1 text-right">
            <h3 className="text-xs font-semibold uppercase tracking-wider opacity-60">
              {s.invoice_details_label}
            </h3>
            <div className="space-y-0.5 text-xs">
              <div className="flex justify-end gap-2">
                <span className="opacity-60">Proforma No:</span>
                <span className={`font-semibold ${fonts.body}`}>{data.invoiceNo}</span>
              </div>
              <div className="flex justify-end gap-2">
                <span className="opacity-60">Date:</span>
                <span className="font-medium">{data.date}</span>
              </div>
              {data.eWayBillNo && (
                <div className="flex justify-end gap-2">
                  <span className="opacity-60">e-Way Bill:</span>
                  <span className="font-medium">{data.eWayBillNo}</span>
                </div>
              )}
              {data.otherReferences && (
                <div className="flex justify-end gap-2">
                  <span className="opacity-60">Reference:</span>
                  <span className="font-medium">{data.otherReferences}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <TemplateInvoiceTable items={data.items} settings={s} />

      {/* Divider */}
      <div className="border-t-2 border-dashed border-gray-300" />

      {/* Totals Section */}
      <div className="px-4 py-4 bg-white">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Amount in Words */}
          {s.show_amount_words && (
            <div className="flex-1 p-3 bg-gray-50 border border-gray-200">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Amount Chargeable (in words)
              </p>
              <p 
                className="text-sm font-semibold text-gray-900"
                style={{ fontFamily: `'${s.font_mono}', monospace` }}
              >
                {data.amountInWords}
              </p>
            </div>
          )}

          {/* Totals */}
          <div className="lg:w-80 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-600">Subtotal ({data.totalQuantity} items)</span>
              <span 
                className="font-medium text-gray-900"
                style={{ fontFamily: `'${s.font_mono}', monospace` }}
              >
                {formatCurrency(data.totals.subtotal)}
              </span>
            </div>
            
            {data.totals.discountPercent > 0 && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600">Discount @ {data.totals.discountPercent}%</span>
                <span 
                  className="font-medium text-green-600"
                  style={{ fontFamily: `'${s.font_mono}', monospace` }}
                >
                  - {formatCurrency(data.totals.discount)}
                </span>
              </div>
            )}

            <div className="border-t border-gray-200 my-1.5" />

            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-600">IGST @ {data.totals.taxRate}%</span>
              <span 
                className="font-medium text-gray-900"
                style={{ fontFamily: `'${s.font_mono}', monospace` }}
              >
                {formatCurrency(data.totals.taxAmount)}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-600">Round Off</span>
              <span 
                className="font-medium text-gray-900"
                style={{ fontFamily: `'${s.font_mono}', monospace` }}
              >
                {formatCurrency(data.totals.roundOff)}
              </span>
            </div>

            <div className="border-t border-gray-200 my-1.5" />

            {/* Grand Total */}
            <div 
              className="-mx-2 px-3 py-2"
              style={{ backgroundColor: s.grand_total_bg }}
            >
              <div className="flex justify-between items-center">
                <span 
                  className="text-sm font-semibold"
                  style={{ 
                    fontFamily: `'${s.font_heading}', sans-serif`,
                    color: s.grand_total_text 
                  }}
                >
                  Grand Total
                </span>
                <span 
                  className="text-lg font-bold"
                  style={{ 
                    fontFamily: `'${s.font_mono}', monospace`,
                    color: s.grand_total_text 
                  }}
                >
                  ₹{data.totals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div 
        className="px-4 py-4 space-y-3"
        style={{ backgroundColor: s.primary_color, color: s.header_text_color }}
      >
        {/* Terms & Conditions */}
        {s.show_terms && (s.terms_line1 || s.terms_line2 || s.terms_line3) && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <FileText className="w-3 h-3 opacity-70" />
              <h4 className="text-xs font-semibold uppercase tracking-wider opacity-70">
                Terms & Conditions
              </h4>
            </div>
            <ul className="text-xs opacity-90 space-y-0 pl-4">
              {s.terms_line1 && <li>1. {s.terms_line1}</li>}
              {s.terms_line2 && <li>2. {s.terms_line2}</li>}
              {s.terms_line3 && <li>3. {s.terms_line3}</li>}
            </ul>
          </div>
        )}

        {/* Bank Details */}
        {s.bank_name && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3 h-3 opacity-70" />
              <h4 className="text-xs font-semibold uppercase tracking-wider opacity-70">
                Bank Details
              </h4>
            </div>
            <div className="text-xs opacity-90 space-y-0 pl-4">
              {s.bank_branch && <p>Name: {s.bank_branch}</p>}
              {s.bank_name && <p>Bank: {s.bank_name}</p>}
              {s.bank_account_no && <p>A/C No: {s.bank_account_no}</p>}
              {s.bank_ifsc && <p>IFSC: {s.bank_ifsc}</p>}
            </div>
          </div>
        )}

        {/* Custom Footer */}
        {s.custom_footer_text && (
          <p className="text-xs text-center opacity-80 pt-2 border-t border-white/20">
            {s.custom_footer_text}
          </p>
        )}

        {/* Signature */}
        {s.show_signature && (
          <div className="flex justify-end pt-2">
            <div className="text-center w-40">
              <p 
                className="text-xs font-semibold mb-6"
                style={{ fontFamily: `'${s.font_heading}', sans-serif` }}
              >
                for {data.company.name}
              </p>
              <div className="border-t border-white/30 pt-1.5 flex items-center justify-center gap-1">
                <PenLine className="w-2.5 h-2.5 opacity-70" />
                <span className="text-xs font-medium opacity-80">
                  Authorised Signatory
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Accent Bar */}
      <div 
        className="h-2" 
        style={{ backgroundColor: s.accent_color }}
      />
    </div>
  );
}
