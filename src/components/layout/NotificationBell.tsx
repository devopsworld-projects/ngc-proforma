import { Link } from "react-router-dom";
import { Bell, FileText, Trash2, RotateCcw, CheckCircle, Send, XCircle, Edit, UserCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AdminNotification, getEventLabel, getEventColor } from "@/hooks/useAdminInvoiceNotification";
import { formatDistanceToNow } from "date-fns";

interface NotificationBellProps {
  unreadCount: number;
  notifications: AdminNotification[];
  onMarkAsRead: () => void;
  onClearAll: () => void;
  lastReadAt: string | null;
}

function getEventIcon(eventType: string) {
  switch (eventType) {
    case "created": return <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
    case "deleted": return <Trash2 className="h-4 w-4 text-destructive" />;
    case "restored": return <RotateCcw className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
    case "status_paid": return <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
    case "status_sent": return <Send className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
    case "status_cancelled": return <XCircle className="h-4 w-4 text-destructive" />;
    default: return <Edit className="h-4 w-4 text-muted-foreground" />;
  }
}

export function NotificationBell({ unreadCount, notifications, onMarkAsRead, onClearAll, lastReadAt }: NotificationBellProps) {
  const isUnread = (n: AdminNotification) =>
    !lastReadAt || new Date(n.created_at) > new Date(lastReadAt);

  return (
    <DropdownMenu onOpenChange={(open) => { if (open && unreadCount > 0) onMarkAsRead(); }}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 text-[10px] flex items-center justify-center rounded-full animate-pulse">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 bg-background border border-border shadow-xl z-[100]">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h4 className="text-sm font-semibold">Notifications</h4>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <span className="text-xs text-muted-foreground">{unreadCount} new</span>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                onClick={(e) => { e.stopPropagation(); onClearAll(); }}
              >
                Clear all
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((n) => (
                <Link
                  key={n.id}
                  to={n.invoice_id ? `/invoices/${n.invoice_id}` : "/invoices"}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors ${
                    isUnread(n) ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="mt-0.5 shrink-0">{getEventIcon(n.event_type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">#{n.invoice_no}</span>{" "}
                      <span className={getEventColor(n.event_type)}>{getEventLabel(n.event_type)}</span>
                    </p>
                    {n.customer_name && (
                      <p className="text-xs text-muted-foreground truncate">{n.customer_name}</p>
                    )}
                    <div className="flex items-center gap-2 mt-0.5">
                      {n.grand_total != null && (
                        <span className="text-xs font-medium">
                          ₹{Number(n.grand_total).toLocaleString("en-IN")}
                        </span>
                      )}
                      {n.actor_name && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <UserCircle className="h-3 w-3" />
                          {n.actor_name}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  {isUnread(n) && (
                    <div className="mt-2 h-2 w-2 rounded-full bg-primary shrink-0" />
                  )}
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
