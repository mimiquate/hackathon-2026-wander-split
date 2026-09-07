"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { User } from "@prisma/client";
import { LockedOverlay } from "./LockedOverlay";

export interface SessionWatcherProps {
  user: User;
  children: ReactNode;
}

export function SessionWatcher({ user, children }: SessionWatcherProps) {
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/session");
        const session = await response.json();

        if (mounted && !session?.user) {
          setIsLocked(true);
        }
      } catch (error) {
        console.error("Session check failed:", error);
      }
    };

    // Initial check
    checkSession();

    // Poll every ~20 seconds
    const interval = setInterval(checkSession, 20000);

    // Check on visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkSession();
      }
    };

    // Check on focus
    const handleFocus = () => {
      checkSession();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      mounted = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  if (isLocked) {
    return (
      <div className="relative">
        <div className="blur-sm pointer-events-none">{children}</div>
        <div className="absolute inset-0 flex items-center justify-center">
          <LockedOverlay
            email={user.email}
            onUnlock={() => setIsLocked(false)}
          />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
