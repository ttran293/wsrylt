import { formatDistanceToNow } from "date-fns";

export function DateDisplay({ date }: { date: string }) {
  try {
    const relative = formatDistanceToNow(new Date(date), { addSuffix: true });
    return <span className="ui-muted text-xs">{relative}</span>;
  } catch {
    return <span className="ui-muted text-xs">{date}</span>;
  }
}
