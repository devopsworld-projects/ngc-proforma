import { useState, useEffect, createContext, useContext } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Utility to parse user agent
function parseUserAgent(userAgent: string): {
  browser: string;
  os: string;
  deviceType: string;
} {
  let browser = "Unknown";
  if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Edg")) browser = "Edge";
  else if (userAgent.includes("Chrome")) browser = "Chrome";
  else if (userAgent.includes("Safari")) browser = "Safari";
  else if (userAgent.includes("Opera")) browser = "Opera";
  
  let os = "Unknown";
  if (userAgent.includes("Windows")) os = "Windows";
  else if (userAgent.includes("Mac")) os = "macOS";
  else if (userAgent.includes("Linux")) os = "Linux";
  else if (userAgent.includes("Android")) os = "Android";
  else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) os = "iOS";
  
  let deviceType = "Desktop";
  if (userAgent.includes("Mobile") || userAgent.includes("Android")) deviceType = "Mobile";
  else if (userAgent.includes("Tablet") || userAgent.includes("iPad")) deviceType = "Tablet";
  
  return { browser, os, deviceType };
}

// Track session via edge function to capture IP address
async function trackUserSession(userId: string) {
  const userAgent = navigator.userAgent;
  const { browser, os, deviceType } = parseUserAgent(userAgent);
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await supabase.functions.invoke("track-session", {
      body: { 
        userAgent,
        browser,
        os,
        deviceType,
      },
    });
  } catch (error) {
    console.error("Failed to track session:", error);
  }
}

// Track if we already tracked the current session (module-level to avoid hook issues)
let sessionTracked = false;

export function useAuthProvider(): AuthContextType {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
        
        // Track session on sign in
        if (event === "SIGNED_IN" && session?.user && !sessionTracked) {
          sessionTracked = true;
          // Defer to avoid blocking auth flow
          setTimeout(() => trackUserSession(session.user.id), 100);
        }
        
        if (event === "SIGNED_OUT") {
          sessionTracked = false;
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    user,
    session,
    isLoading,
    signUp,
    signIn,
    signOut,
  };
}

export { AuthContext };
