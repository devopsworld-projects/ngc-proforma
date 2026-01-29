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
      {/* Header */}
      <div
        className="h-[12%] px-3 py-2 flex items-center justify-between"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex items-center gap-2">
          {settings.show_logo !== false && (
            <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center">
              <span className="text-[8px]" style={{ color: headerTextColor }}>LOGO</span>
            </div>
          )}
          <div>
            <div className="font-bold text-[10px]" style={{ color: headerTextColor }}>
              COMPANY NAME
            </div>
            {settings.show_gstin_header !== false && (
              <div className="text-[6px] opacity-70" style={{ color: headerTextColor }}>
                GSTIN: 29XXXXX...
              </div>
            )}
          </div>
        </div>
        {settings.show_contact_header !== false && (
          <div className="text-right text-[6px] opacity-70" style={{ color: headerTextColor }}>
            <div>+91 98765 43210</div>
            <div>email@company.com</div>
          </div>
        )}
      </div>

      {/* Invoice Title Bar */}
      <div
        className="h-[4%] px-3 flex items-center justify-between"
        style={{ backgroundColor: secondaryColor }}
      >
        <span className="font-bold text-[8px] text-white">TAX INVOICE</span>
        <span className="text-[7px] text-white">#INV-001</span>
      </div>

      {/* Content */}
      <div className="px-3 py-2">
        {/* Billing & Details */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="bg-muted/30 rounded p-1.5">
            <div className="text-[6px] font-bold mb-0.5" style={{ color: secondaryColor }}>BILL TO</div>
            <div className="text-[7px] font-semibold">Customer Name</div>
            <div className="text-[6px] text-muted-foreground">123 Street, City</div>
          </div>
          <div className="bg-muted/30 rounded p-1.5">
            <div className="text-[6px] font-bold mb-0.5" style={{ color: secondaryColor }}>DETAILS</div>
            <div className="text-[6px]">Date: 01 Jan 2024</div>
            <div className="text-[6px]">Due: 15 Jan 2024</div>
          </div>
        </div>

        {/* Table */}
        <div className="border rounded overflow-hidden mb-2">
          <div
            className="grid text-[6px] font-bold text-white py-1 px-1"
            style={{
              backgroundColor: primaryColor,
              gridTemplateColumns: settings.show_discount_column !== false 
                ? "1fr 3fr 1fr 1fr 1fr 1.5fr" 
                : "1fr 3fr 1fr 1fr 1.5fr",
            }}
          >
            <span>#</span>
            <span>Item</span>
            <span>Qty</span>
            <span>Rate</span>
            {settings.show_discount_column !== false && <span>Disc</span>}
            <span>Amount</span>
          </div>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="grid text-[6px] py-1 px-1 border-t"
              style={{
                backgroundColor: i % 2 === 0 ? "#f8f9fa" : "white",
                gridTemplateColumns: settings.show_discount_column !== false 
                  ? "1fr 3fr 1fr 1fr 1fr 1.5fr" 
                  : "1fr 3fr 1fr 1fr 1.5fr",
                color: tableTextColor,
              }}
            >
              <span>{i}</span>
              <span>
                Product Item {i}
                {settings.show_serial_numbers !== false && (
                  <span style={{ opacity: 0.7 }}> (S/N: XXX)</span>
                )}
              </span>
              <span>{i}</span>
              <span>₹1,000</span>
              {settings.show_discount_column !== false && <span>5%</span>}
              <span>₹{(1000 * i * 0.95).toFixed(0)}</span>
            </div>
          ))}
        </div>

        {/* Amount in Words & Totals */}
        <div className="flex justify-between mb-2">
          {settings.show_amount_words !== false && (
            <div className="flex-1 pr-2">
              <div className="text-[6px] font-bold" style={{ color: secondaryColor }}>Amount in Words</div>
              <div className="text-[6px] italic text-muted-foreground">INR Five Thousand...</div>
            </div>
          )}
          <div className="bg-muted/30 rounded p-1.5 w-24">
            <div className="flex justify-between text-[6px]">
              <span>Subtotal</span>
              <span>₹5,000</span>
            </div>
            <div className="flex justify-between text-[6px]">
              <span>Tax (18%)</span>
              <span>₹900</span>
            </div>
            <div
              className="flex justify-between text-[7px] font-bold text-white mt-1 -mx-1.5 -mb-1.5 px-1.5 py-1 rounded-b"
              style={{ backgroundColor: primaryColor }}
            >
              <span>Total</span>
              <span>₹5,900</span>
            </div>
          </div>
        </div>

        {/* Bank Details */}
        {settings.bank_name && (
          <div className="bg-muted/30 rounded p-1.5 mb-2">
            <div className="text-[6px] font-bold" style={{ color: secondaryColor }}>Bank Details</div>
            <div className="text-[6px]">{settings.bank_name} | A/C: {settings.bank_account_no || "XXXXXX"}</div>
          </div>
        )}

        {/* Terms */}
        {settings.show_terms !== false && (
          <div className="mb-2">
            <div className="text-[6px] font-bold">Terms & Conditions</div>
            <div className="text-[5px] text-muted-foreground">
              {settings.terms_line1 || "1. Goods once sold..."}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-end pt-1 border-t">
          {settings.custom_footer_text && (
            <div className="text-[5px] text-muted-foreground italic">
              {settings.custom_footer_text}
            </div>
          )}
          {settings.show_signature !== false && (
            <div className="text-center ml-auto">
              <div className="w-16 border-t border-foreground mb-0.5" />
              <div className="text-[5px] text-muted-foreground">Authorized Sign</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
