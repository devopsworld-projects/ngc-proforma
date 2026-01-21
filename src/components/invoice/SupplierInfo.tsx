import { SupplierInfo as SupplierInfoType } from "@/types/invoice";
import { Truck } from "lucide-react";

interface SupplierInfoProps {
  supplier: SupplierInfoType;
}

export function SupplierInfo({ supplier }: SupplierInfoProps) {
  return (
    <div className="p-6 bg-invoice-subtle border-b border-invoice-border">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Truck className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-invoice-muted">
              Supplier (Bill From)
            </h3>
          </div>
          <h4 className="text-lg font-serif font-semibold text-foreground mb-2">
            {supplier.name}
          </h4>
          <p className="text-sm text-muted-foreground mb-3 max-w-2xl">
            {supplier.address}
          </p>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="bg-card px-3 py-1.5 rounded-md border border-invoice-border">
              <span className="text-invoice-muted">GSTIN: </span>
              <span className="font-semibold text-foreground">{supplier.gstin}</span>
            </div>
            <div className="bg-card px-3 py-1.5 rounded-md border border-invoice-border">
              <span className="text-invoice-muted">State: </span>
              <span className="font-semibold text-foreground">{supplier.state}, Code: {supplier.stateCode}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
