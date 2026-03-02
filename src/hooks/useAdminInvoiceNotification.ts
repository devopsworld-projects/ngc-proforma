import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useIsAdmin } from "./useAdmin";
import { toast } from "sonner";

export interface AdminNotification {
  id: string;
  invoice_id: string | null;
  invoice_no: string;
  event_type: string;
  customer_name: string | null;
  grand_total: number | null;
  actor_user_id: string | null;
  created_at: string;
}

export function useAdminInvoiceNotification() {
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const queryClient = useQueryClient();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch last_read_at for this admin
  const { data: lastReadAt } = useQuery({
    queryKey: ["admin-notification-read", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("admin_notification_reads")
        .select("last_read_at")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data?.last_read_at || null;
    },
    enabled: !!user && !!isAdmin,
  });

  // Fetch recent notifications (last 50)
  const { data: notifications = [] } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as AdminNotification[];
    },
    enabled: !!user && !!isAdmin,
  });

  // Compute unread count
  const unreadCount = lastReadAt
    ? notifications.filter((n) => new Date(n.created_at) > new Date(lastReadAt)).length
    : notifications.length;

  // Mark as read mutation
  const markAsRead = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { data: existing } = await supabase
        .from("admin_notification_reads")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("admin_notification_reads")
          .update({ last_read_at: new Date().toISOString() })
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("admin_notification_reads")
          .insert({ user_id: user.id, last_read_at: new Date().toISOString() });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notification-read"] });
    },
  });

  // Realtime subscription for new notifications + sound
  useEffect(() => {
    if (!user || !isAdmin) return;

    const audio = new Audio();
    audio.src =
      "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVggoeLh4J/gIKDg4J8dGxrcX+PloeAfXl8g4mLiYZ/eHRydX+Ii4mEfXd1d3yDiIqIhH55eHp+g4eIh4N9eXl6fYKGiIeDfnl4en2BhYeGg355eHl8gIWHhoR/e3l6fICEhoaDf3t5eny/wcHBwb+/v7+/v8DBwcHBwMDAwMDBwcHBwcDAwMDAwcHBwcHAwMDAwMHBwcHBwMDAwMDBwcHBwcDAwMDAwQ==";
    audioRef.current = audio;

    const channel = supabase
      .channel("admin-notifications-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "admin_notifications" },
        (payload) => {
          const n = payload.new as AdminNotification;
          // Don't notify for own actions
          if (n.actor_user_id === user.id) return;

          audioRef.current?.play().catch(() => {});
          queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });

          const eventLabel = getEventLabel(n.event_type);
          toast.info(`Proforma #${n.invoice_no} ${eventLabel}`, {
            description: n.customer_name
              ? `${n.customer_name} • ₹${Number(n.grand_total || 0).toLocaleString("en-IN")}`
              : `₹${Number(n.grand_total || 0).toLocaleString("en-IN")}`,
            duration: 8000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isAdmin, queryClient]);

  return {
    notifications,
    unreadCount,
    markAsRead: () => markAsRead.mutate(),
    lastReadAt,
  };
}

export function getEventLabel(eventType: string): string {
  switch (eventType) {
    case "created": return "created";
    case "deleted": return "deleted";
    case "restored": return "restored";
    case "status_sent": return "marked as sent";
    case "status_paid": return "marked as paid";
    case "status_cancelled": return "cancelled";
    case "status_draft": return "set to draft";
    default: return "updated";
  }
}

export function getEventColor(eventType: string): string {
  switch (eventType) {
    case "created": return "text-emerald-600 dark:text-emerald-400";
    case "deleted": return "text-destructive";
    case "restored": return "text-blue-600 dark:text-blue-400";
    case "status_paid": return "text-emerald-600 dark:text-emerald-400";
    case "status_cancelled": return "text-destructive";
    default: return "text-muted-foreground";
  }
}
