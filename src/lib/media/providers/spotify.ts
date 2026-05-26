import type { ParsedMedia, SpotifyMediaType } from "../types";

const SPOTIFY_HOST_PATTERN =
  /open\.spotify\.com\/(?:embed\/)?(track|album|playlist|episode|show)\/([a-zA-Z0-9]+)/;

const SPOTIFY_URI_PATTERN =
  /spotify:(track|album|playlist|episode|show):([a-zA-Z0-9]+)/;

const TALL_EMBED_TYPES = new Set<SpotifyMediaType>([
  "album",
  "playlist",
  "show",
]);

function spotifyFrameClass(type: SpotifyMediaType): string {
  if (TALL_EMBED_TYPES.has(type)) {
    return "h-[352px] w-full overflow-hidden bg-[#121212]";
  }

  return "h-[152px] w-full overflow-hidden bg-[#121212]";
}

export function toSpotifyEmbedUrl(type: SpotifyMediaType, id: string): string {
  return `https://open.spotify.com/embed/${type}/${id}`;
}

export function parseSpotifyMedia(url: string): ParsedMedia | null {
  const trimmed = url.trim();
  const hostMatch = trimmed.match(SPOTIFY_HOST_PATTERN);
  const uriMatch = trimmed.match(SPOTIFY_URI_PATTERN);
  const match = hostMatch ?? uriMatch;

  if (!match) return null;

  const type = match[1] as SpotifyMediaType;
  const id = match[2];

  return {
    provider: "spotify",
    embedUrl: toSpotifyEmbedUrl(type, id),
    frameClass: spotifyFrameClass(type),
  };
}
