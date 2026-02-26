import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { useInvoices } from "@/hooks/useInvoices";
import { useCustomers } from "@/hooks/useCustomers";
import { useProducts } from "@/hooks/useProducts";
import {
  exportInvoicesToExcel,
  exportCustomersToExcel,
  exportProductsToExcel,
  exportInvoicesToCSV,
  exportCustomersToCSV,
  exportProductsToCSV,
} from "@/lib/data-export";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ExportType = "invoices" | "customers" | "products";
type ExportFormat = "excel" | "csv";

export function DataExportCard() {
  const [exporting, setExporting] = useState<{ type: ExportType; format: ExportFormat } | null>(null);
  
  const { data: invoices } = useInvoices();
  const { data: customers } = useCustomers();
  const { data: products } = useProducts();

  const handleExport = async (type: ExportType, format: ExportFormat) => {
    setExporting({ type, format });
    
    try {
      switch (type) {
        case "invoices":
          if (!invoices || invoices.length === 0) {
            toast.error("No quotations to export");
            return;
          }
          const invoiceData = invoices.map((inv: any) => ({
            invoice_no: inv.invoice_no,
            date: inv.date,
            customer_name: inv.customers?.name || "N/A",
            subtotal: inv.subtotal,
            tax_amount: inv.tax_amount || 0,
            grand_total: inv.grand_total,
            status: inv.status,
            created_at: inv.created_at,
          }));
          if (format === "excel") {
            await exportInvoicesToExcel(invoiceData);
          } else {
            exportInvoicesToCSV(invoiceData);
          }
          toast.success(`Exported ${invoices.length} quotations to ${format.toUpperCase()}`);
          break;

        case "customers":
          if (!customers || customers.length === 0) {
            toast.error("No customers to export");
            return;
          }
          if (format === "excel") {
            await exportCustomersToExcel(customers);
          } else {
            exportCustomersToCSV(customers);
          }
          toast.success(`Exported ${customers.length} customers to ${format.toUpperCase()}`);
          break;

        case "products":
          if (!products || products.length === 0) {
            toast.error("No products to export");
            return;
          }
          const productData = products.map(prod => ({
            name: prod.name,
            sku: prod.sku,
            description: prod.description,
            category: prod.category,
            hsn_code: prod.hsn_code,
            unit: prod.unit,
            rate: prod.rate,
            purchase_price: null,
            stock_quantity: prod.stock_quantity,
          }));
          if (format === "excel") {
            await exportProductsToExcel(productData);
          } else {
            exportProductsToCSV(productData);
          }
          toast.success(`Exported ${products.length} products to ${format.toUpperCase()}`);
          break;
      }
    } catch (error: any) {
      console.error("Export error:", error);
      toast.error(error.message || "Failed to export data");
    } finally {
      setExporting(null);
    }
  };

  const ExportButton = ({ type, label, count }: { type: ExportType; label: string; count: number }) => {
    const isExporting = exporting?.type === type;
    
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 justify-start" disabled={isExporting || count === 0}>
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span className="flex-1 text-left">{label}</span>
            <span className="text-xs text-muted-foreground">({count})</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleExport(type, "excel")} className="gap-2">
            <FileSpreadsheet className="h-4 w-4 text-green-600" />
            Export as Excel (.xlsx)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport(type, "csv")} className="gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            Export as CSV (.csv)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Download className="h-5 w-5" />
          Data Export
        </CardTitle>
        <CardDescription>
          Download your data as Excel or CSV files for backup or analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <ExportButton type="invoices" label="Quotations" count={invoices?.length || 0} />
        <ExportButton type="customers" label="Customers" count={customers?.length || 0} />
        <ExportButton type="products" label="Products" count={products?.length || 0} />
      </CardContent>
    </Card>
  );
}
