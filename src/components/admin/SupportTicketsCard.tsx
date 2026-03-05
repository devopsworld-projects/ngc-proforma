import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { TicketCheck, Eye, Clock, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; class: string; icon: typeof Clock }> = {
  open: { label: "Open", class: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Clock },
  in_progress: { label: "In Progress", class: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: AlertTriangle },
  resolved: { label: "Resolved", class: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
};

const priorityConfig: Record<string, { label: string; class: string }> = {
  low: { label: "🟢 Low", class: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" },
  medium: { label: "🟡 Medium", class: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400" },
  high: { label: "🔴 High", class: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400" },
  critical: { label: "🚨 Critical", class: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 font-bold" },
};

interface Ticket {
  id: string;
  user_id: string;
  user_email: string | null;
  user_name: string | null;
  subject: string;
  message: string;
  priority: string;
  status: string;
  created_at: string;
}

export function SupportTicketsCard() {
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["admin-support-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("concerns")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Ticket[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("concerns")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-support-tickets"] });
      toast.success("Ticket status updated");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const filtered = tickets?.filter(t => filterStatus === "all" || t.status === filterStatus) || [];
  const openCount = tickets?.filter(t => t.status === "open").length || 0;
  const inProgressCount = tickets?.filter(t => t.status === "in_progress").length || 0;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TicketCheck className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Support Tickets</CardTitle>
                <CardDescription>
                  {openCount} open · {inProgressCount} in progress · {tickets?.length || 0} total
                </CardDescription>
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tickets</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No tickets found</p>
          ) : (
            <ScrollArea className="max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Submitted By</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((ticket) => {
                    const priority = priorityConfig[ticket.priority] || priorityConfig.medium;
                    const status = statusConfig[ticket.status] || statusConfig.open;
                    return (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-medium max-w-[200px] truncate">{ticket.subject}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{ticket.user_name || "—"}</p>
                            <p className="text-xs text-muted-foreground">{ticket.user_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={priority.class}>{priority.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={ticket.status}
                            onValueChange={(val) => updateStatus.mutate({ id: ticket.id, status: val })}
                          >
                            <SelectTrigger className="w-32 h-8">
                              <Badge className={status.class}>{status.label}</Badge>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(ticket.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(ticket)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TicketCheck className="h-5 w-5 text-primary" />
              Ticket Details
            </DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Submitted By</p>
                  <p className="font-medium">{selectedTicket.user_name || "—"}</p>
                  <p className="text-xs text-muted-foreground">{selectedTicket.user_email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">{format(new Date(selectedTicket.created_at), "PPp")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Priority</p>
                  <Badge className={priorityConfig[selectedTicket.priority]?.class}>
                    {priorityConfig[selectedTicket.priority]?.label || selectedTicket.priority}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Select
                    value={selectedTicket.status}
                    onValueChange={(val) => {
                      updateStatus.mutate({ id: selectedTicket.id, status: val });
                      setSelectedTicket({ ...selectedTicket, status: val });
                    }}
                  >
                    <SelectTrigger className="w-36 h-8 mt-1">
                      <Badge className={statusConfig[selectedTicket.status]?.class}>
                        {statusConfig[selectedTicket.status]?.label || selectedTicket.status}
                      </Badge>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Subject</p>
                <p className="font-medium">{selectedTicket.subject}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Message</p>
                <div className="bg-muted rounded-md p-3 text-sm whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                  {selectedTicket.message}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
