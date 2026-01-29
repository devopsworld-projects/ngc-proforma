import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useIsAdmin } from "./useAdmin";
import type { Json } from "@/integrations/supabase/types";

export interface Invoice {
  id: string;
  invoice_no: string;
  customer_id: string | null;
  date: string;
  e_way_bill_no: string | null;
  supplier_invoice_no: string | null;
  supplier_invoice_date: string | null;
  other_references: string | null;
  billing_address_id: string | null;
  shipping_address_id: string | null;
  subtotal: number;
  discount_percent: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  round_off: number;
  grand_total: number;
  amount_in_words: string | null;
  status: "draft" | "sent" | "paid" | "cancelled";
  is_recurring: boolean;
  recurring_frequency: "weekly" | "monthly" | "quarterly" | "yearly" | null;
  next_invoice_date: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  quote_for?: string | null;
  applied_markup_percent?: number | null;
  customer_snapshot?: Json;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  sl_no: number;
  description: string;
  serial_numbers: string[] | null;
  quantity: number;
  unit: string;
  rate: number;
  discount_percent: number;
  amount: number;
  created_at: string;
}

export function useInvoices() {
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  
  return useQuery({
    queryKey: ["invoices", user?.id, isAdmin],
    queryFn: async () => {
      if (!user) return [];
      
      // Admin sees all invoices with user profile info
      if (isAdmin) {
        const { data, error } = await supabase
          .from("invoices")
          .select("*, customers(name), profiles:user_id(full_name)")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return data;
      }
      
      // Regular user sees only their own invoices
      const { data, error } = await supabase
        .from("invoices")
        .select("*, customers(name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useInvoice(id: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["invoice", id],
    queryFn: async () => {
      if (!id) return null;
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .select("*, customers(*), billing_address:addresses!billing_address_id(*), shipping_address:addresses!shipping_address_id(*)")
        .eq("id", id)
        .maybeSingle();
      if (invoiceError) throw invoiceError;
      if (!invoice) return null;

      const { data: items, error: itemsError } = await supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", id)
        .order("sl_no");
      if (itemsError) throw itemsError;

      return { ...invoice, items: items || [] };
    },
    enabled: !!id && !!user,
  });
}

export function useUpdateInvoiceStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Invoice["status"] }) => {
      const { data, error } = await supabase
        .from("invoices")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice", data.id] });
    },
  });
}

export function useDeleteInvoiceItems() {
  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const { error } = await supabase
        .from("invoice_items")
        .delete()
        .eq("invoice_id", invoiceId);
      if (error) throw error;
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (invoiceId: string) => {
      // First delete invoice items (cascade)
      const { error: itemsError } = await supabase
        .from("invoice_items")
        .delete()
        .eq("invoice_id", invoiceId);
      if (itemsError) throw itemsError;
      
      // Then delete the invoice
      const { error } = await supabase
        .from("invoices")
        .delete()
        .eq("id", invoiceId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (invoice: Omit<Invoice, "id" | "created_at" | "updated_at" | "user_id">) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("invoices")
        .insert({ ...invoice, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...invoice }: Partial<Invoice> & { id: string }) => {
      const { data, error } = await supabase
        .from("invoices")
        .update(invoice)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice", data.id] });
    },
  });
}

export function useNextInvoiceNumber() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["nextInvoiceNumber", user?.id],
    queryFn: async () => {
      if (!user) return "1";
      const { data, error } = await supabase
        .from("invoices")
        .select("invoice_no")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      if (!data || data.length === 0) return "1";
      const lastNo = parseInt(data[0].invoice_no) || 0;
      return String(lastNo + 1);
    },
    enabled: !!user,
  });
}
