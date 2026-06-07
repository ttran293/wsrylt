"use client";

import Link from "next/link";
import { format } from "date-fns";
import Lenis from "lenis";
import { useEffect, useRef, useState } from "react";
import type { ActivityEvent } from "@/lib/activity";

interface ActivityTimelineProps {
  events: ActivityEvent[];
  className?: string;
}

function formatTime(date: string): string {
  try {
    return format(new Date(date), "h:mm a");
  } catch {
    return date;
  }
}

export function ActivityTimeline({ events, className = "" }: ActivityTimelineProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [usePanelScroll, setUsePanelScroll] = useState(false);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const content = contentRef.current;
    if (!wrapper || !content) return;

    const wrapperElement = wrapper;
    const contentElement = content;
    const desktopQuery = window.matchMedia("(min-width: 1280px)");
    let lenis: Lenis | undefined;

    function syncTimelineScroll() {
      lenis?.destroy();
      lenis = undefined;
      setUsePanelScroll(desktopQuery.matches);

      if (!desktopQuery.matches) return;

      lenis = new Lenis({
        wrapper: wrapperElement,
        content: contentElement,
        lerp: 0.1,
        smoothWheel: true,
        autoRaf: true,
      });
    }

    syncTimelineScroll();
    desktopQuery.addEventListener("change", syncTimelineScroll);

    return () => {
      desktopQuery.removeEventListener("change", syncTimelineScroll);
      lenis?.destroy();
    };
  }, [events.length]);

  return (
    <aside
      className={`activity-timeline ui-panel flex flex-col xl:max-h-[calc(100vh-8rem)] ${className}`}
      data-lenis-prevent={usePanelScroll ? "" : undefined}
    >
      <h2 className="ui-title shrink-0 border-b border-border px-5 py-3.5 text-sm font-medium">
        activity
      </h2>

      <div ref={wrapperRef} className="min-h-0 flex-1 overflow-visible xl:overflow-hidden">
        <div ref={contentRef}>
          {events.length === 0 ? (
            <p className="ui-muted px-5 py-6 text-sm">no activity yet</p>
          ) : (
            <ul className="divide-y divide-border">
              {events.map((event) => (
                <li key={event.id} className="activity-row px-5 py-3.5">
                  <div className="flex gap-3">
                    <time
                      className="ui-meta w-18 shrink-0 tabular-nums"
                      dateTime={event.date}
                    >
                      {formatTime(event.date)}
                    </time>
                    <div className="min-w-0 flex-1">
                      <Link href={`/user/${event.user._id}`} className="ui-link">
                        {event.user.name}
                      </Link>
                      <p
                        className={`mt-1 text-sm leading-relaxed ${
                          event.kind === "post" ? "ui-body" : "ui-meta"
                        }`}
                      >
                        {event.message}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
}
