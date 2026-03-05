import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Invoice } from "@/components/invoice/Invoice";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Loader2, FileText } from "lucide-react";
import { InvoiceData, CompanyInfo, SupplierInfo, InvoiceItem, InvoiceTotals } from "@/types/invoice";
import { formatDate, numberToWords } from "@/lib/invoice-utils";
import { downloadInvoiceAsPdf } from "@/lib/html-to-pdf";
import { toast } from "sonner";
import { Toaster as Sonner } from "@/components/ui/sonner";

import { StaticPdfTemplateProvider } from "@/contexts/PdfTemplateContext";

const SCREEN_SHADOW = "0 25px 50px -12px rgba(30, 42, 74, 0.15)";

interface ShareData {
  invoice: any;
  companySettings: any;
  templateSettings: any;
}

export default function ShareInvoice() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ShareData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchInvoice = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-invoice?id=${id}`,
          {
            headers: {
              "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Invoice not found");
        }

        const json = await response.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || "Failed to load invoice");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  useEffect(() => {
    const container = document.getElementById("invoice-container");
    if (container) {
      container.style.boxShadow = SCREEN_SHADOW;
    }
  }, [data]);

  const handleDownloadPdf = async () => {
    if (!data?.invoice) return;

    setIsDownloading(true);
    try {
      await downloadInvoiceAsPdf(
        "invoice-container",
        `Proforma-${data.invoice.invoice_no}`
      );
      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error("Failed to download PDF:", error);
      toast.error("Failed to download PDF. Please try again.");
    } finally {
      const container = document.getElementById("invoice-container");
      if (container) {
        container.style.boxShadow = SCREEN_SHADOW;
      }
      setIsDownloading(false);
    }
  };

  const transformToInvoiceData = (): InvoiceData | null => {
    if (!data?.invoice || !data?.companySettings) return null;

    const invoice = data.invoice;
    const companySettings = data.companySettings;

    const company: CompanyInfo = {
      name: companySettings.name || "Company",
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
      sizeLabel: item.size_label || "",
      rate: Number(item.rate),
      discountPercent: Number(item.discount_percent || 0),
      amount: Number(item.amount),
      productImage: item.product_image || "",
      productUrl: item.product_url || "",
      gstPercent: item.gst_percent != null ? Number(item.gst_percent) : 18,
      gstAmount: item.gst_amount != null ? Number(item.gst_amount) : undefined,
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
    const taxType = (customer?.tax_type === "igst" ? "igst" : "cgst") as "cgst" | "igst";

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
      taxType,
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <div className="space-y-4 w-full max-w-4xl">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-[600px] w-full" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
          <h2 className="text-xl font-semibold">Invoice not found</h2>
          <p className="text-muted-foreground">
            This invoice may have been removed or the link is invalid.
          </p>
        </div>
      </div>
    );
  }

  const invoiceData = transformToInvoiceData();

  if (!invoiceData) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
          <h2 className="text-xl font-semibold">Unable to render invoice</h2>
        </div>
      </div>
    );
  }

  return (
    <StaticPdfTemplateProvider settings={data.templateSettings}>
      <Sonner />
      <div className="min-h-screen bg-muted/30">
        {/* Download bar */}
        <div className="sticky top-0 z-50 bg-background border-b shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <span className="font-semibold text-sm">
                Proforma #{data.invoice.invoice_no}
              </span>
            </div>
            <Button
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              size="sm"
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {isDownloading ? "Downloading..." : "Download PDF"}
            </Button>
          </div>
        </div>

        {/* Invoice */}
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
          <Invoice data={invoiceData} containerId="invoice-container" />
        </div>
      </div>
    </StaticPdfTemplateProvider>
  );
}
