"use client";

import { useEffect, useRef, useState } from "react";
import { parseYouTubeUrl } from "@/lib/youtube-client";

interface YouTubeQueuePlayerProps {
  urls: string[];
  autoplay?: boolean;
  onTrackChange?: (index: number) => void;
  onComplete?: () => void;
  className?: string;
}

type YouTubePlayerInstance = {
  destroy: () => void;
  loadVideoById: (videoId: string) => void;
  playVideo: () => void;
};

type YouTubeApi = {
  Player: new (
    elementId: string,
    options: {
      videoId?: string;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: () => void;
        onStateChange?: (event: { data: number }) => void;
      };
    },
  ) => YouTubePlayerInstance;
  PlayerState: { ENDED: number; CUED: number };
};

declare global {
  interface Window {
    YT?: YouTubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiReadyPromise: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();

  if (!apiReadyPromise) {
    apiReadyPromise = new Promise((resolve) => {
      if (window.YT?.Player) {
        resolve();
        return;
      }

      const previousCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previousCallback?.();
        resolve();
      };

      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
    });
  }

  return apiReadyPromise;
}

function destroyPlayer(
  player: YouTubePlayerInstance | null,
  mount: HTMLDivElement | null,
) {
  try {
    player?.destroy();
  } catch {
    // YouTube may have already replaced the mount node.
  }

  if (mount) {
    mount.innerHTML = "";
    mount.removeAttribute("id");
  }
}

function toVideoIds(urls: string[]): string[] {
  return urls
    .map((url) => parseYouTubeUrl(url))
    .filter((id): id is string => id !== null);
}

export function YouTubeQueuePlayer({
  urls,
  autoplay = false,
  onTrackChange,
  onComplete,
  className,
}: YouTubeQueuePlayerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayerInstance | null>(null);
  const trackIndexRef = useRef(0);
  const videoIdsRef = useRef<string[]>([]);
  const onTrackChangeRef = useRef(onTrackChange);
  const onCompleteRef = useRef(onComplete);
  const [trackIndex, setTrackIndex] = useState(0);

  onTrackChangeRef.current = onTrackChange;
  onCompleteRef.current = onComplete;
  videoIdsRef.current = toVideoIds(urls);

  const wrapperClass =
    className ?? "aspect-video w-full overflow-hidden rounded-xl bg-black";

  const playTrack = (player: YouTubePlayerInstance, index: number) => {
    const videoId = videoIdsRef.current[index];
    if (!videoId) return;

    trackIndexRef.current = index;
    setTrackIndex(index);
    onTrackChangeRef.current?.(index);
    player.loadVideoById(videoId);
    player.playVideo();
  };

  useEffect(() => {
    const mount = mountRef.current;
    const videoIds = toVideoIds(urls);
    const firstVideoId = videoIds[0];
    if (!mount || !firstVideoId) return;

    let cancelled = false;
    const elementId = "yt-queue-player-mount";
    mount.id = elementId;
    trackIndexRef.current = 0;
    setTrackIndex(0);

    loadYouTubeApi().then(() => {
      if (cancelled || !window.YT?.Player) return;

      playerRef.current = new window.YT.Player(elementId, {
        videoId: firstVideoId,
        playerVars: {
          autoplay: autoplay ? 1 : 0,
          rel: 0,
          modestbranding: 1,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            if (autoplay && playerRef.current) {
              playerRef.current.playVideo();
            }
          },
          onStateChange: (event) => {
            if (event.data !== window.YT?.PlayerState.ENDED) return;

            const nextIndex = trackIndexRef.current + 1;
            const ids = videoIdsRef.current;

            if (nextIndex < ids.length && playerRef.current) {
              playTrack(playerRef.current, nextIndex);
              return;
            }

            onCompleteRef.current?.();
          },
        },
      });
    });

    return () => {
      cancelled = true;
      destroyPlayer(playerRef.current, mountRef.current);
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (videoIdsRef.current.length === 0) {
    return <div className={wrapperClass} aria-hidden />;
  }

  return (
    <div className={wrapperClass} data-track={trackIndex + 1}>
      <div ref={mountRef} className="h-full w-full" />
    </div>
  );
}
