import Link from "next/link";
import { format } from "date-fns";
import type { ActivityEvent } from "@/lib/activity";

interface ActivityTickerProps {
  events: ActivityEvent[];
}

function formatTickerTime(date: string): string {
  try {
    return format(new Date(date), "h:mm a");
  } catch {
    return date;
  }
}

function activityMeta(event: ActivityEvent) {
  return `${event.message} · ${formatTickerTime(event.date)}`;
}

export function ActivityTicker({ events }: ActivityTickerProps) {
  const tickerEvents = events.slice(0, 20);

  return (
    <section className="activity-ticker ui-panel mb-8" aria-label="recent activity">
      <div className="flex items-center gap-3 border-b border-border px-4 py-2.5">
        <h2 className="ui-title text-sm font-medium">activity</h2>
        <span className="ui-meta">recent updates</span>
      </div>

      {tickerEvents.length === 0 ? (
        <p className="ui-muted px-4 py-3 text-sm">no activity yet</p>
      ) : (
        <div className="activity-ticker-window">
          <div className="activity-ticker-track">
            <ul className="activity-ticker-list">
              {tickerEvents.map((event) => (
                <li key={event.id} className="activity-ticker-item">
                  <Link href={`/user/${event.user._id}`} className="ui-link">
                    {event.user.name}
                  </Link>
                  <span className="ui-muted"> · {activityMeta(event)}</span>
                </li>
              ))}
            </ul>

            <ul className="activity-ticker-list" aria-hidden="true">
              {tickerEvents.map((event) => (
                <li key={`repeat-${event.id}`} className="activity-ticker-item">
                  <span className="ui-link">{event.user.name}</span>
                  <span className="ui-muted"> · {activityMeta(event)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
