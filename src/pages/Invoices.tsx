import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useInvoices, useUpdateInvoiceStatus, useDeleteInvoice, Invoice } from "@/hooks/useInvoices";
import { useIsAdmin } from "@/hooks/useAdmin";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { usePdfTemplateSettings } from "@/hooks/usePdfTemplateSettings";
import { useInvoiceFilters } from "@/hooks/useInvoiceFilters";
import { useSendStatusNotification } from "@/hooks/useStatusNotification";
import { InvoiceFilters } from "@/components/invoices/InvoiceFilters";
import { SendInvoiceDialog } from "@/components/invoices/SendInvoiceDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FileText, Plus, Edit, RefreshCcw, MoreVertical, Send, CheckCircle, XCircle, Clock, Download, Eye, SearchX, Mail, Loader2, Trash2, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { generateInvoicePDF } from "@/lib/pdf-generator";
import { supabase } from "@/integrations/supabase/client";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  paid: "bg-invoice-success/10 text-invoice-success",
  cancelled: "bg-destructive/10 text-destructive",
};

const statusIcons: Record<string, React.ReactNode> = {
  draft: <Clock className="h-3 w-3" />,
  sent: <Send className="h-3 w-3" />,
  paid: <CheckCircle className="h-3 w-3" />,
  cancelled: <XCircle className="h-3 w-3" />,
};

interface FullInvoiceData {
  id: string;
  invoice_no: string;
  date: string;
  grand_total: number;
  subtotal: number;
  discount_percent: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  round_off: number;
  e_way_bill_no?: string | null;
  supplier_invoice_no?: string | null;
  supplier_invoice_date?: string | null;
  other_references?: string | null;
  amount_in_words?: string | null;
  items: any[];
  customer?: any;
  billing_address?: any;
  shipping_address?: any;
}

interface StatusChangeConfirmation {
  invoiceId: string;
  invoiceNo: string;
  newStatus: Invoice["status"];
  customerEmail?: string;
  customerName?: string;
  grandTotal: number;
}

export default function InvoicesPage() {
  const navigate = useNavigate();
  const { data: invoices, isLoading } = useInvoices();
  const { data: isAdmin } = useIsAdmin();
  const { data: companySettings } = useCompanySettings();
  const { data: templateSettings } = usePdfTemplateSettings();
  const updateStatus = useUpdateInvoiceStatus();
  const deleteInvoice = useDeleteInvoice();
  const sendNotification = useSendStatusNotification();
  
  const { filters, setFilters, filteredInvoices, clearFilters, hasActiveFilters } = useInvoiceFilters(invoices);

  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<FullInvoiceData | null>(null);
  
  // Status change with notification
  const [statusConfirmation, setStatusConfirmation] = useState<StatusChangeConfirmation | null>(null);
  const [sendNotificationEmail, setSendNotificationEmail] = useState(true);
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  // Delete confirmation
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; invoiceNo: string; grandTotal: number } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const initiateStatusChange = async (invoiceId: string, status: Invoice["status"]) => {
    // Find invoice details
    const invoice = invoices?.find(inv => inv.id === invoiceId);
    if (!invoice) return;

    const customer = (invoice as any).customers;
    
    // If customer has email and status is not draft, show confirmation
    if (customer?.email && status !== "draft") {
      setStatusConfirmation({
        invoiceId,
        invoiceNo: invoice.invoice_no,
        newStatus: status,
        customerEmail: customer.email,
        customerName: customer.name,
        grandTotal: Number(invoice.grand_total),
      });
      setSendNotificationEmail(true);
    } else {
      // No email or draft status, just update
      await handleStatusChange(invoiceId, status, false);
    }
  };

  const handleStatusChange = async (invoiceId: string, status: Invoice["status"], notify: boolean = false) => {
    setIsChangingStatus(true);
    try {
      await updateStatus.mutateAsync({ id: invoiceId, status });
      
      if (notify && statusConfirmation) {
        await sendNotification.mutateAsync({
          invoiceId,
          invoiceNo: statusConfirmation.invoiceNo,
          newStatus: status,
          recipientEmail: statusConfirmation.customerEmail!,
          recipientName: statusConfirmation.customerName || "Valued Customer",
          grandTotal: formatCurrency(statusConfirmation.grandTotal),
          companyName: companySettings?.name || "Invoice System",
        });
        toast.success(`Status updated and notification sent to ${statusConfirmation.customerEmail}`);
      } else {
        toast.success(`Invoice status updated to ${status}`);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    } finally {
      setIsChangingStatus(false);
      setStatusConfirmation(null);
    }
  };

  const confirmStatusChange = async () => {
    if (!statusConfirmation) return;
    await handleStatusChange(statusConfirmation.invoiceId, statusConfirmation.newStatus, sendNotificationEmail);
  };

  const handleDeleteInvoice = async () => {
    if (!deleteConfirmation) return;
    setIsDeleting(true);
    try {
      await deleteInvoice.mutateAsync(deleteConfirmation.id);
      toast.success(`Invoice #${deleteConfirmation.invoiceNo} deleted successfully`);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete invoice");
    } finally {
      setIsDeleting(false);
      setDeleteConfirmation(null);
    }
  };

  const fetchFullInvoice = async (invoiceId: string): Promise<FullInvoiceData | null> => {
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

    return {
      ...invoice,
      items: items || [],
      customer: invoice.customers,
      billing_address: invoice.billing_address,
      shipping_address: invoice.shipping_address,
    };
  };

  const handleExportPDF = async (invoiceId: string) => {
    try {
      const fullInvoice = await fetchFullInvoice(invoiceId);

      if (!companySettings) {
        toast.error("Please configure company settings first");
        navigate("/settings");
        return;
      }

      await generateInvoicePDF(fullInvoice!, companySettings, { templateSettings });
      toast.success("PDF downloaded successfully");
    } catch (error: any) {
      console.error("PDF export error:", error);
      toast.error(error.message || "Failed to export PDF");
    }
  };

  const handleSendEmail = async (invoiceId: string) => {
    if (!companySettings) {
      toast.error("Please configure company settings first");
      navigate("/settings");
      return;
    }

    try {
      const fullInvoice = await fetchFullInvoice(invoiceId);
      setSelectedInvoice(fullInvoice);
      setSendDialogOpen(true);
    } catch (error: any) {
      console.error("Error fetching invoice:", error);
      toast.error(error.message || "Failed to load invoice");
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
                        {isAdmin && (invoice as any).profiles?.full_name && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-xs bg-muted px-1.5 py-0.5 rounded">
                              <User className="h-3 w-3" />
                              {(invoice as any).profiles.full_name}
                            </span>
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
                        <DropdownMenuItem onClick={() => handleSendEmail(invoice.id)}>
                          <Mail className="h-4 w-4 mr-2" />
                          Send via Email
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
                          onClick={() => initiateStatusChange(invoice.id, "draft")}
                          disabled={invoice.status === "draft"}
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          Mark as Draft
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => initiateStatusChange(invoice.id, "sent")}
                          disabled={invoice.status === "sent"}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Mark as Sent
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => initiateStatusChange(invoice.id, "paid")}
                          disabled={invoice.status === "paid"}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark as Paid
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => initiateStatusChange(invoice.id, "cancelled")}
                          disabled={invoice.status === "cancelled"}
                          className="text-destructive"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Mark as Cancelled
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteConfirmation({
                            id: invoice.id,
                            invoiceNo: invoice.invoice_no,
                            grandTotal: Number(invoice.grand_total),
                          })}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Invoice
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

      {/* Send Invoice Email Dialog */}
      <SendInvoiceDialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        invoice={selectedInvoice}
        companySettings={companySettings || null}
        templateSettings={templateSettings}
      />

      {/* Status Change Confirmation Dialog */}
      <Dialog open={!!statusConfirmation} onOpenChange={(open) => !open && setStatusConfirmation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Invoice Status</DialogTitle>
            <DialogDescription>
              Change Invoice #{statusConfirmation?.invoiceNo} to <strong>{statusConfirmation?.newStatus}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="sendNotification"
                checked={sendNotificationEmail}
                onCheckedChange={(checked) => setSendNotificationEmail(checked as boolean)}
              />
              <div className="space-y-1">
                <Label htmlFor="sendNotification" className="cursor-pointer">
                  Send email notification
                </Label>
                <p className="text-sm text-muted-foreground">
                  Notify {statusConfirmation?.customerName} at {statusConfirmation?.customerEmail}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusConfirmation(null)} disabled={isChangingStatus}>
              Cancel
            </Button>
            <Button onClick={confirmStatusChange} disabled={isChangingStatus}>
              {isChangingStatus ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmation} onOpenChange={(open) => !open && setDeleteConfirmation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete Invoice #{deleteConfirmation?.invoiceNo}? This will permanently remove the invoice and all associated line items. 
              <br /><br />
              <strong>Amount: {formatCurrency(deleteConfirmation?.grandTotal || 0)}</strong>
              <br /><br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteInvoice}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
