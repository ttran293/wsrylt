import Link from "next/link";
import { format } from "date-fns";
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
  return (
    <aside
      className={`activity-timeline ui-panel sticky top-20 max-h-[calc(100vh-8rem)] overflow-y-auto ${className}`}
    >
      <h2 className="ui-title border-b border-[var(--border)] px-5 py-3.5 text-sm font-medium">
        activity
      </h2>

      {events.length === 0 ? (
        <p className="ui-muted px-5 py-6 text-sm">no activity yet</p>
      ) : (
        <ul className="divide-y divide-[var(--border)]">
          {events.map((event) => (
            <li key={event.id} className="activity-row px-5 py-3.5">
              <div className="flex gap-3">
                <time
                  className="ui-meta w-[4.5rem] shrink-0 tabular-nums"
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
    </aside>
  );
}
