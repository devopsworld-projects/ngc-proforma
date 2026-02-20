import { PdfTemplateSettings } from "@/hooks/usePdfTemplateSettings";

interface Props {
  settings: Partial<PdfTemplateSettings>;
}

export function PdfPreviewMini({ settings }: Props) {
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
              <div className="font-bold text-[10px] text-black">
                COMPANY NAME
              </div>
              {settings.show_gstin_header !== false && (
                <div className="text-[6px] text-black/60">GSTIN: 29XXXXX...</div>
              )}
            </div>
          </div>
          {settings.show_contact_header !== false && (
            <div className="text-right text-[6px] text-black/70">
              <div>Phone: +91 98765 43210</div>
              <div>email@company.com</div>
            </div>
          )}
        </div>
      </div>

      {/* Two Column Details */}
      <div className="px-3 py-2 grid grid-cols-2 gap-4 text-[6px] border-b">
        {/* Invoice Details */}
        <div>
          <div className="font-bold text-[7px] text-black mb-1">Invoice Details</div>
          <div className="space-y-0.5 text-black">
            <div className="flex gap-2">
              <span className="text-black/60">Invoice No:</span>
              <span className="font-medium">INV-001</span>
            </div>
            <div className="flex gap-2">
              <span className="text-black/60">Date:</span>
              <span className="font-medium">29 Jan 2026</span>
            </div>
          </div>
        </div>
        
        {/* Bill To */}
        <div>
          <div className="font-bold text-[7px] text-black mb-1">Bill To</div>
          <div className="text-black">
            <div className="font-medium">Customer Name</div>
            <div className="text-black/60">123 Street, City</div>
            <div className="text-black/60">State 123456</div>
            <div className="text-[5px] mt-0.5">GSTIN: 29AXXXX1234X1ZX</div>
            <div className="text-[5px] text-black/60">State: Karnataka (29)</div>
          </div>
        </div>
      </div>

      {/* Simple Table */}
      <div className="px-3 py-2">
        <table className="w-full text-[5px] border-collapse text-black">
          <thead>
            <tr className="border-y border-black/20">
              <th className="py-1 text-left font-bold">#</th>
              <th className="py-1 text-left font-bold">Brand</th>
              <th className="py-1 text-left font-bold">Description</th>
              <th className="py-1 text-center font-bold">Qty</th>
              <th className="py-1 text-right font-bold">Unit Price</th>
              <th className="py-1 text-center font-bold">Image</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3].map((i) => (
              <tr key={i} className="border-b border-black/10">
                <td className="py-1">{i}</td>
                <td className="py-1">Brand {i}</td>
                <td className="py-1">Product Item {i}</td>
                <td className="py-1 text-center">{i} Nos</td>
                <td className="py-1 text-right">₹1,000</td>
                <td className="py-1 text-center">-</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals - Right aligned */}
      <div className="px-3 flex justify-between text-black">
        {/* Amount in Words */}
        {settings.show_amount_words !== false && (
          <div className="flex-1">
            <div className="text-[6px] font-bold">Amount in Words:</div>
            <div className="text-[6px] italic text-black/60">INR Five Thousand Seven Hundred Only</div>
          </div>
        )}
        
        {/* Totals */}
        <div className="text-[6px] space-y-0.5 border-t border-black/20 pt-1">
          <div className="flex justify-between gap-4">
            <span className="text-black/60">Subtotal:</span>
            <span>₹5,000</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-black/60">GST (18%):</span>
            <span>₹900</span>
          </div>
          <div className="flex justify-between gap-4 border-t border-black/20 pt-0.5 font-bold">
            <span>GRAND TOTAL:</span>
            <span>₹5,900</span>
          </div>
        </div>
      </div>

      {/* Bank Details */}
      {settings.bank_name && (
        <div className="px-3 py-1 border-t border-black/20 mt-1 text-black">
          <span className="text-[6px] font-bold">Bank: </span>
          <span className="text-[6px] text-black/60">
            {settings.bank_name} | A/C: {settings.bank_account_no || "XXXXXX"}
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="px-3 pt-1 mt-auto border-t border-black/20 text-black">
        <div className="flex justify-between items-end">
          {settings.show_terms !== false && (
            <div>
              <div className="text-[5px] font-bold">Terms & Conditions:</div>
              <div className="text-[4px] text-black/60">
                1. {settings.terms_line1 || "Goods once sold..."}
              </div>
            </div>
          )}
          
          {settings.show_signature !== false && (
            <div className="text-center">
              <div className="text-[5px] font-medium mb-1">For Company Name</div>
              <div className="w-12 border-t border-black/40 mx-auto" />
              <div className="text-[4px] text-black/60 mt-0.5">Authorized Signatory</div>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
