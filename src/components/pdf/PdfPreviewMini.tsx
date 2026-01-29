import { PdfTemplateSettings } from "@/hooks/usePdfTemplateSettings";

interface Props {
  settings: Partial<PdfTemplateSettings>;
}

export function PdfPreviewMini({ settings }: Props) {
  const primaryColor = settings.primary_color || "#294172";
  const secondaryColor = settings.secondary_color || "#3b82f6";
  const headerTextColor = settings.header_text_color || "#ffffff";
  const tableTextColor = settings.table_text_color || "#1f2937";

  return (
    <div className="w-full aspect-[210/297] border rounded-lg overflow-hidden bg-white shadow-sm text-xs">
      {/* Compact Header */}
      <div
        className="h-[9%] px-3 py-1.5 flex items-center justify-between"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex items-center gap-1.5">
          {settings.show_logo !== false && (
            <div className="w-5 h-5 rounded bg-white/20 flex items-center justify-center">
              <span className="text-[6px]" style={{ color: headerTextColor }}>LOGO</span>
            </div>
          )}
          <div>
            <div className="font-bold text-[9px]" style={{ color: headerTextColor }}>
              COMPANY NAME
            </div>
            {settings.show_gstin_header !== false && (
              <div className="text-[5px] opacity-70" style={{ color: headerTextColor }}>
                GSTIN: 29XXXXX...
              </div>
            )}
          </div>
        </div>
        {settings.show_contact_header !== false && (
          <div className="text-right text-[5px] opacity-80" style={{ color: headerTextColor }}>
            <div>+91 98765 43210 • email@company.com</div>
            <div className="opacity-70">City, State, 123456</div>
          </div>
        )}
      </div>

      {/* Invoice Title Strip */}
      <div
        className="h-[3%] mx-3 mt-1.5 rounded-sm flex items-center justify-between px-2"
        style={{ backgroundColor: secondaryColor }}
      >
        <span className="font-bold text-[7px] text-white">TAX INVOICE</span>
        <span className="text-[6px] text-white font-medium">INV-001 | 29 Jan 2026</span>
      </div>

      {/* Content */}
      <div className="px-3 py-1.5">
        {/* Two Column Layout */}
        <div className="grid grid-cols-2 gap-1.5 mb-1.5">
          {/* Bill To */}
          <div className="bg-slate-50 rounded overflow-hidden border border-slate-200">
            <div 
              className="text-[5px] font-bold text-white px-1.5 py-0.5"
              style={{ backgroundColor: secondaryColor }}
            >
              BILL TO
            </div>
            <div className="p-1.5">
              <div className="text-[7px] font-semibold text-slate-800">Customer Name</div>
              <div className="text-[5px] text-slate-500">123 Street Address</div>
              <div className="text-[5px] text-slate-500">City, State 123456</div>
              <div className="text-[5px] font-medium mt-0.5" style={{ color: secondaryColor }}>
                GSTIN: 29XXXXX...
              </div>
            </div>
          </div>
          
          {/* Invoice Details */}
          <div className="bg-slate-50 rounded overflow-hidden border border-slate-200">
            <div 
              className="text-[5px] font-bold text-white px-1.5 py-0.5"
              style={{ backgroundColor: secondaryColor }}
            >
              INVOICE DETAILS
            </div>
            <div className="p-1.5 space-y-0.5">
              <div className="flex justify-between text-[5px]">
                <span className="text-slate-500">Invoice No:</span>
                <span className="font-medium text-slate-800">INV-001</span>
              </div>
              <div className="flex justify-between text-[5px]">
                <span className="text-slate-500">Date:</span>
                <span className="font-medium text-slate-800">29 Jan 2026</span>
              </div>
              <div className="flex justify-between text-[5px]">
                <span className="text-slate-500">Reference:</span>
                <span className="font-medium text-slate-800">PO-12345</span>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="border border-slate-200 rounded overflow-hidden mb-1.5">
          <div
            className="grid text-[5px] font-bold text-white py-0.5 px-1"
            style={{
              backgroundColor: primaryColor,
              gridTemplateColumns: settings.show_discount_column !== false 
                ? "0.8fr 3fr 0.8fr 0.8fr 1fr 0.8fr 1.2fr" 
                : "0.8fr 3fr 0.8fr 0.8fr 1fr 1.2fr",
            }}
          >
            <span className="text-center">#</span>
            <span>Description</span>
            <span className="text-center">Qty</span>
            <span className="text-center">Unit</span>
            <span className="text-right">Rate</span>
            {settings.show_discount_column !== false && <span className="text-center">Disc</span>}
            <span className="text-right">Amount</span>
          </div>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="grid text-[5px] py-0.5 px-1 border-t border-slate-100"
              style={{
                backgroundColor: i % 2 === 0 ? "#fcfcfd" : "white",
                gridTemplateColumns: settings.show_discount_column !== false 
                  ? "0.8fr 3fr 0.8fr 0.8fr 1fr 0.8fr 1.2fr" 
                  : "0.8fr 3fr 0.8fr 0.8fr 1fr 1.2fr",
                color: tableTextColor,
              }}
            >
              <span className="text-center">{i}</span>
              <span>
                Product Item {i}
                {settings.show_serial_numbers !== false && (
                  <span className="text-slate-400"> S/N: XXX</span>
                )}
              </span>
              <span className="text-center">{i}</span>
              <span className="text-center">NOS</span>
              <span className="text-right">₹1,000</span>
              {settings.show_discount_column !== false && <span className="text-center">5%</span>}
              <span className="text-right font-medium">₹{(1000 * i * 0.95).toFixed(0)}</span>
            </div>
          ))}
        </div>

        {/* Amount in Words & Totals Row */}
        <div className="flex gap-1.5 mb-1.5">
          {/* Amount in Words */}
          {settings.show_amount_words !== false && (
            <div className="flex-1 bg-slate-50 rounded border border-slate-200 p-1.5">
              <div className="text-[5px] font-bold" style={{ color: secondaryColor }}>
                AMOUNT IN WORDS
              </div>
              <div className="text-[6px] italic text-slate-600 mt-0.5">
                INR Five Thousand Seven Hundred Only
              </div>
            </div>
          )}
          
          {/* Totals Box */}
          <div className="w-24 bg-slate-50 rounded border border-slate-200 overflow-hidden">
            <div className="p-1 space-y-0.5">
              <div className="flex justify-between text-[5px]">
                <span className="text-slate-500">Subtotal:</span>
                <span className="text-slate-800">₹5,000</span>
              </div>
              <div className="flex justify-between text-[5px]">
                <span className="text-slate-500">GST (18%):</span>
                <span className="text-slate-800">₹900</span>
              </div>
            </div>
            <div
              className="flex justify-between text-[6px] font-bold text-white px-1.5 py-1"
              style={{ backgroundColor: primaryColor }}
            >
              <span>GRAND TOTAL</span>
              <span>₹5,900</span>
            </div>
          </div>
        </div>

        {/* Bank Details */}
        {settings.bank_name && (
          <div className="bg-slate-50 rounded border border-slate-200 p-1.5 mb-1.5">
            <div className="text-[5px] font-bold" style={{ color: secondaryColor }}>BANK DETAILS</div>
            <div className="text-[5px] text-slate-700 mt-0.5">
              {settings.bank_name} | A/C: {settings.bank_account_no || "XXXXXX"} | IFSC: {settings.bank_ifsc || "XXXX"}
            </div>
          </div>
        )}

        {/* Footer Section */}
        <div className="border-t border-slate-200 pt-1">
          <div className="flex justify-between items-start">
            {/* Terms */}
            {settings.show_terms !== false && (
              <div className="flex-1">
                <div className="text-[5px] font-bold text-slate-700">Terms & Conditions</div>
                <div className="text-[4px] text-slate-500 space-y-0.5 mt-0.5">
                  <div>1. {settings.terms_line1 || "Goods once sold will not be taken back."}</div>
                  {settings.terms_line2 && <div>2. {settings.terms_line2}</div>}
                </div>
              </div>
            )}
            
            {/* Signature */}
            {settings.show_signature !== false && (
              <div className="text-center ml-4">
                <div className="text-[5px] font-medium text-slate-700 mb-2">For Company Name</div>
                <div className="w-14 border-t border-slate-400" />
                <div className="text-[4px] text-slate-500 mt-0.5">Authorized Signatory</div>
              </div>
            )}
          </div>
          
          {/* Custom Footer */}
          {settings.custom_footer_text && (
            <div className="text-[4px] text-slate-400 italic text-center mt-1">
              {settings.custom_footer_text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
