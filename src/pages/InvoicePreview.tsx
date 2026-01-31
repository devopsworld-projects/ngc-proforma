import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Invoice } from "@/components/invoice/Invoice";
import { useInvoice } from "@/hooks/useInvoices";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { usePdfTemplateSettings } from "@/hooks/usePdfTemplateSettings";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Edit, Printer, Download, Loader2 } from "lucide-react";
import { InvoiceData, CompanyInfo, SupplierInfo, InvoiceItem, InvoiceTotals } from "@/types/invoice";
import { formatDate, numberToWords } from "@/lib/invoice-utils";
import { downloadInvoiceAsPdf } from "@/lib/html-to-pdf";
import { toast } from "sonner";

// Shadow style for screen display only - removed during PDF capture
const SCREEN_SHADOW = "0 25px 50px -12px rgba(30, 42, 74, 0.15)";

export default function InvoicePreview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isDownloading, setIsDownloading] = useState(false);
  const { data: invoice, isLoading: invoiceLoading } = useInvoice(id);
  const { data: companySettings, isLoading: settingsLoading } = useCompanySettings();
  const { data: templateSettings, isLoading: templateLoading } = usePdfTemplateSettings();

  const isLoading = invoiceLoading || settingsLoading || templateLoading;

  const handlePrint = () => {
    window.print();
  };

  // Apply shadow on mount for screen display
  useEffect(() => {
    const container = document.getElementById("invoice-container");
    if (container) {
      container.style.boxShadow = SCREEN_SHADOW;
    }
  }, [invoice]);

  const handleDownloadPdf = async () => {
    if (!invoice) return;
    
    const container = document.getElementById("invoice-container");
    
    setIsDownloading(true);
    try {
      // Remove shadow before capture
      if (container) {
        container.style.boxShadow = "none";
      }
      
      await downloadInvoiceAsPdf(
        "invoice-container",
        `Proforma-${invoice.invoice_no}`
      );
      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error("Failed to download PDF:", error);
      toast.error("Failed to download PDF. Please try again.");
    } finally {
      // Restore shadow after capture
      if (container) {
        container.style.boxShadow = SCREEN_SHADOW;
      }
      setIsDownloading(false);
    }
  };

  // Transform database data to InvoiceData format
  const transformToInvoiceData = (): InvoiceData | null => {
    if (!invoice || !companySettings) return null;

    const company: CompanyInfo = {
      name: companySettings.name || "Your Company",
      address: [
        companySettings.address_line1,
        companySettings.address_line2,
        `${companySettings.city || ""}, ${companySettings.state || ""} ${companySettings.postal_code || ""}`.trim(),
      ].filter(Boolean) as string[],
      phone: companySettings.phone || [],
      gstin: companySettings.gstin || "",
      state: companySettings.state || "",
      stateCode: companySettings.state_code || "",
      email: companySettings.email || "",
      website: companySettings.website || "",
      logoUrl: companySettings.logo_url || undefined,
    };

    const customer = invoice.customers;
    const billingAddress = invoice.billing_address;

    const supplier: SupplierInfo = {
      name: customer?.name || "Customer",
      address: billingAddress
        ? [
            billingAddress.address_line1,
            billingAddress.address_line2,
            `${billingAddress.city}, ${billingAddress.state} ${billingAddress.postal_code}`,
          ]
            .filter(Boolean)
            .join(", ")
        : "",
      gstin: customer?.gstin || "",
      state: customer?.state || billingAddress?.state || "",
      stateCode: customer?.state_code || billingAddress?.state_code || "",
      email: customer?.email || "",
      phone: customer?.phone || "",
    };

    const items: InvoiceItem[] = (invoice.items || []).map((item: any) => ({
      id: item.id,
      slNo: item.sl_no,
      brand: item.brand || "",
      description: item.description,
      serialNumbers: item.serial_numbers || [],
      quantity: Number(item.quantity),
      unit: item.unit,
      rate: Number(item.rate),
      discountPercent: Number(item.discount_percent || 0),
      amount: Number(item.amount),
      productImage: item.product_image || "",
    }));

    const totals: InvoiceTotals = {
      subtotal: Number(invoice.subtotal),
      discount: Number(invoice.discount_amount || 0),
      discountPercent: Number(invoice.discount_percent || 0),
      taxRate: Number(invoice.tax_rate || 18),
      taxAmount: Number(invoice.tax_amount || 0),
      roundOff: Number(invoice.round_off || 0),
      grandTotal: Number(invoice.grand_total),
    };

    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      invoiceNo: invoice.invoice_no,
      date: formatDate(invoice.date),
      eWayBillNo: invoice.e_way_bill_no || undefined,
      supplierInvoiceNo: invoice.supplier_invoice_no || "-",
      supplierInvoiceDate: invoice.supplier_invoice_date
        ? formatDate(invoice.supplier_invoice_date)
        : "-",
      otherReferences: invoice.other_references || undefined,
      company,
      supplier,
      items,
      totals,
      totalQuantity,
      amountInWords: invoice.amount_in_words || numberToWords(totals.grandTotal),
    };
  };

  const invoiceData = transformToInvoiceData();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-48" />
          </div>
          <Skeleton className="h-[600px] w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!invoice) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Proforma Invoice not found</h2>
          <p className="text-muted-foreground mb-4">
            The proforma invoice you're looking for doesn't exist.
          </p>
          <Button onClick={() => navigate("/invoices")}>Back to Proformas</Button>
        </div>
      </AppLayout>
    );
  }

  if (!invoiceData) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Company settings required</h2>
          <p className="text-muted-foreground mb-4">
            Please configure your company settings to view proforma invoices.
          </p>
          <Button onClick={() => navigate("/settings")}>Configure Settings</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/invoices")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-2xl font-serif font-bold">
                Proforma #{invoice.invoice_no}
              </h2>
              <p className="text-muted-foreground">Preview and manage proforma invoice</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button 
              variant="outline" 
              onClick={handleDownloadPdf}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {isDownloading ? "Downloading..." : "Download PDF"}
            </Button>
            <Button onClick={() => navigate(`/invoices/${id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>

        {/* Invoice Preview */}
        <div className="max-w-4xl mx-auto">
          <Invoice data={invoiceData} containerId="invoice-container" />
        </div>
      </div>
    </AppLayout>
  );
}
