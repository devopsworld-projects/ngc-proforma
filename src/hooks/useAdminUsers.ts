import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useIsAdmin } from "./useAdmin";

export interface UserSession {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  ip_address: string | null;
  user_agent: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  logged_in_at: string;
  is_active: boolean;
}

export function useAdminCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ email, password, fullName }: { 
      email: string; 
      password: string; 
      fullName?: string;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("admin-create-user", {
        body: { email, password, fullName },
      });
      
      if (response.error) {
        throw new Error(response.error.message || "Failed to create user");
      }
      
      const result = response.data;
      if (!result.success) {
        throw new Error(result.error || "Failed to create user");
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUserStats"] });
    },
  });
}

export function useAdminUserSessions(targetUserId?: string | null) {
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  
  return useQuery({
    queryKey: ["adminUserSessions", targetUserId],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_admin_user_sessions", {
        target_user_id: targetUserId || null,
      });
      
      if (error) throw error;
      return data as UserSession[];
    },
    enabled: !!user && isAdmin === true,
  });
}

// Utility to parse user agent string
export function parseUserAgent(userAgent: string | null): {
  browser: string;
  os: string;
  deviceType: string;
} {
  if (!userAgent) {
    return { browser: "Unknown", os: "Unknown", deviceType: "Unknown" };
  }
  
  // Detect browser
  let browser = "Unknown";
  if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Edg")) browser = "Edge";
  else if (userAgent.includes("Chrome")) browser = "Chrome";
  else if (userAgent.includes("Safari")) browser = "Safari";
  else if (userAgent.includes("Opera")) browser = "Opera";
  
  // Detect OS
  let os = "Unknown";
  if (userAgent.includes("Windows")) os = "Windows";
  else if (userAgent.includes("Mac")) os = "macOS";
  else if (userAgent.includes("Linux")) os = "Linux";
  else if (userAgent.includes("Android")) os = "Android";
  else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) os = "iOS";
  
  // Detect device type
  let deviceType = "Desktop";
  if (userAgent.includes("Mobile") || userAgent.includes("Android")) deviceType = "Mobile";
  else if (userAgent.includes("Tablet") || userAgent.includes("iPad")) deviceType = "Tablet";
  
  return { browser, os, deviceType };
}

// Hook to track current session on login
export function useTrackSession() {
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      
      const userAgent = navigator.userAgent;
      const { browser, os, deviceType } = parseUserAgent(userAgent);
      
      const { error } = await supabase
        .from("user_sessions")
        .insert({
          user_id: user.id,
          user_agent: userAgent,
          browser,
          os,
          device_type: deviceType,
          // Note: IP address needs to be captured server-side or via an external API
          ip_address: null,
        });
      
      if (error) throw error;
    },
  });
}
