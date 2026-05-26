"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DateDisplay } from "@/components/DateDisplay";
import { MediaPlayer } from "@/components/MediaPlayer";
import { useAuth } from "@/components/AuthProvider";
import type { PostPublic } from "@/types";

interface PostCardProps {
  post: PostPublic;
  showDelete?: boolean;
  onUpdated?: () => void;
  onOpen?: (post: PostPublic) => void;
}

export function PostCard({
  post,
  showDelete = false,
  onUpdated,
  onOpen,
}: PostCardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [caption, setCaption] = useState(post.caption);
  const [editingCaption, setEditingCaption] = useState(false);
  const [busy, setBusy] = useState(false);

  const userLike = post.likes.find((like) => like.byUser._id === user?.userId);
  const isOwner = user?.userId === post.creator._id;

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
      onUpdated?.();
    } finally {
      setBusy(false);
    }
  }

  async function saveCaption() {
    setBusy(true);
    try {
      await fetch(`/api/posts/${post._id}/caption`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption }),
      });
      setEditingCaption(false);
      onUpdated?.();
    } finally {
      setBusy(false);
    }
  }

  async function deletePost() {
    if (!confirm("Delete this post?")) return;
    setBusy(true);
    try {
      await fetch(`/api/posts/${post._id}`, { method: "DELETE" });
      onUpdated?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="ui-panel flex h-full flex-col overflow-hidden transition-colors">
      <div className="block w-full shrink-0">
        <MediaPlayer url={post.posturl} />
      </div>

      <div className="flex flex-1 flex-col border-t border-[var(--border)] p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {editingCaption && isOwner ? (
              <div className="space-y-2">
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="ui-input"
                  rows={2}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={saveCaption}
                    className="ui-btn ui-btn-accent"
                  >
                    [ save ]
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCaption(post.caption);
                      setEditingCaption(false);
                    }}
                    className="ui-btn"
                  >
                    [ cancel ]
                  </button>
                </div>
              </div>
            ) : (
              <p className="ui-body text-[0.9375rem]">
                {post.caption || (
                  <span className="ui-muted italic">no caption</span>
                )}
              </p>
            )}
          </div>
          {isOwner && !editingCaption && (
            <button
              type="button"
              onClick={() => setEditingCaption(true)}
              className="ui-btn shrink-0 text-xs"
            >
              [ edit ]
            </button>
          )}
        </div>

        <div className="mt-auto">
          <div className="ui-meta flex flex-wrap items-center justify-between gap-2 pb-3">
            <Link href={`/user/${post.creator._id}`} className="ui-link">
              {post.creator.name}
            </Link>
            <DateDisplay date={post.date} />
          </div>

          <div className="flex items-center gap-3 border-t border-[var(--border)] pt-4 text-sm">
          <button
            type="button"
            disabled={busy}
            onClick={toggleLike}
            className={`ui-btn ${userLike ? "ui-btn-accent" : ""}`}
          >
            {userLike ? "♥" : "♡"} {post.likes.length}
          </button>
          <button type="button" onClick={() => onOpen?.(post)} className="ui-btn">
            💬 {post.comments.length}
          </button>
          {showDelete && isOwner && (
            <button
              type="button"
              disabled={busy}
              onClick={deletePost}
              className="ui-btn ml-auto text-red-400"
            >
              [ delete ]
            </button>
          )}
          </div>
        </div>
      </div>
    </article>
  );
}
