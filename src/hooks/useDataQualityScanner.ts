import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useAdmin";

const SCAN_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export interface ScanFinding {
  popup_key: string;
  title: string;
  message: string;
  count: number;
  navigateTo: string;
  severity: "warning" | "info";
}

interface PopupConfig {
  popup_key: string;
  is_enabled: boolean;
  title: string;
  message: string;
}

const ROUTE_MAP: Record<string, string> = {
  uncategorized_products: "/products",
  missing_sku: "/products",
  zero_stock: "/products",
  incomplete_customers: "/customers",
  missing_address: "/customers",
  draft_proformas: "/invoices",
  stale_drafts: "/invoices",
};

const SEVERITY_MAP: Record<string, "warning" | "info"> = {
  uncategorized_products: "warning",
  missing_sku: "info",
  zero_stock: "warning",
  incomplete_customers: "info",
  missing_address: "info",
  draft_proformas: "warning",
  stale_drafts: "warning",
};

async function runScanRule(
  key: string,
  userId: string,
  isAdmin: boolean
): Promise<number> {
  let count = 0;

  switch (key) {
    case "uncategorized_products": {
      let q = supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true)
        .is("category", null);
      if (!isAdmin) q = q.eq("user_id", userId);
      const { count: c } = await q;
      count = c || 0;
      break;
    }
    case "missing_sku": {
      let q = supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true)
        .is("sku", null);
      if (!isAdmin) q = q.eq("user_id", userId);
      const { count: c } = await q;
      count = c || 0;
      break;
    }
    case "zero_stock": {
      let q = supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true)
        .lte("stock_quantity", 0);
      if (!isAdmin) q = q.eq("user_id", userId);
      const { count: c } = await q;
      count = c || 0;
      break;
    }
    case "incomplete_customers": {
      let q = supabase
        .from("customers")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true)
        .or("email.is.null,phone.is.null");
      if (!isAdmin) q = q.eq("user_id", userId);
      const { count: c } = await q;
      count = c || 0;
      break;
    }
    case "missing_address": {
      // Customers with zero addresses
      let q = supabase
        .from("customers")
        .select("id, addresses(id)", { count: "exact" })
        .eq("is_active", true);
      if (!isAdmin) q = q.eq("user_id", userId);
      const { data } = await q;
      count = data?.filter((c: any) => !c.addresses || c.addresses.length === 0).length || 0;
      break;
    }
    case "draft_proformas": {
      let q = supabase
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .eq("status", "draft")
        .is("deleted_at", null);
      if (!isAdmin) q = q.eq("user_id", userId);
      const { count: c } = await q;
      count = c || 0;
      break;
    }
    case "stale_drafts": {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      let q = supabase
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .eq("status", "draft")
        .is("deleted_at", null)
        .lt("created_at", sevenDaysAgo.toISOString());
      if (!isAdmin) q = q.eq("user_id", userId);
      const { count: c } = await q;
      count = c || 0;
      break;
    }
  }

  return count;
}

export function useDataQualityScanner() {
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const [findings, setFindings] = useState<ScanFinding[]>([]);
  const [scanning, setScanning] = useState(false);

  const scan = useCallback(async () => {
    if (!user) return;
    setScanning(true);

    try {
      // Fetch enabled configs
      const { data: configs, error } = await supabase
        .from("popup_settings")
        .select("popup_key, is_enabled, title, message")
        .eq("is_enabled", true);

      if (error || !configs || configs.length === 0) {
        setFindings([]);
        setScanning(false);
        return;
      }

      const results: ScanFinding[] = [];

      // Run all scans in parallel
      const scanPromises = (configs as PopupConfig[]).map(async (config) => {
        const count = await runScanRule(config.popup_key, user.id, !!isAdmin);
        if (count > 0) {
          results.push({
            popup_key: config.popup_key,
            title: config.title,
            message: config.message,
            count,
            navigateTo: ROUTE_MAP[config.popup_key] || "/",
            severity: SEVERITY_MAP[config.popup_key] || "info",
          });
        }
      });

      await Promise.all(scanPromises);

      // Sort: warnings first, then by count desc
      results.sort((a, b) => {
        if (a.severity !== b.severity) return a.severity === "warning" ? -1 : 1;
        return b.count - a.count;
      });

      setFindings(results);
    } catch {
      // Silent fail — don't block the app
    } finally {
      setScanning(false);
    }
  }, [user, isAdmin]);

  // Scan on mount + interval
  useEffect(() => {
    scan();
    const interval = setInterval(scan, SCAN_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [scan]);

  return { findings, scanning, rescan: scan };
}
