import type { PostPublic } from "@/types";

export type ActivityKind = "post" | "comment" | "like";

export interface ActivityEvent {
  id: string;
  kind: ActivityKind;
  date: string;
  user: { _id: string; name: string };
  message: string;
}

function truncate(text: string, max = 60): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

function objectIdToISO(id: string): string {
  try {
    return new Date(parseInt(id.substring(0, 8), 16) * 1000).toISOString();
  } catch {
    return new Date(0).toISOString();
  }
}

export function buildActivityFromPosts(
  posts: PostPublic[],
  limit = 40,
): ActivityEvent[] {
  const events: ActivityEvent[] = [];

  for (const post of posts) {
    events.push({
      id: `post-${post._id}`,
      kind: "post",
      date: post.date,
      user: { _id: post.creator._id, name: post.creator.name },
      message: post.caption
        ? `shared: ${truncate(post.caption)}`
        : "shared a song",
    });

    for (const comment of post.comments) {
      events.push({
        id: `comment-${comment._id}`,
        kind: "comment",
        date: comment.date,
        user: { _id: comment.byUser._id, name: comment.byUser.name },
        message: `commented: "${truncate(comment.content)}"`,
      });
    }

    for (const like of post.likes) {
      events.push({
        id: `like-${like._id}`,
        kind: "like",
        date: objectIdToISO(like._id),
        user: { _id: like.byUser._id, name: like.byUser.name },
        message: `liked ${post.creator.name}'s post`,
      });
    }
  }

  return events
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}
