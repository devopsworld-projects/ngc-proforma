import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface ServiceTicket {
  id: string;
  ticket_no: string;
  customer_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  device_type: string;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  problem_description: string;
  diagnosis: string | null;
  resolution: string | null;
  status: "received" | "diagnosing" | "waiting_parts" | "in_progress" | "completed" | "delivered" | "cancelled";
  received_date: string;
  estimated_completion: string | null;
  completed_date: string | null;
  delivered_date: string | null;
  estimated_cost: number;
  final_cost: number;
  parts_used: string[] | null;
  technician_notes: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  customers?: { name: string; phone: string | null } | null;
}

export function useServiceTickets(status?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["service_tickets", status, user?.id],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase
        .from("service_tickets")
        .select("*, customers(name, phone)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (status && status !== "all") {
        query = query.eq("status", status);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as ServiceTicket[];
    },
    enabled: !!user,
  });
}

export function useServiceTicket(id: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["service_ticket", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("service_tickets")
        .select("*, customers(name, phone)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as ServiceTicket;
    },
    enabled: !!id && !!user,
  });
}

export function useNextTicketNumber() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["nextTicketNumber", user?.id],
    queryFn: async () => {
      if (!user) return "SVC-001";
      const { data, error } = await supabase
        .from("service_tickets")
        .select("ticket_no")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      if (!data || data.length === 0) return "SVC-001";
      
      const lastNo = data[0].ticket_no;
      const match = lastNo.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1]) + 1;
        return `SVC-${String(num).padStart(3, "0")}`;
      }
      return "SVC-001";
    },
    enabled: !!user,
  });
}

export function useCreateServiceTicket() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (ticket: Omit<ServiceTicket, "id" | "created_at" | "updated_at" | "user_id" | "customers">) => {
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("service_tickets")
        .insert({ ...ticket, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service_tickets"] });
      queryClient.invalidateQueries({ queryKey: ["nextTicketNumber"] });
    },
  });
}

export function useUpdateServiceTicket() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...ticket }: Partial<ServiceTicket> & { id: string }) => {
      const { data, error } = await supabase
        .from("service_tickets")
        .update(ticket)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["service_tickets"] });
      queryClient.invalidateQueries({ queryKey: ["service_ticket", data.id] });
    },
  });
}

export function useDeleteServiceTicket() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("service_tickets")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service_tickets"] });
    },
  });
}
