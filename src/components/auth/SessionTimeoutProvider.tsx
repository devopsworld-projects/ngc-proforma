import { createContext, useContext, ReactNode } from "react";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";

interface SessionTimeoutContextType {
  showWarning: boolean;
  remainingSeconds: number;
  totalRemainingSeconds: number;
  timeoutMinutes: number;
  resetTimer: () => void;
}

const SessionTimeoutContext = createContext<SessionTimeoutContextType | null>(null);

export function useSessionTimeoutContext() {
  const context = useContext(SessionTimeoutContext);
  if (!context) {
    // Return default values when outside provider (e.g., login page)
    return {
      showWarning: false,
      remainingSeconds: 0,
      totalRemainingSeconds: 0,
      timeoutMinutes: 30,
      resetTimer: () => {},
    };
  }
  return context;
}

interface SessionTimeoutProviderProps {
  children: ReactNode;
  timeoutMinutes?: number;
  warningMinutes?: number;
}

export function SessionTimeoutProvider({
  children,
  timeoutMinutes = 30,
  warningMinutes = 2,
}: SessionTimeoutProviderProps) {
  const sessionTimeout = useSessionTimeout({ timeoutMinutes, warningMinutes });

  return (
    <SessionTimeoutContext.Provider value={sessionTimeout}>
      {children}
    </SessionTimeoutContext.Provider>
  );
}
