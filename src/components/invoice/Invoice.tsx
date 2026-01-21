import { InvoiceData } from "@/types/invoice";
import { InvoiceHeader } from "./InvoiceHeader";
import { SupplierInfo } from "./SupplierInfo";
import { InvoiceTable } from "./InvoiceTable";
import { InvoiceTotals } from "./InvoiceTotals";
import { InvoiceFooter } from "./InvoiceFooter";

interface InvoiceProps {
  data: InvoiceData;
}

export function Invoice({ data }: InvoiceProps) {
  return (
    <div className="invoice-container animate-fade-in">
      {/* Gold Accent Bar */}
      <div className="invoice-accent-bar" />
      
      {/* Header */}
      <InvoiceHeader
        company={data.company}
        invoiceNo={data.invoiceNo}
        date={data.date}
        eWayBillNo={data.eWayBillNo}
        supplierInvoiceNo={data.supplierInvoiceNo}
        supplierInvoiceDate={data.supplierInvoiceDate}
        otherReferences={data.otherReferences}
      />

      {/* Supplier Info */}
      <SupplierInfo supplier={data.supplier} />

      {/* Items Table */}
      <InvoiceTable items={data.items} />

      {/* Divider */}
      <div className="invoice-divider mx-6" />

      {/* Totals */}
      <InvoiceTotals
        totals={data.totals}
        totalQuantity={data.totalQuantity}
        amountInWords={data.amountInWords}
      />

      {/* Footer */}
      <InvoiceFooter supplier={data.supplier} />

      {/* Bottom Gold Accent */}
      <div className="invoice-accent-bar" />
    </div>
  );
}
