import { PdfTemplateSettings } from "@/hooks/usePdfTemplateSettings";

interface Props {
  settings: Partial<PdfTemplateSettings>;
}

export function PdfPreviewMini({ settings }: Props) {
  const primaryColor = settings.primary_color || "#294172";
  const tableTextColor = settings.table_text_color || "#000000";

  return (
    <div className="w-full aspect-[210/297] border rounded-lg overflow-hidden bg-white shadow-sm text-xs">
      {/* Simple White Header */}
      <div className="px-3 py-2 border-b">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            {settings.show_logo !== false && (
              <div className="w-6 h-6 rounded border flex items-center justify-center bg-slate-50">
                <span className="text-[6px] text-slate-400">LOGO</span>
              </div>
            )}
            <div>
              <div className="font-bold text-[10px]" style={{ color: primaryColor }}>
                COMPANY NAME
              </div>
              {settings.show_gstin_header !== false && (
                <div className="text-[6px] text-slate-400">GSTIN: 29XXXXX...</div>
              )}
            </div>
          </div>
          {settings.show_contact_header !== false && (
            <div className="text-right text-[6px] text-slate-500">
              <div>Phone: +91 98765 43210</div>
              <div>email@company.com</div>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Title */}
      <div className="px-3 py-1.5">
        <div className="text-center font-bold text-[9px]" style={{ color: primaryColor }}>
          TAX INVOICE
        </div>
      </div>

      {/* Two Column Details */}
      <div className="px-3 grid grid-cols-2 gap-4 text-[6px]">
        {/* Invoice Details */}
        <div>
          <div className="font-bold text-[7px] text-slate-700 mb-1">Invoice Details</div>
          <div className="space-y-0.5">
            <div className="flex gap-2">
              <span className="text-slate-400">Invoice No:</span>
              <span className="font-medium">INV-001</span>
            </div>
            <div className="flex gap-2">
              <span className="text-slate-400">Date:</span>
              <span className="font-medium">29 Jan 2026</span>
            </div>
          </div>
        </div>
        
        {/* Bill To */}
        <div>
          <div className="font-bold text-[7px] text-slate-700 mb-1">Bill To</div>
          <div className="font-medium">Customer Name</div>
          <div className="text-slate-400">123 Street, City</div>
          <div className="text-slate-400">State 123456</div>
        </div>
      </div>

      {/* Simple Table */}
      <div className="px-3 py-2">
        <table className="w-full text-[5px] border-collapse">
          <thead>
            <tr className="border-y">
              <th className="py-1 text-left font-bold">#</th>
              <th className="py-1 text-left font-bold">Description</th>
              <th className="py-1 text-center font-bold">Qty</th>
              <th className="py-1 text-right font-bold">Rate</th>
              {settings.show_discount_column !== false && (
                <th className="py-1 text-center font-bold">Disc</th>
              )}
              <th className="py-1 text-right font-bold">Amount</th>
            </tr>
          </thead>
          <tbody style={{ color: tableTextColor }}>
            {[1, 2, 3].map((i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="py-1">{i}</td>
                <td className="py-1">
                  Product Item {i}
                  {settings.show_serial_numbers !== false && (
                    <span className="text-slate-400"> S/N: XXX</span>
                  )}
                </td>
                <td className="py-1 text-center">{i}</td>
                <td className="py-1 text-right">₹1,000</td>
                {settings.show_discount_column !== false && (
                  <td className="py-1 text-center">5%</td>
                )}
                <td className="py-1 text-right font-medium">₹{(1000 * i * 0.95).toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals - Right aligned */}
      <div className="px-3 flex justify-between">
        {/* Amount in Words */}
        {settings.show_amount_words !== false && (
          <div className="flex-1">
            <div className="text-[6px] font-bold text-slate-700">Amount in Words:</div>
            <div className="text-[6px] italic text-slate-400">INR Five Thousand Seven Hundred Only</div>
          </div>
        )}
        
        {/* Totals */}
        <div className="text-[6px] space-y-0.5 border-t pt-1">
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Subtotal:</span>
            <span>₹5,000</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">GST (18%):</span>
            <span>₹900</span>
          </div>
          <div className="flex justify-between gap-4 border-t pt-0.5 font-bold" style={{ color: primaryColor }}>
            <span>GRAND TOTAL:</span>
            <span>₹5,900</span>
          </div>
        </div>
      </div>

      {/* Bank Details */}
      {settings.bank_name && (
        <div className="px-3 py-1 border-t mt-1">
          <span className="text-[6px] font-bold text-slate-700">Bank: </span>
          <span className="text-[6px] text-slate-400">
            {settings.bank_name} | A/C: {settings.bank_account_no || "XXXXXX"}
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="px-3 pt-1 mt-auto border-t">
        <div className="flex justify-between items-end">
          {settings.show_terms !== false && (
            <div>
              <div className="text-[5px] font-bold text-slate-700">Terms & Conditions:</div>
              <div className="text-[4px] text-slate-400">
                1. {settings.terms_line1 || "Goods once sold..."}
              </div>
            </div>
          )}
          
          {settings.show_signature !== false && (
            <div className="text-center">
              <div className="text-[5px] font-medium text-slate-600 mb-1">For Company Name</div>
              <div className="w-12 border-t border-slate-400 mx-auto" />
              <div className="text-[4px] text-slate-400 mt-0.5">Authorized Signatory</div>
            </div>
          )}
        </div>
        
        {settings.custom_footer_text && (
          <div className="text-[4px] text-slate-400 italic text-center mt-1">
            {settings.custom_footer_text}
          </div>
        )}
      </div>
    </div>
  );
}
