import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useIsAdmin } from "./useAdmin";
import { toast } from "sonner";

export function useAdminInvoiceNotification() {
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const resetUnreadCount = useCallback(() => setUnreadCount(0), []);

  useEffect(() => {
    if (!user || !isAdmin) return;

    const audio = new Audio();
    audio.src = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVggoeLh4J/gIKDg4J8dGxrcX+PloeAfXl8g4mLiYZ/eHRydX+Ii4mEfXd1d3yDiIqIhH55eHp+g4eIh4N9eXl6fYKGiIeDfnl4en2BhYeGg355eHl8gIWHhoR/e3l6fICEhoaDf3t5eny/wcHBwb+/v7+/v8DBwcHBwMDAwMDBwcHBwcDAwMDAwcHBwcHAwMDAwMHBwcHBwMDAwMDBwcHBwcDAwMDAwQ==";
    audioRef.current = audio;

    const channel = supabase
      .channel("admin-new-invoices")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "invoices",
        },
        (payload) => {
          const newInvoice = payload.new as any;
          if (newInvoice.user_id === user.id) return;

          audioRef.current?.play().catch(() => {});
          setUnreadCount((c) => c + 1);

          toast.info(`New Proforma #${newInvoice.invoice_no} created`, {
            description: `Total: ₹${Number(newInvoice.grand_total).toLocaleString("en-IN")}`,
            duration: 8000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isAdmin]);

  return { unreadCount, resetUnreadCount };
}
