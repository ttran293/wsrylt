"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { VisitorStatsPublic } from "@/types";

const HEARTBEAT_INTERVAL_MS = 30 * 1000;
const VISIT_RECORDED_KEY = "music_blog_visit_recorded";

export function VisitorStats() {
  const pathname = usePathname();
  const [stats, setStats] = useState<VisitorStatsPublic | null>(null);
  const [hasError, setHasError] = useState(false);
  const currentPathRef = useRef(pathname || "/");
  const mountedRef = useRef(false);

  const sendHeartbeat = useCallback(async (recordPageview: boolean) => {
    try {
      const response = await fetch("/api/visitors/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: currentPathRef.current,
          recordPageview,
        }),
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Could not update visitor stats.");
      }

      const nextStats = (await response.json()) as VisitorStatsPublic;
      if (mountedRef.current) {
        setStats(nextStats);
        setHasError(false);
      }
    } catch {
      if (mountedRef.current) {
        setHasError(true);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const nextPath = pathname || "/";
    currentPathRef.current = nextPath;

    const shouldRecordVisit =
      window.sessionStorage.getItem(VISIT_RECORDED_KEY) !== "1";

    if (shouldRecordVisit) {
      window.sessionStorage.setItem(VISIT_RECORDED_KEY, "1");
    }

    void sendHeartbeat(shouldRecordVisit);
  }, [pathname, sendHeartbeat]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void sendHeartbeat(false);
      }
    }, HEARTBEAT_INTERVAL_MS);

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void sendHeartbeat(false);
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [sendHeartbeat]);

  if (!stats && hasError) {
    return null;
  }

  return (
    <span className="visitor-stats ui-meta inline-flex items-center gap-1 whitespace-nowrap">
      <span>{stats ? `${stats.totalVisits} visitors` : "checking visits..."}</span>
    </span>
  );
}

export function VisitorLiveCount({ fallback = "live" }: { fallback?: string }) {
  const [stats, setStats] = useState<VisitorStatsPublic | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      try {
        const response = await fetch("/api/visitors/stats", { cache: "no-store" });
        if (!response.ok) return;

        const nextStats = (await response.json()) as VisitorStatsPublic;
        if (!cancelled) {
          setStats(nextStats);
        }
      } catch {
        // Keep the existing live/offline wording if visitor stats are unavailable.
      }
    }

    void loadStats();
    const intervalId = window.setInterval(loadStats, HEARTBEAT_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  return <>{stats ? `${stats.online} live` : fallback}</>;
}
