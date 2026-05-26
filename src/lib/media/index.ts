import { parseBandcampMedia, resolveBandcampMedia } from "./providers/bandcamp";
import { parseSoundCloudMedia } from "./providers/soundcloud";
import { parseSpotifyMedia } from "./providers/spotify";
import { parseYouTubeMedia } from "./providers/youtube";
import type { MediaProvider, ParsedMedia } from "./types";

export type { MediaProvider, ParsedMedia, SpotifyMediaType } from "./types";
export { isBandcampPageUrl } from "./providers/bandcamp";

export function parseMediaUrl(url: string): ParsedMedia | null {
  return (
    parseYouTubeMedia(url) ??
    parseSpotifyMedia(url) ??
    parseSoundCloudMedia(url) ??
    parseBandcampMedia(url)
  );
}

export async function resolveMediaUrl(url: string): Promise<ParsedMedia | null> {
  const parsed = parseMediaUrl(url);
  if (parsed) return parsed;

  return resolveBandcampMedia(url);
}

export function getMediaProvider(url: string): MediaProvider | null {
  return parseMediaUrl(url)?.provider ?? null;
}
