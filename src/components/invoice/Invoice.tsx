import { InvoiceData } from "@/types/invoice";
import { InvoiceHeader } from "./InvoiceHeader";
import { InvoiceTable } from "./InvoiceTable";
import { InvoiceTotals } from "./InvoiceTotals";
import { InvoiceFooter } from "./InvoiceFooter";

interface InvoiceProps {
  data: InvoiceData;
  containerId?: string;
}

export function Invoice({ data, containerId = "invoice-container" }: InvoiceProps) {
  return (
    <div id={containerId} className="invoice-container animate-fade-in">
      {/* Page break indicator - shows where page 2 would start */}
      <div className="invoice-page-indicator no-print" aria-hidden="true" />
      
      {/* Gold Accent Bar */}
      <div className="invoice-accent-bar" />
      
      {/* Header with Org Details + Customer/Invoice Info */}
      <InvoiceHeader
        company={data.company}
        invoiceNo={data.invoiceNo}
        date={data.date}
        eWayBillNo={data.eWayBillNo}
        supplierInvoiceNo={data.supplierInvoiceNo}
        supplierInvoiceDate={data.supplierInvoiceDate}
        otherReferences={data.otherReferences}
        customer={{
          name: data.supplier.name,
          address: data.supplier.address,
          gstin: data.supplier.gstin,
          state: data.supplier.state,
          stateCode: data.supplier.stateCode,
          email: data.supplier.email,
          phone: data.supplier.phone,
        }}
      />

      {/* Items Table */}
      <InvoiceTable items={data.items} />

      {/* Divider */}
      <div className="border-t border-dashed border-gray-300" />

      {/* Totals */}
      <InvoiceTotals
        totals={data.totals}
        totalQuantity={data.totalQuantity}
        amountInWords={data.amountInWords}
        items={data.items}
        taxType={data.taxType}
      />

      {/* Footer - Terms, Bank Details, Signature */}
      <InvoiceFooter company={data.company} />

      {/* Bottom Gold Accent */}
      <div className="invoice-accent-bar" />
    </div>
  );
}
