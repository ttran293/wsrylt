"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DateDisplay } from "@/components/DateDisplay";
import { YouTubePlayer } from "@/components/YouTubePlayer";
import { useAuth } from "@/components/AuthProvider";
import type { PostPublic } from "@/types";

interface PostModalProps {
  post: PostPublic;
  onClose: () => void;
  onUpdated: () => void;
}

export function PostModal({ post, onClose, onUpdated }: PostModalProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const userLike = post.likes.find((like) => like.byUser._id === user?.userId);

  async function toggleLike() {
    if (!user) {
      router.push("/login");
      return;
    }

    setBusy(true);
    try {
      if (userLike) {
        await fetch(`/api/posts/${post._id}/likes/${userLike._id}`, {
          method: "DELETE",
        });
      } else {
        await fetch(`/api/posts/${post._id}/likes`, { method: "POST" });
      }
      onUpdated();
    } finally {
      setBusy(false);
    }
  }

  async function submitComment(event: React.FormEvent) {
    event.preventDefault();
    if (!user) {
      router.push("/login");
      return;
    }
    if (!comment.trim()) return;

    setBusy(true);
    try {
      await fetch(`/api/posts/${post._id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: comment.trim() }),
      });
      setComment("");
      onUpdated();
    } finally {
      setBusy(false);
    }
  }

  async function deleteComment(commentId: string) {
    setBusy(true);
    try {
      await fetch(`/api/posts/${post._id}/comments/${commentId}`, {
        method: "DELETE",
      });
      onUpdated();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="ui-panel max-h-[90vh] w-full max-w-2xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <h2 className="ui-title text-sm font-medium">post</h2>
          <button type="button" onClick={onClose} className="ui-btn">
            [ x ]
          </button>
        </div>

        <div className="space-y-4 p-4">
          <YouTubePlayer url={post.posturl} />

          {post.caption && <p className="ui-body text-[0.9375rem]">{post.caption}</p>}

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <button
              type="button"
              disabled={busy}
              onClick={toggleLike}
              className={`ui-btn ${userLike ? "ui-btn-accent" : ""}`}
            >
              {userLike ? "♥" : "♡"} {post.likes.length} likes
            </button>
            <span className="ui-meta">
              by {post.creator.name} · <DateDisplay date={post.date} />
            </span>
          </div>

          <div className="space-y-3 border-t border-[var(--border)] pt-4">
            <h3 className="ui-title text-sm font-medium">comments</h3>

            {post.comments.length === 0 ? (
              <p className="ui-muted text-sm">no comments yet.</p>
            ) : (
              <ul className="space-y-3">
                {post.comments.map((item) => (
                  <li
                    key={item._id}
                    className="border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="ui-link no-underline">
                          {item.byUser.name}
                        </span>
                        <p className="mt-1">{item.content}</p>
                        <DateDisplay date={item.date} />
                      </div>
                      {user?.userId === item.byUser._id && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => deleteComment(item._id)}
                          className="ui-btn text-xs text-red-400"
                        >
                          [ delete ]
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <form onSubmit={submitComment} className="flex gap-2">
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={user ? "write a comment..." : "log in to comment"}
                disabled={!user || busy}
                className="ui-input flex-1 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!user || busy || !comment.trim()}
                className="ui-btn ui-btn-accent"
              >
                [ post ]
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
