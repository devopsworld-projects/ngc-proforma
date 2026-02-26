import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useAdmin";
import { FileText, TrendingUp, Filter } from "lucide-react";
import { format } from "date-fns";

interface QuotationWithUser {
  id: string;
  invoice_no: string;
  date: string;
  status: string;
  grand_total: number;
  created_at: string;
  customer_name: string | null;
  user_email: string | null;
  user_name: string | null;
  deleted_at: string | null;
}

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  paid: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  deleted: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
}

type StatusFilter = "all" | "active" | "deleted";

export function QuotationTrackingCard() {
  const { data: isAdmin } = useIsAdmin();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  
  const { data: quotations, isLoading } = useQuery({
    queryKey: ["admin-quotations"],
    queryFn: async () => {
      // Get all invoices with customer and user info
      const { data: invoices, error } = await supabase
        .from("invoices")
        .select(`
          id,
          invoice_no,
          date,
          status,
          grand_total,
          created_at,
          deleted_at,
          user_id,
          customers (name)
        `)
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      // Get user profiles for the invoices
      const userIds = [...new Set(invoices?.map(i => i.user_id).filter(Boolean))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);
      
      return invoices?.map(inv => ({
        id: inv.id,
        invoice_no: inv.invoice_no,
        date: inv.date,
        status: inv.deleted_at ? "deleted" : inv.status,
        grand_total: inv.grand_total,
        created_at: inv.created_at,
        customer_name: inv.customers?.name || null,
        user_name: inv.user_id ? profileMap.get(inv.user_id) || null : null,
        deleted_at: inv.deleted_at,
      })) as QuotationWithUser[];
    },
    enabled: !!isAdmin,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quotation Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = {
    total: quotations?.length || 0,
    draft: quotations?.filter(q => q.status === "draft").length || 0,
    sent: quotations?.filter(q => q.status === "sent").length || 0,
    paid: quotations?.filter(q => q.status === "paid").length || 0,
    deleted: quotations?.filter(q => q.status === "deleted").length || 0,
  };

  // Filter quotations based on selected filter
  const filteredQuotations = quotations?.filter(q => {
    if (statusFilter === "all") return true;
    if (statusFilter === "deleted") return q.status === "deleted";
    if (statusFilter === "active") return q.status !== "deleted";
    return true;
  }) || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quotation Tracking
            </CardTitle>
            <CardDescription>
              Monitor all quotations across users
            </CardDescription>
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-36">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ({stats.total})</SelectItem>
              <SelectItem value="active">Active ({stats.total - stats.deleted})</SelectItem>
              <SelectItem value="deleted">Deleted ({stats.deleted})</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-5 gap-3">
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold text-muted-foreground">{stats.draft}</p>
            <p className="text-xs text-muted-foreground">Draft</p>
          </div>
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{stats.sent}</p>
            <p className="text-xs text-blue-600/70">Sent</p>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
            <p className="text-xs text-green-600/70">Paid</p>
          </div>
          <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">{stats.deleted}</p>
            <p className="text-xs text-orange-600/70">Deleted</p>
          </div>
        </div>

        {/* Quotations Table */}
        <ScrollArea className="h-[300px]">
          {filteredQuotations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <FileText className="h-10 w-10 mb-2" />
              <p>No {statusFilter === "all" ? "" : statusFilter} quotations found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proforma #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotations.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="font-mono text-sm">{q.invoice_no}</TableCell>
                    <TableCell>{q.customer_name || "—"}</TableCell>
                    <TableCell>{q.user_name || "—"}</TableCell>
                    <TableCell>{format(new Date(q.date), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[q.status] || "bg-muted"}>
                        {q.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(q.grand_total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
