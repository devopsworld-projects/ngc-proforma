import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, numberToWords } from "@/lib/invoice-utils";
import { Calculator } from "lucide-react";

interface TaxCalculatorProps {
  subtotal: number;
  discountPercent: number;
  taxRate: number;
  onDiscountChange: (value: number) => void;
  onTaxRateChange: (value: number) => void;
}

export interface CalculatedTotals {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  roundOff: number;
  grandTotal: number;
  amountInWords: string;
}

export function TaxCalculator({
  subtotal,
  discountPercent,
  taxRate,
  onDiscountChange,
  onTaxRateChange,
}: TaxCalculatorProps) {
  const totals = useMemo<CalculatedTotals>(() => {
    const discountAmount = (subtotal * discountPercent) / 100;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = (taxableAmount * taxRate) / 100;
    const exactTotal = taxableAmount + taxAmount;
    const grandTotal = Math.round(exactTotal);
    const roundOff = grandTotal - exactTotal;

    return {
      subtotal,
      discountAmount,
      taxableAmount,
      taxAmount,
      roundOff,
      grandTotal,
      amountInWords: numberToWords(grandTotal),
    };
  }, [subtotal, discountPercent, taxRate]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          Tax & Totals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Subtotal */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
        </div>

        {/* Discount */}
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground whitespace-nowrap">Discount</Label>
            <div className="relative w-20">
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={discountPercent || ""}
                onChange={(e) => onDiscountChange(parseFloat(e.target.value) || 0)}
                className="pr-6 text-sm h-8"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
            </div>
          </div>
          {totals.discountAmount > 0 && (
            <span className="font-medium text-invoice-success">- {formatCurrency(totals.discountAmount)}</span>
          )}
        </div>

        <Separator />

        {/* Taxable Amount */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Taxable Amount</span>
          <span className="font-medium">{formatCurrency(totals.taxableAmount)}</span>
        </div>

        {/* Tax Rate */}
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground whitespace-nowrap">IGST</Label>
            <div className="relative w-20">
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={taxRate || ""}
                onChange={(e) => onTaxRateChange(parseFloat(e.target.value) || 0)}
                className="pr-6 text-sm h-8"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
            </div>
          </div>
          <span className="font-medium">{formatCurrency(totals.taxAmount)}</span>
        </div>

        {/* Round Off */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Round Off</span>
          <span className="font-medium">
            {totals.roundOff >= 0 ? "" : "-"}{formatCurrency(Math.abs(totals.roundOff))}
          </span>
        </div>

        <Separator />

        {/* Grand Total */}
        <div className="invoice-total-row -mx-4 px-4 py-3 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-serif font-semibold">Grand Total</span>
            <span className="text-xl font-serif font-bold">
              ₹{totals.grandTotal.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Amount in Words */}
        <div className="bg-invoice-subtle p-3 rounded-lg">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Amount in Words</p>
          <p className="text-sm font-medium">{totals.amountInWords}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function useTaxCalculation(subtotal: number, discountPercent: number, taxRate: number): CalculatedTotals {
  return useMemo(() => {
    const discountAmount = (subtotal * discountPercent) / 100;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = (taxableAmount * taxRate) / 100;
    const exactTotal = taxableAmount + taxAmount;
    const grandTotal = Math.round(exactTotal);
    const roundOff = grandTotal - exactTotal;

    return {
      subtotal,
      discountAmount,
      taxableAmount,
      taxAmount,
      roundOff,
      grandTotal,
      amountInWords: numberToWords(grandTotal),
    };
  }, [subtotal, discountPercent, taxRate]);
}
