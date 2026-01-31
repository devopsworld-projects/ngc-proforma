import { InvoiceTotals as InvoiceTotalsType } from "@/types/invoice";
import { Separator } from "@/components/ui/separator";
interface InvoiceTotalsProps {
  totals: InvoiceTotalsType;
  totalQuantity: number;
  amountInWords: string;
}
export function InvoiceTotals({
  totals,
  totalQuantity,
  amountInWords
}: InvoiceTotalsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };
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
          
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-600">
              Discount @ {totals.discountPercent}%
            </span>
            <span className="font-medium text-green-600 font-mono">
              - {formatCurrency(totals.discount)}
            </span>
          </div>

          <Separator className="my-1.5" />

          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-600">IGST @ {totals.taxRate}%</span>
            <span className="font-medium text-black font-mono">{formatCurrency(totals.taxAmount)}</span>
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