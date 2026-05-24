import { parseYouTubeUrl, toEmbedUrl } from "@/lib/youtube-client";

interface YouTubePlayerProps {
  url: string;
  className?: string;
  autoplay?: boolean;
}

export function YouTubePlayer({ url, className, autoplay }: YouTubePlayerProps) {
  const videoId = parseYouTubeUrl(url);

  const wrapperClass =
    className ?? "aspect-video w-full overflow-hidden bg-black";

  if (!videoId) {
    return <div className={wrapperClass} aria-hidden />;
  }

  return (
    <div className={wrapperClass}>
      <iframe
        src={toEmbedUrl(videoId, { autoplay })}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        className="h-full w-full border-0"
      />
    </div>
  );
}
