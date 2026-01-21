import { InvoiceTotals as InvoiceTotalsType } from "@/types/invoice";
import { Separator } from "@/components/ui/separator";

interface InvoiceTotalsProps {
  totals: InvoiceTotalsType;
  totalQuantity: number;
  amountInWords: string;
}

export function InvoiceTotals({ totals, totalQuantity, amountInWords }: InvoiceTotalsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Amount in Words */}
        <div className="flex-1 p-4 bg-invoice-subtle rounded-lg border border-invoice-border">
          <p className="text-xs font-semibold uppercase tracking-wider text-invoice-muted mb-2">
            Amount Chargeable (in words)
          </p>
          <p className="text-lg font-serif font-semibold text-foreground">
            {amountInWords}
          </p>
          <p className="text-xs text-invoice-muted mt-2">E. & O.E</p>
        </div>

        {/* Totals Summary */}
        <div className="lg:w-96 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Subtotal ({totalQuantity} items)</span>
            <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">
              Discount Received @ {totals.discountPercent}%
            </span>
            <span className="font-medium text-invoice-success">
              - {formatCurrency(totals.discount)}
            </span>
          </div>

          <Separator className="my-3" />

          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">IGST @ {totals.taxRate}%</span>
            <span className="font-medium">{formatCurrency(totals.taxAmount)}</span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Round Off</span>
            <span className="font-medium">{formatCurrency(totals.roundOff)}</span>
          </div>

          <Separator className="my-3" />

          <div className="invoice-total-row -mx-4 px-4 py-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-serif font-semibold">Grand Total</span>
              <span className="text-2xl font-serif font-bold">
                ₹{totals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
