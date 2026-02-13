import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./useAuth";

interface UseSessionTimeoutOptions {
  timeoutMinutes?: number;
  warningMinutes?: number;
}

interface SessionTimeoutState {
  showWarning: boolean;
  remainingSeconds: number;
  totalRemainingSeconds: number;
  timeoutMinutes: number;
  resetTimer: () => void;
}

export function useSessionTimeout({
  timeoutMinutes = 30,
  warningMinutes = 2,
}: UseSessionTimeoutOptions = {}): SessionTimeoutState {
  const { user, signOut } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(warningMinutes * 60);
  const [totalRemainingSeconds, setTotalRemainingSeconds] = useState(timeoutMinutes * 60);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const timeoutMs = timeoutMinutes * 60 * 1000;
  const warningMs = warningMinutes * 60 * 1000;

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningIntervalRef.current) {
      clearInterval(warningIntervalRef.current);
      warningIntervalRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const handleLogout = useCallback(async () => {
    clearTimers();
    setShowWarning(false);
    await signOut();
  }, [signOut, clearTimers]);

  const startWarningCountdown = useCallback(() => {
    setShowWarning(true);
    setRemainingSeconds(warningMinutes * 60);

    // Clear the main countdown
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    warningIntervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          handleLogout();
          return 0;
        }
        return prev - 1;
      });
      setTotalRemainingSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
  }, [warningMinutes, handleLogout]);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    clearTimers();
    setShowWarning(false);
    setRemainingSeconds(warningMinutes * 60);
    setTotalRemainingSeconds(timeoutMinutes * 60);

    if (user) {
      // Start countdown for total remaining time
      countdownIntervalRef.current = setInterval(() => {
        setTotalRemainingSeconds((prev) => {
          if (prev <= 1) return 0;
          return prev - 1;
        });
      }, 1000);

      // Set timeout to show warning
      timeoutRef.current = setTimeout(() => {
        startWarningCountdown();
      }, timeoutMs - warningMs);
    }
  }, [user, timeoutMs, warningMs, clearTimers, startWarningCountdown, warningMinutes, timeoutMinutes]);

  // Track user activity
  useEffect(() => {
    if (!user) {
      clearTimers();
      return;
    }

    const activityEvents = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    // Throttle activity updates to avoid excessive resets
    let throttleTimeout: NodeJS.Timeout | null = null;
    const handleActivity = () => {
      if (throttleTimeout) return;
      
      throttleTimeout = setTimeout(() => {
        throttleTimeout = null;
        // Only reset if warning is not showing
        if (!showWarning) {
          resetTimer();
        }
      }, 1000);
    };

    // Add event listeners
    activityEvents.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Start initial timer
    resetTimer();

    return () => {
      activityEvents.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      if (throttleTimeout) clearTimeout(throttleTimeout);
      clearTimers();
    };
  }, [user, resetTimer, clearTimers, showWarning]);

  return {
    showWarning,
    remainingSeconds,
    totalRemainingSeconds,
    timeoutMinutes,
    resetTimer,
  };
}
