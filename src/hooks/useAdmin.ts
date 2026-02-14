import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface UserStats {
  user_id: string;
  full_name: string | null;
  email: string;
  created_at: string;
  is_admin: boolean;
  invoice_count: number;
  total_revenue: number;
  customer_count: number;
  is_approved: boolean;
  email_confirmed_at: string | null;
}

export interface UserInvoice {
  id: string;
  invoice_no: string;
  date: string;
  status: string;
  grand_total: number;
  customer_name: string | null;
  created_at: string;
}

export function useIsAdmin() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["isAdmin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (error) return false;
      return !!data;
    },
    enabled: !!user,
  });
}

export function useAdminUserStats() {
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  
  return useQuery({
    queryKey: ["adminUserStats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_user_stats");
      if (error) throw error;
      return data as UserStats[];
    },
    enabled: !!user && isAdmin === true,
  });
}

export function useAdminUserInvoices(userId: string | null) {
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  
  return useQuery({
    queryKey: ["adminUserInvoices", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase.rpc("get_user_invoices_admin", {
        target_user_id: userId,
      });
      if (error) throw error;
      return data as UserInvoice[];
    },
    enabled: !!user && isAdmin === true && !!userId,
  });
}

export function useToggleAdminRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, makeAdmin }: { userId: string; makeAdmin: boolean }) => {
      const { data, error } = await supabase.rpc("toggle_admin_role", {
        target_user_id: userId,
        make_admin: makeAdmin,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUserStats"] });
    },
  });
}

export function useApproveUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, approved }: { userId: string; approved: boolean }) => {
      // Use type assertion since the function was just created
      const { data, error } = await (supabase.rpc as any)("approve_user", {
        target_user_id: userId,
        approved,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUserStats"] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("admin-delete-user", {
        body: { targetUserId: userId },
      });
      
      if (response.error) {
        throw new Error(response.error.message || "Failed to delete user");
      }
      
      const result = response.data;
      if (!result.success) {
        throw new Error(result.error || "Failed to delete user");
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUserStats"] });
    },
  });
}

export function useUserApprovalStatus() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["userApprovalStatus", user?.id],
    queryFn: async () => {
      if (!user) return { is_approved: false, email_confirmed: false };
      
      // Use type assertion for the new column
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      if (error) return { is_approved: false, email_confirmed: false };
      
      // Check if email is confirmed from auth metadata
      const emailConfirmed = !!user.email_confirmed_at;
      
      return { 
        is_approved: (data as any)?.is_approved ?? false,
        email_confirmed: emailConfirmed
      };
    },
    enabled: !!user,
  });
}
