import { parseYouTubeUrl, toEmbedUrl } from "@/lib/youtube-utils";
import type { ParsedMedia } from "../types";

export function parseYouTubeMedia(url: string): ParsedMedia | null {
  const videoId = parseYouTubeUrl(url);
  if (!videoId) return null;

  return {
    provider: "youtube",
    embedUrl: toEmbedUrl(videoId),
    frameClass: "aspect-video w-full overflow-hidden bg-black",
  };
}
