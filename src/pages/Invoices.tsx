import { AppLayout } from "@/components/layout/AppLayout";
import { useInvoices, useUpdateInvoiceStatus, Invoice } from "@/hooks/useInvoices";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { useInvoiceFilters } from "@/hooks/useInvoiceFilters";
import { InvoiceFilters } from "@/components/invoices/InvoiceFilters";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, Plus, Edit, RefreshCcw, MoreVertical, Send, CheckCircle, XCircle, Clock, Download, Eye, SearchX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { generateInvoicePDF } from "@/lib/pdf-generator";
import { supabase } from "@/integrations/supabase/client";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-100 text-blue-800",
  paid: "bg-invoice-success/10 text-invoice-success",
  cancelled: "bg-destructive/10 text-destructive",
};

const statusIcons: Record<string, React.ReactNode> = {
  draft: <Clock className="h-3 w-3" />,
  sent: <Send className="h-3 w-3" />,
  paid: <CheckCircle className="h-3 w-3" />,
  cancelled: <XCircle className="h-3 w-3" />,
};

export default function InvoicesPage() {
  const navigate = useNavigate();
  const { data: invoices, isLoading } = useInvoices();
  const { data: companySettings } = useCompanySettings();
  const updateStatus = useUpdateInvoiceStatus();
  
  const { filters, setFilters, filteredInvoices, clearFilters, hasActiveFilters } = useInvoiceFilters(invoices);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleStatusChange = async (invoiceId: string, status: Invoice["status"]) => {
    try {
      await updateStatus.mutateAsync({ id: invoiceId, status });
      toast.success(`Invoice status updated to ${status}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    }
  };

  const handleExportPDF = async (invoiceId: string) => {
    try {
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .select("*, customers(*), billing_address:addresses!billing_address_id(*), shipping_address:addresses!shipping_address_id(*)")
        .eq("id", invoiceId)
        .single();

      if (invoiceError) throw invoiceError;

      const { data: items, error: itemsError } = await supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", invoiceId)
        .order("sl_no");

      if (itemsError) throw itemsError;

      if (!companySettings) {
        toast.error("Please configure company settings first");
        navigate("/settings");
        return;
      }

      await generateInvoicePDF(
        {
          ...invoice,
          items: items || [],
          customer: invoice.customers,
          billing_address: invoice.billing_address,
          shipping_address: invoice.shipping_address,
        },
        companySettings
      );

      toast.success("PDF downloaded successfully");
    } catch (error: any) {
      console.error("PDF export error:", error);
      toast.error(error.message || "Failed to export PDF");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-serif font-bold">Invoices</h2>
            <p className="text-muted-foreground">View and manage all your invoices</p>
          </div>
          <Button className="gap-2" onClick={() => navigate("/invoices/new")}>
            <Plus className="h-4 w-4" />
            New Invoice
          </Button>
        </div>

        {/* Search and Filters */}
        <InvoiceFilters
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={clearFilters}
        />

        {/* Results Summary */}
        {!isLoading && invoices && invoices.length > 0 && (
          <div className="text-sm text-muted-foreground">
            Showing {filteredInvoices.length} of {invoices.length} invoices
            {hasActiveFilters && " (filtered)"}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                    <Skeleton className="h-6 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : invoices?.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No invoices yet</h3>
              <p className="text-muted-foreground mb-4">Create your first invoice to get started</p>
              <Button className="gap-2" onClick={() => navigate("/invoices/new")}>
                <Plus className="h-4 w-4" />
                Create Invoice
              </Button>
            </CardContent>
          </Card>
        ) : filteredInvoices.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <SearchX className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No matching invoices</h3>
              <p className="text-muted-foreground mb-4">Try adjusting your search or filters</p>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredInvoices.map((invoice) => (
              <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Invoice #{invoice.invoice_no}</span>
                        {invoice.is_recurring && (
                          <RefreshCcw className="h-4 w-4 text-invoice-accent" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{new Date(invoice.date).toLocaleDateString("en-IN")}</span>
                        {(invoice as any).customers?.name && (
                          <>
                            <span>•</span>
                            <span className="truncate">{(invoice as any).customers.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(Number(invoice.grand_total))}</p>
                      <Badge className={`gap-1 ${statusColors[invoice.status] || statusColors.draft}`}>
                        {statusIcons[invoice.status]}
                        {invoice.status}
                      </Badge>
                    </div>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleExportPDF(invoice.id)}
                      title="Download PDF"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-popover">
                        <DropdownMenuItem onClick={() => navigate(`/invoices/${invoice.id}`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Invoice
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportPDF(invoice.id)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/invoices/${invoice.id}/edit`)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Invoice
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(invoice.id, "draft")}
                          disabled={invoice.status === "draft"}
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          Mark as Draft
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(invoice.id, "sent")}
                          disabled={invoice.status === "sent"}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Mark as Sent
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(invoice.id, "paid")}
                          disabled={invoice.status === "paid"}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark as Paid
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(invoice.id, "cancelled")}
                          disabled={invoice.status === "cancelled"}
                          className="text-destructive"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Mark as Cancelled
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
