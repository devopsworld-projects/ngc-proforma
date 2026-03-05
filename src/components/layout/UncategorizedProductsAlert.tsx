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
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function UncategorizedProductsAlert() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);

  const checkUncategorized = useCallback(async () => {
    if (!user) return;

    const { count: uncatCount, error } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .eq("user_id", user.id)
      .is("category", null);

    if (!error && uncatCount && uncatCount > 0) {
      setCount(uncatCount);
      setOpen(true);
    }
  }, [user]);

  // Check on mount (every page refresh) and every 5 minutes
  useEffect(() => {
    checkUncategorized();
    const interval = setInterval(checkUncategorized, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [checkUncategorized]);

  const handleGoToProducts = () => {
    setOpen(false);
    navigate("/products");
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <AlertDialogTitle className="text-lg">
              Products Missing Category
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            You have{" "}
            <span className="font-semibold text-foreground">{count}</span>{" "}
            product{count > 1 ? "s" : ""} without a category. Please update{" "}
            {count > 1 ? "them" : "it"} to keep your inventory organized.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Remind Me Later</AlertDialogCancel>
          <AlertDialogAction onClick={handleGoToProducts}>
            Go to Products
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
