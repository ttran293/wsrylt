import { parseMediaUrl } from "@/lib/media";
import type { MediaProvider } from "@/lib/media";

interface MediaPlayerProps {
  url: string;
  className?: string;
  autoplay?: boolean;
}

const IFRAME_TITLES: Record<MediaProvider, string> = {
  youtube: "YouTube video player",
  spotify: "Spotify embed player",
  soundcloud: "SoundCloud embed player",
  bandcamp: "Bandcamp embed player",
};

const IFRAME_ALLOW: Record<MediaProvider, string> = {
  youtube:
    "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
  spotify:
    "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture",
  soundcloud: "autoplay",
  bandcamp: "autoplay",
};

function withAutoplay(embedUrl: string, autoplay?: boolean): string {
  if (!autoplay) return embedUrl;

  const parsed = new URL(embedUrl);
  parsed.searchParams.set("autoplay", "1");
  return parsed.toString();
}

export function MediaPlayer({ url, className, autoplay }: MediaPlayerProps) {
  const media = parseMediaUrl(url);

  const wrapperClass =
    className ?? media?.frameClass ?? "aspect-video w-full overflow-hidden bg-black";

  if (!media) {
    return <div className={wrapperClass} aria-hidden />;
  }

  const useVideoFrame = media.provider === "youtube";

  return (
    <div
      className={`media-frame ${useVideoFrame ? "video-frame" : ""} ${wrapperClass}`}
    >
      <iframe
        src={withAutoplay(
          media.embedUrl,
          autoplay && media.provider === "youtube",
        )}
        title={IFRAME_TITLES[media.provider]}
        allow={IFRAME_ALLOW[media.provider]}
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen={media.provider !== "bandcamp"}
        loading="lazy"
        className={`media-frame-media h-full w-full border-0 ${useVideoFrame ? "video-frame-media" : ""}`}
      />
      {useVideoFrame && <div className="video-frame-overlay" aria-hidden />}
    </div>
  );
}
