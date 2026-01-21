import { SupplierInfo } from "@/types/invoice";
import { PenLine } from "lucide-react";

interface InvoiceFooterProps {
  supplier: SupplierInfo;
}

export function InvoiceFooter({ supplier }: InvoiceFooterProps) {
  return (
    <div className="p-6 bg-invoice-subtle border-t border-invoice-border">
      <div className="flex flex-col lg:flex-row justify-between gap-6">
        {/* Company GSTIN */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-invoice-muted">
            Company's GSTIN/UIN
          </p>
          <p className="font-mono text-sm font-semibold text-foreground">
            {supplier.gstin}
          </p>
        </div>

        {/* Signature Section */}
        <div className="lg:w-64 text-center">
          <p className="text-sm font-semibold text-foreground mb-8">
            for {supplier.name}
          </p>
          <div className="border-t-2 border-primary pt-3 flex items-center justify-center gap-2">
            <PenLine className="w-4 h-4 text-invoice-muted" />
            <span className="text-sm font-medium text-muted-foreground">
              Authorised Signatory
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
