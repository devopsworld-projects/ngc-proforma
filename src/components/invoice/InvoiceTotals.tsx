import { InvoiceTotals as InvoiceTotalsType, InvoiceItem } from "@/types/invoice";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, calculateGstBreakup, roundToTwo } from "@/lib/invoice-utils";

interface InvoiceTotalsProps {
  totals: InvoiceTotalsType;
  totalQuantity: number;
  amountInWords: string;
  items?: InvoiceItem[];
}

export function InvoiceTotals({
  totals,
  totalQuantity,
  amountInWords,
  items = []
}: InvoiceTotalsProps) {
  // Calculate totals from per-item GST reverse calculation
  const calculateTotalsFromItems = () => {
    let totalBasePrice = 0;
    let totalGstAmount = 0;
    let totalInclusive = 0;

    items.forEach(item => {
      const gstPercent = item.gstPercent ?? 18;
      const inclusiveUnitPrice = item.rate;
      const { basePrice: baseUnitPrice, gstAmount: gstPerUnit } = calculateGstBreakup(inclusiveUnitPrice, gstPercent);
      
      totalBasePrice += baseUnitPrice * item.quantity;
      totalGstAmount += gstPerUnit * item.quantity;
      totalInclusive += item.quantity * inclusiveUnitPrice;
    });

    return {
      basePrice: roundToTwo(totalBasePrice),
      gstAmount: roundToTwo(totalGstAmount),
      inclusive: roundToTwo(totalInclusive)
    };
  };

  // Use per-item calculation if items are provided, otherwise fall back to totals.taxAmount
  const itemTotals = items.length > 0 ? calculateTotalsFromItems() : null;
  return <div className="px-3 py-3 bg-white">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Amount in Words */}
        <div className="flex-1 p-3 bg-gray-50 border border-gray-200">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
            Amount Chargeable (in words)
          </p>
          <p className="text-sm font-semibold text-black font-mono">
            {amountInWords}
          </p>
          
        </div>

        {/* Totals Summary */}
        <div className="lg:w-80 space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-600">Subtotal ({totalQuantity} items)</span>
            <span className="font-medium text-black font-mono">{formatCurrency(totals.subtotal)}</span>
          </div>
          
          {totals.discount > 0 && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-600">
                Discount @ {totals.discountPercent}%
              </span>
              <span className="font-medium text-green-600 font-mono">
                - {formatCurrency(totals.discount)}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-600">Total GST (included per item)</span>
            <span className="font-medium text-black font-mono">
              {formatCurrency(itemTotals ? itemTotals.gstAmount : totals.taxAmount)}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-600">Round Off</span>
            <span className="font-medium text-black font-mono">{formatCurrency(totals.roundOff)}</span>
          </div>

          <Separator className="my-1.5" />

          <div className="bg-[hsl(222,47%,15%)] text-white -mx-2 px-3 py-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-heading font-semibold">Grand Total</span>
              <span className="text-lg font-bold font-mono">
                ₹{totals.grandTotal.toLocaleString('en-IN', {
                minimumFractionDigits: 2
              })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>;
}