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
    terms_line1: string | null;
    terms_line2: string | null;
    terms_line3: string | null;
    bank_name: string | null;
    bank_account_no: string | null;
    bank_ifsc: string | null;
    bank_branch: string | null;
    font_heading: string;
    font_body: string;
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
  ].filter(Boolean) as string[];

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

          {/* Header */}
          <div 
            className="px-4 py-3 text-center space-y-2"
            style={{ 
              backgroundColor: settings.primary_color,
              color: settings.header_text_color,
              fontFamily: settings.font_heading,
            }}
          >
            {settings.show_logo && (
              <div className="flex justify-center">
                {companyLogo ? (
                  <img src={companyLogo} alt="Logo" className="w-10 h-10 rounded-lg object-contain" />
                ) : (
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: settings.accent_color }}>
                    <Building2 className="w-5 h-5" style={{ color: settings.primary_color }} />
                  </div>
                )}
              </div>
            )}

            <h1 className="text-base font-bold">{companyName}</h1>
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
                <span className="px-2 py-0.5 rounded" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                  GSTIN: 29ABCDE1234F1ZH
                </span>
                {settings.show_company_state && (
                  <span className="px-2 py-0.5 rounded" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                    State: Karnataka (29)
                  </span>
                )}
              </div>
            )}

            {/* Invoice Title */}
            <div className="pt-2 border-t border-white/20">
              <h2 className="text-sm font-bold" style={{ color: settings.accent_color }}>
                {settings.invoice_title}
              </h2>
            </div>

            {/* Bill To & Invoice Details */}
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

          {/* Table */}
          <div className="px-3 py-2">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ backgroundColor: settings.table_header_bg, color: settings.table_header_text }}>
                  <th className="py-1.5 px-2 text-left font-semibold uppercase text-[10px]">Sl</th>
                  {settings.show_image_column && <th className="py-1.5 px-2 text-left font-semibold uppercase text-[10px]">Img</th>}
                  <th className="py-1.5 px-2 text-left font-semibold uppercase text-[10px]">Product</th>
                  <th className="py-1.5 px-2 text-center font-semibold uppercase text-[10px]">Qty</th>
                  <th className="py-1.5 px-2 text-right font-semibold uppercase text-[10px]">Rate</th>
                  <th className="py-1.5 px-2 text-right font-semibold uppercase text-[10px]">Total</th>
                </tr>
              </thead>
              <tbody style={{ color: settings.table_text_color }}>
                {sampleItems.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="py-1.5 px-2">{item.slNo}</td>
                    {settings.show_image_column && (
                      <td className="py-1.5 px-2">
                        <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                          <ImageIcon className="w-3 h-3 text-gray-400" />
                        </div>
                      </td>
                    )}
                    <td className="py-1.5 px-2">
                      <p className="font-medium">{item.brand}</p>
                      <p className="text-[10px] opacity-70">{item.description}</p>
                    </td>
                    <td className="py-1.5 px-2 text-center">{item.quantity}</td>
                    <td className="py-1.5 px-2 text-right font-mono">₹{item.rate.toLocaleString()}</td>
                    <td className="py-1.5 px-2 text-right font-mono font-medium">₹{item.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="px-3 py-2 bg-white">
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
                <div className="flex justify-between">
                  <span className="text-gray-600">GST (18%)</span>
                  <span className="font-mono">₹990</span>
                </div>
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

          {/* Footer */}
          <div 
            className="px-3 py-2 space-y-2"
            style={{ backgroundColor: settings.primary_color, color: settings.header_text_color }}
          >
            {settings.show_terms && termsArray.length > 0 && (
              <div>
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
            )}

            {settings.bank_name && (
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <Building2 className="w-2.5 h-2.5 opacity-70" />
                  <p className="text-[10px] font-semibold uppercase opacity-70">Bank Details</p>
                </div>
                <div className="text-[10px] opacity-80 pl-3">
                  {settings.bank_branch && <p>Name: {settings.bank_branch}</p>}
                  <p>Bank: {settings.bank_name}</p>
                  {settings.bank_account_no && <p>A/C: {settings.bank_account_no}</p>}
                  {settings.bank_ifsc && <p>IFSC: {settings.bank_ifsc}</p>}
                </div>
              </div>
            )}

            {settings.show_signature && (
              <div className="flex justify-end pt-2">
                <div className="text-center w-28">
                  <p className="text-[10px] font-medium mb-4">for {companyName}</p>
                  <div className="border-t border-white/30 pt-1 flex items-center justify-center gap-1">
                    <PenLine className="w-2 h-2 opacity-70" />
                    <span className="text-[9px] opacity-70">Authorised Signatory</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Accent Bar */}
          <div className="h-1.5" style={{ backgroundColor: settings.accent_color }} />
        </div>
      </Card>
    </div>
  );
}
