import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Package, Users, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useAdmin";

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

interface PopupConfig {
  popup_key: string;
  is_enabled: boolean;
  title: string;
  message: string;
}

interface ActivePopup {
  config: PopupConfig;
  count: number;
  navigateTo: string;
}

const POPUP_ICONS: Record<string, React.ReactNode> = {
  uncategorized_products: <Package className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
  incomplete_customers: <Users className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
  draft_proformas: <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
};

const POPUP_ROUTES: Record<string, string> = {
  uncategorized_products: "/products",
  incomplete_customers: "/customers",
  draft_proformas: "/invoices",
};

export function UncategorizedProductsAlert() {
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const [activePopup, setActivePopup] = useState<ActivePopup | null>(null);
  const [queueIndex, setQueueIndex] = useState(0);
  const [popupQueue, setPopupQueue] = useState<ActivePopup[]>([]);

  const checkPopups = useCallback(async () => {
    if (!user) return;

    // Fetch enabled popup configs
    const { data: configs, error } = await supabase
      .from("popup_settings")
      .select("popup_key, is_enabled, title, message")
      .eq("is_enabled", true);

    if (error || !configs || configs.length === 0) return;

    const queue: ActivePopup[] = [];

    for (const config of configs as PopupConfig[]) {
      let count = 0;

      if (config.popup_key === "uncategorized_products") {
        let query = supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true)
          .is("category", null);
        if (!isAdmin) query = query.eq("user_id", user.id);
        const { count: c } = await query;
        count = c || 0;
      } else if (config.popup_key === "incomplete_customers") {
        let query = supabase
          .from("customers")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true)
          .or("email.is.null,phone.is.null");
        if (!isAdmin) query = query.eq("user_id", user.id);
        const { count: c } = await query;
        count = c || 0;
      } else if (config.popup_key === "draft_proformas") {
        let query = supabase
          .from("invoices")
          .select("id", { count: "exact", head: true })
          .eq("status", "draft")
          .is("deleted_at", null);
        if (!isAdmin) query = query.eq("user_id", user.id);
        const { count: c } = await query;
        count = c || 0;
      }

      if (count > 0) {
        queue.push({
          config,
          count,
          navigateTo: POPUP_ROUTES[config.popup_key] || "/",
        });
      }
    }

    if (queue.length > 0) {
      setPopupQueue(queue);
      setQueueIndex(0);
      setActivePopup(queue[0]);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    checkPopups();
    const interval = setInterval(checkPopups, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [checkPopups]);

  const handleDismiss = () => {
    const nextIndex = queueIndex + 1;
    if (nextIndex < popupQueue.length) {
      setQueueIndex(nextIndex);
      setActivePopup(popupQueue[nextIndex]);
    } else {
      setActivePopup(null);
    }
  };

  const handleNavigate = () => {
    const route = activePopup?.navigateTo || "/";
    setActivePopup(null);
    navigate(route);
  };

  if (!activePopup) return null;

  return (
    <AlertDialog open={!!activePopup} onOpenChange={(open) => !open && handleDismiss()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              {POPUP_ICONS[activePopup.config.popup_key] || (
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              )}
            </div>
            <AlertDialogTitle className="text-lg">
              {activePopup.config.title}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            {activePopup.config.message}
            <span className="block mt-2 font-semibold text-foreground">
              {activePopup.count} record{activePopup.count > 1 ? "s" : ""} need{activePopup.count === 1 ? "s" : ""} attention.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleDismiss}>Remind Me Later</AlertDialogCancel>
          <AlertDialogAction onClick={handleNavigate}>
            Take Action
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
