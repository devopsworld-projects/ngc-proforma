import { useState, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useInvoices, useUpdateInvoiceStatus, useDeleteInvoice, useRestoreInvoice, Invoice } from "@/hooks/useInvoices";
import { useIsAdmin } from "@/hooks/useAdmin";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { useInvoiceFilters } from "@/hooks/useInvoiceFilters";
import { useSendStatusNotification } from "@/hooks/useStatusNotification";
import { InvoiceFilters } from "@/components/invoices/InvoiceFilters";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { FileText, Plus, Edit, RefreshCcw, MoreVertical, Send, CheckCircle, XCircle, Clock, Eye, SearchX, Loader2, Trash2, User, RotateCcw, StickyNote, Save, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import type { UserOption } from "@/components/invoices/InvoiceFilters";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  paid: "bg-invoice-success/10 text-invoice-success",
  cancelled: "bg-destructive/10 text-destructive",
  deleted: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

const statusIcons: Record<string, React.ReactNode> = {
  draft: <Clock className="h-3 w-3" />,
  sent: <Send className="h-3 w-3" />,
  paid: <CheckCircle className="h-3 w-3" />,
  cancelled: <XCircle className="h-3 w-3" />,
  deleted: <Trash2 className="h-3 w-3" />,
};

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
  const { user } = useAuth();
  const { data: invoices, isLoading } = useInvoices();
  const { data: isAdmin } = useIsAdmin();
  const { data: companySettings } = useCompanySettings();
  const updateStatus = useUpdateInvoiceStatus();
  const deleteInvoice = useDeleteInvoice();
  const restoreInvoice = useRestoreInvoice();
  const sendNotification = useSendStatusNotification();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("active");

  // Notes editing state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  
  // Fetch deleted invoices for admin
  const { data: deletedInvoices, isLoading: isLoadingDeleted } = useQuery({
    queryKey: ["deleted-invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, customers(name)")
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false });
      if (error) throw error;
      
      // Fetch profiles for user names
      const userIds = [...new Set(data.map(inv => inv.user_id).filter(Boolean))] as string[];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);
      
      return data.map(inv => ({
        ...inv,
        owner_name: inv.user_id ? profileMap.get(inv.user_id) || null : null
      }));
    },
    enabled: !!isAdmin,
  });
  
  const { filters, setFilters, filteredInvoices, clearFilters, hasActiveFilters, sortConfig, handleSort } = useInvoiceFilters(invoices);

  // Derive unique user options from invoices for admin filter
  const userOptions: UserOption[] = useMemo(() => {
    if (!isAdmin || !invoices) return [];
    const userMap = new Map<string, string>();
    invoices.forEach((inv: any) => {
      if (inv.user_id && inv.owner_name) {
        userMap.set(inv.user_id, inv.owner_name);
      }
    });
    return Array.from(userMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [isAdmin, invoices]);

  
  // Status change with notification
  const [statusConfirmation, setStatusConfirmation] = useState<StatusChangeConfirmation | null>(null);
  const [sendNotificationEmail, setSendNotificationEmail] = useState(true);
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  // Delete confirmation
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; invoiceNo: string; grandTotal: number } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Restore confirmation
  const [restoreConfirmation, setRestoreConfirmation] = useState<{ id: string; invoiceNo: string } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const startEditingNote = (invoiceId: string, currentNote: string | null) => {
    setEditingNoteId(invoiceId);
    setNoteText(currentNote || "");
  };

  const cancelEditingNote = () => {
    setEditingNoteId(null);
    setNoteText("");
  };

  const saveNote = async (invoiceId: string) => {
    setIsSavingNote(true);
    try {
      const { error } = await supabase
        .from("invoices")
        .update({ notes: noteText.trim() || null })
        .eq("id", invoiceId);
      if (error) throw error;
      toast.success("Note saved");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["deleted-invoices"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to save note");
    } finally {
      setIsSavingNote(false);
      setEditingNoteId(null);
      setNoteText("");
    }
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
          companyName: companySettings?.name || "Proforma System",
        });
        toast.success(`Status updated and notification sent to ${statusConfirmation.customerEmail}`);
      } else {
        toast.success(`Proforma status updated to ${status}`);
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
      toast.success(`Proforma #${deleteConfirmation.invoiceNo} deleted successfully`);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete proforma");
    } finally {
      setIsDeleting(false);
      setDeleteConfirmation(null);
    }
  };

  const handleRestoreInvoice = async () => {
    if (!restoreConfirmation) return;
    setIsRestoring(true);
    try {
      await restoreInvoice.mutateAsync(restoreConfirmation.id);
      toast.success(`Proforma #${restoreConfirmation.invoiceNo} restored successfully`);
    } catch (error: any) {
      toast.error(error.message || "Failed to restore proforma");
    } finally {
      setIsRestoring(false);
      setRestoreConfirmation(null);
    }
  };

  // Render invoice card
  const renderInvoiceCard = (invoice: any, isDeleted: boolean = false) => (
    <Card key={invoice.id} className="hover:shadow-md transition-shadow">
      <CardContent className="py-4">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDeleted ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-primary/10'}`}>
            <FileText className={`w-5 h-5 ${isDeleted ? 'text-orange-600' : 'text-primary'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Proforma #{invoice.invoice_no}</span>
              {invoice.is_recurring && (
                <RefreshCcw className="h-4 w-4 text-invoice-accent" />
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{new Date(invoice.date).toLocaleDateString("en-IN")}</span>
              {invoice.customers?.name && (
                <>
                  <span>•</span>
                  <span className="truncate">{invoice.customers.name}</span>
                </>
              )}
              {isAdmin && invoice.owner_name && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-xs bg-muted px-1.5 py-0.5 rounded">
                    <User className="h-3 w-3" />
                    {invoice.owner_name}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold">{formatCurrency(Number(invoice.grand_total))}</p>
            <Badge className={`gap-1 ${isDeleted ? statusColors.deleted : (statusColors[invoice.status] || statusColors.draft)}`}>
              {isDeleted ? statusIcons.deleted : statusIcons[invoice.status]}
              {isDeleted ? "deleted" : invoice.status}
            </Badge>
          </div>
          {isDeleted ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRestoreConfirmation({ id: invoice.id, invoiceNo: invoice.invoice_no })}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Restore
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-popover">
                <DropdownMenuItem onClick={() => navigate(`/invoices/${invoice.id}`)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Proforma
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(`/invoices/${invoice.id}/edit`)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Proforma
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
                  Delete Proforma
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Notes section - visible to admin and invoice creator */}
        {(isAdmin || invoice.user_id === user?.id) && (
          <div className="mt-3 pt-3 border-t border-border">
            {editingNoteId === invoice.id ? (
              <div className="space-y-2">
                <Textarea
                  placeholder="Add a note..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="min-h-[60px] text-sm resize-none"
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="ghost" onClick={cancelEditingNote} disabled={isSavingNote}>
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={() => saveNote(invoice.id)} disabled={isSavingNote}>
                    {isSavingNote ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => startEditingNote(invoice.id, invoice.notes)}
                className="w-full text-left flex items-start gap-2 group cursor-pointer hover:bg-muted/50 rounded p-1 -m-1 transition-colors"
              >
                <StickyNote className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                {invoice.notes ? (
                  <span className="text-sm text-muted-foreground whitespace-pre-wrap">{invoice.notes}</span>
                ) : (
                  <span className="text-sm text-muted-foreground/50 italic group-hover:text-muted-foreground transition-colors">Add a note...</span>
                )}
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-serif font-bold">Proforma Invoices</h2>
            <p className="text-muted-foreground">View and manage all your proforma invoices</p>
          </div>
          <Button className="gap-2" onClick={() => navigate("/invoices/new")}>
            <Plus className="h-4 w-4" />
            New Proforma
          </Button>
        </div>

        {/* Tabs for Active / Deleted (admin only) */}
        {isAdmin ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="active" className="gap-2">
                <FileText className="h-4 w-4" />
                Active ({invoices?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="deleted" className="gap-2">
                <Trash2 className="h-4 w-4" />
                Deleted ({deletedInvoices?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              {/* Search and Filters */}
              <InvoiceFilters
                filters={filters}
                onFiltersChange={setFilters}
                onClearFilters={clearFilters}
                sortConfig={sortConfig}
                onSort={handleSort}
                userOptions={isAdmin ? userOptions : undefined}
              />

              {/* Results Summary */}
              {!isLoading && invoices && invoices.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  Showing {filteredInvoices.length} of {invoices.length} proforma invoices
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
                    <h3 className="text-lg font-medium mb-2">No proforma invoices yet</h3>
                    <p className="text-muted-foreground mb-4">Create your first proforma invoice to get started</p>
                    <Button className="gap-2" onClick={() => navigate("/invoices/new")}>
                      <Plus className="h-4 w-4" />
                      Create Proforma
                    </Button>
                  </CardContent>
                </Card>
              ) : filteredInvoices.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <SearchX className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No matching proforma invoices</h3>
                    <p className="text-muted-foreground mb-4">Try adjusting your search or filters</p>
                    <Button variant="outline" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {filteredInvoices.map((invoice) => renderInvoiceCard(invoice, false))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="deleted" className="space-y-4">
              {isLoadingDeleted ? (
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
              ) : !deletedInvoices || deletedInvoices.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <Trash2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No deleted invoices</h3>
                    <p className="text-muted-foreground">Deleted invoices will appear here</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {deletedInvoices.map((invoice) => renderInvoiceCard(invoice, true))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <>
            {/* Search and Filters for non-admin */}
            <InvoiceFilters
              filters={filters}
              onFiltersChange={setFilters}
              onClearFilters={clearFilters}
              sortConfig={sortConfig}
              onSort={handleSort}
            />

            {/* Results Summary */}
            {!isLoading && invoices && invoices.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Showing {filteredInvoices.length} of {invoices.length} proforma invoices
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
                  <h3 className="text-lg font-medium mb-2">No proforma invoices yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first proforma invoice to get started</p>
                  <Button className="gap-2" onClick={() => navigate("/invoices/new")}>
                    <Plus className="h-4 w-4" />
                    Create Proforma
                  </Button>
                </CardContent>
              </Card>
            ) : filteredInvoices.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <SearchX className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No matching proforma invoices</h3>
                  <p className="text-muted-foreground mb-4">Try adjusting your search or filters</p>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredInvoices.map((invoice) => renderInvoiceCard(invoice, false))}
              </div>
            )}
          </>
        )}
      </div>


      {/* Status Change Confirmation Dialog */}
      <Dialog open={!!statusConfirmation} onOpenChange={(open) => !open && setStatusConfirmation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Proforma Status</DialogTitle>
            <DialogDescription>
              Change Proforma #{statusConfirmation?.invoiceNo} to <strong>{statusConfirmation?.newStatus}</strong>
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
            <AlertDialogTitle>Delete Proforma Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete Proforma #{deleteConfirmation?.invoiceNo}? This will permanently remove the proforma invoice and all associated line items. 
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

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={!!restoreConfirmation} onOpenChange={(open) => !open && setRestoreConfirmation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Proforma Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore Proforma #{restoreConfirmation?.invoiceNo}? 
              <br /><br />
              This will move the invoice back to the active list with its original status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRestoring}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestoreInvoice}
              disabled={isRestoring}
            >
              {isRestoring ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Restoring...
                </>
              ) : (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Restore
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
