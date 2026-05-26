export type MediaProvider = "youtube" | "spotify" | "soundcloud" | "bandcamp";

export type SpotifyMediaType =
  | "track"
  | "album"
  | "playlist"
  | "episode"
  | "show";

export interface ParsedMedia {
  provider: MediaProvider;
  embedUrl: string;
  frameClass: string;
}
