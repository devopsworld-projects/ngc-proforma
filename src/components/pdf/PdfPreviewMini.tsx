import { PdfTemplateSettings, defaultPdfTemplateSettings } from "@/hooks/usePdfTemplateSettings";

interface Props {
  settings: Partial<PdfTemplateSettings>;
}

export function PdfPreviewMini({ settings }: Props) {
  const s = { ...defaultPdfTemplateSettings, ...settings };

  return (
    <div className="w-full aspect-[210/297] rounded-lg overflow-hidden bg-white shadow-sm text-xs">
      {/* Top Accent Bar */}
      <div 
        className="h-1" 
        style={{ backgroundColor: s.accent_color }}
      />

      {/* Header */}
      <div 
        className="px-3 py-2"
        style={{ 
          backgroundColor: s.primary_color, 
          color: s.header_text_color 
        }}
      >
        <div 
          className={`flex items-center gap-2 mb-1 ${
            s.header_layout === 'centered' ? 'justify-center' : 'justify-start'
          }`}
        >
          {s.show_logo && (
            <div 
              className="w-5 h-5 rounded flex items-center justify-center text-[5px]"
              style={{ backgroundColor: s.accent_color, color: s.primary_color }}
            >
              LOGO
            </div>
          )}
          <div 
            className={`font-bold text-[9px] ${s.header_layout === 'centered' ? 'text-center' : ''}`}
            style={{ fontFamily: s.font_heading }}
          >
            COMPANY NAME
          </div>
        </div>
        
        {s.show_contact_header && (
          <div 
            className={`text-[5px] opacity-80 ${
              s.header_layout === 'centered' ? 'text-center' : ''
            }`}
          >
            Phone: +91 98765 43210 | email@company.com
          </div>
        )}
        
        {s.show_gstin_header && (
          <div 
            className={`text-[5px] opacity-70 mt-0.5 ${
              s.header_layout === 'centered' ? 'text-center' : ''
            }`}
          >
            GSTIN: 29XXXXX...
          </div>
        )}

        {/* Invoice Title */}
        <div 
          className="text-center text-[7px] font-bold mt-1 py-0.5"
          style={{ color: s.accent_color }}
        >
          {s.invoice_title}
        </div>

        {/* Two Column Details */}
        <div className="grid grid-cols-2 gap-2 mt-1 pt-1 border-t border-white/20 text-[5px]">
          <div>
            <div className="font-bold opacity-60 text-[4px] uppercase">{s.bill_to_label}</div>
            <div className="font-medium">Customer Name</div>
            <div className="opacity-80">123 Street, City</div>
            {s.show_customer_phone && <div className="opacity-80">Ph: +91 98765 43210</div>}
            {s.show_customer_email && <div className="opacity-80">email@customer.com</div>}
          </div>
          <div className="text-right">
            <div className="font-bold opacity-60 text-[4px] uppercase">{s.invoice_details_label}</div>
            <div>Proforma No: <span className="font-medium">INV-001</span></div>
            <div>Date: <span className="font-medium">29 Jan 2026</span></div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="px-2 py-1">
        <table className="w-full text-[5px] border-collapse">
          <thead>
            <tr 
              style={{ 
                backgroundColor: s.table_header_bg, 
                color: s.table_header_text 
              }}
            >
              <th className="py-0.5 text-left font-bold px-1">#</th>
              {s.show_brand_column && <th className="py-0.5 text-left font-bold">Brand</th>}
              <th className="py-0.5 text-left font-bold">Description</th>
              <th className="py-0.5 text-center font-bold">Qty</th>
              {s.show_unit_column && <th className="py-0.5 text-center font-bold">Unit</th>}
              <th className="py-0.5 text-right font-bold px-1">Price</th>
            </tr>
          </thead>
          <tbody style={{ color: s.table_text_color }}>
            {[1, 2, 3].map((i) => (
              <tr key={i} className="border-b border-black/10">
                <td className="py-0.5 px-1">{i}</td>
                {s.show_brand_column && <td className="py-0.5">Brand {i}</td>}
                <td className="py-0.5">Product Item {i}</td>
                <td className="py-0.5 text-center" style={{ fontFamily: s.font_mono }}>{i}</td>
                {s.show_unit_column && <td className="py-0.5 text-center">NOS</td>}
                <td className="py-0.5 text-right px-1" style={{ fontFamily: s.font_mono }}>₹1,000</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="px-2 flex justify-between text-[5px]" style={{ color: s.table_text_color }}>
        {s.show_amount_words && (
          <div className="flex-1 pr-2">
            <div className="font-bold">Amount in Words:</div>
            <div className="italic opacity-60">INR Five Thousand...</div>
          </div>
        )}
        
        <div className="space-y-0.5 border-t border-black/20 pt-1">
          <div className="flex justify-between gap-3">
            <span className="opacity-60">Subtotal:</span>
            <span style={{ fontFamily: s.font_mono }}>₹5,000</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="opacity-60">GST (18%):</span>
            <span style={{ fontFamily: s.font_mono }}>₹900</span>
          </div>
          <div 
            className="flex justify-between gap-3 px-1 py-0.5 -mx-1 font-bold"
            style={{ 
              backgroundColor: s.grand_total_bg, 
              color: s.grand_total_text 
            }}
          >
            <span>GRAND TOTAL:</span>
            <span style={{ fontFamily: s.font_mono }}>₹5,900</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div 
        className="px-2 py-1 mt-1 text-[4px]"
        style={{ 
          backgroundColor: s.primary_color, 
          color: s.header_text_color 
        }}
      >
        <div className="flex justify-between items-end">
          {s.show_terms && (
            <div className="opacity-80">
              <div className="font-bold text-[5px]">Terms & Conditions:</div>
              <div>1. {s.terms_line1 || "Goods once sold..."}</div>
            </div>
          )}
          
          {s.show_signature && (
            <div className="text-center">
              <div className="text-[4px] font-medium mb-2">For Company Name</div>
              <div 
                className="w-10 border-t mx-auto" 
                style={{ borderColor: `${s.header_text_color}40` }}
              />
              <div className="text-[3px] opacity-60 mt-0.5">Authorized Signatory</div>
            </div>
          )}
        </div>
        
        {s.custom_footer_text && (
          <div className="text-[3px] opacity-50 italic text-center mt-1">
            {s.custom_footer_text}
          </div>
        )}
      </div>

      {/* Bottom Accent Bar */}
      <div 
        className="h-1" 
        style={{ backgroundColor: s.accent_color }}
      />
    </div>
  );
}
