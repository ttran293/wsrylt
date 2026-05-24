"use client";

import { useCallback, useState } from "react";
import { DateDisplay } from "@/components/DateDisplay";
import { YouTubeQueuePlayer } from "@/components/YouTubeQueuePlayer";
import type { PostPublic } from "@/types";

interface PlayAllBarProps {
  posts: PostPublic[];
  onActivePostChange?: (postId: string | null) => void;
}

const QUEUE_SIZE = 3;

export function PlayAllBar({ posts, onActivePostChange }: PlayAllBarProps) {
  const queue = posts.slice(0, QUEUE_SIZE);
  const [playing, setPlaying] = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const [sessionKey, setSessionKey] = useState(0);

  const currentPost = playing ? queue[trackIndex] : null;

  const stop = useCallback(() => {
    setPlaying(false);
    setTrackIndex(0);
    onActivePostChange?.(null);
  }, [onActivePostChange]);

  const start = useCallback(() => {
    if (queue.length === 0) return;
    setSessionKey((key) => key + 1);
    setTrackIndex(0);
    setPlaying(true);
    onActivePostChange?.(queue[0]._id);
  }, [queue, onActivePostChange]);

  const handleTrackChange = useCallback(
    (index: number) => {
      setTrackIndex(index);
      onActivePostChange?.(queue[index]?._id ?? null);
    },
    [queue, onActivePostChange],
  );

  if (posts.length === 0) return null;

  return (
    <div className="mb-6 space-y-4">
      <div className="ui-panel flex flex-wrap items-center gap-3 p-4">
        {!playing ? (
          <button
            type="button"
            onClick={start}
            disabled={queue.length === 0}
            className="ui-btn ui-btn-accent"
          >
            [ play {Math.min(QUEUE_SIZE, posts.length)} songs ]
          </button>
        ) : (
          <button type="button" onClick={stop} className="ui-btn">
            [ stop ]
          </button>
        )}

        {playing && (
          <p className="ui-muted text-sm">
            song {trackIndex + 1} of {queue.length}
          </p>
        )}
      </div>

      {playing && (
        <div className="ui-panel ui-active overflow-hidden">
          <YouTubeQueuePlayer
            key={sessionKey}
            urls={queue.map((post) => post.posturl)}
            autoplay
            onTrackChange={handleTrackChange}
            onComplete={stop}
          />
          {currentPost && (
            <div className="space-y-1 border-t border-[var(--border)] p-4">
              <p className="text-sm">
                {currentPost.caption || (
                  <span className="ui-muted italic">no caption</span>
                )}
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="ui-link no-underline">
                  {currentPost.creator.name}
                </span>
                <DateDisplay date={currentPost.date} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
