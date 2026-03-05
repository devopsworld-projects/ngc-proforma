import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TicketCheck, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

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

export function MyTicketsCard() {
  const { user } = useAuth();

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["my-support-tickets", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("concerns")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <TicketCheck className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <CardTitle>My Support Tickets</CardTitle>
            <CardDescription>Track the status of your submitted tickets</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : !tickets || tickets.length === 0 ? (
          <p className="text-center text-muted-foreground py-6 text-sm">
            No tickets submitted yet. Use the floating mail button to raise a ticket.
          </p>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => {
              const status = statusConfig[ticket.status] || statusConfig.open;
              const priority = priorityConfig[ticket.priority] || priorityConfig.medium;
              const StatusIcon = status.icon;
              return (
                <div key={ticket.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm leading-tight">{ticket.subject}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={priority.class} variant="secondary">{priority.label}</Badge>
                      <Badge className={status.class}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{ticket.message}</p>
                  <p className="text-xs text-muted-foreground">
                    Submitted {format(new Date(ticket.created_at), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
