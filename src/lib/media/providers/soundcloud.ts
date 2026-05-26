import type { ParsedMedia } from "../types";

const SOUNDCLOUD_PAGE_PATTERN =
  /^https?:\/\/(?:www\.)?soundcloud\.com\/([\w-]+)\/(?!likes(?:\/|$)|following(?:\/|$)|followers(?:\/|$))([\w-]+(?:\/[\w-]+)?)/i;

const SOUNDCLOUD_EMBED_PATTERN =
  /^https?:\/\/w\.soundcloud\.com\/player\/\?/i;

function soundCloudFrameClass(pageUrl: string): string {
  return pageUrl.includes("/sets/")
    ? "h-[450px] w-full overflow-hidden bg-[#f2f2f2]"
    : "h-[166px] w-full overflow-hidden bg-[#f2f2f2]";
}

export function toSoundCloudEmbedUrl(pageUrl: string): string {
  const params = new URLSearchParams({
    url: pageUrl,
    color: "%23ff5500",
    auto_play: "false",
    hide_related: "true",
    show_comments: "false",
    show_user: "true",
    show_reposts: "false",
    visual: "false",
  });

  return `https://w.soundcloud.com/player/?${params.toString()}`;
}

function parseSoundCloudPageUrl(url: string): ParsedMedia | null {
  const trimmed = url.trim();
  const match = trimmed.match(SOUNDCLOUD_PAGE_PATTERN);
  if (!match) return null;

  const pageUrl = trimmed.split("?")[0] ?? trimmed;

  return {
    provider: "soundcloud",
    embedUrl: toSoundCloudEmbedUrl(pageUrl),
    frameClass: soundCloudFrameClass(pageUrl),
  };
}

function parseSoundCloudEmbedUrl(url: string): ParsedMedia | null {
  if (!SOUNDCLOUD_EMBED_PATTERN.test(url.trim())) return null;

  const parsed = new URL(url.trim());
  const pageUrl = parsed.searchParams.get("url");

  return {
    provider: "soundcloud",
    embedUrl: url.trim(),
    frameClass: soundCloudFrameClass(pageUrl ?? url),
  };
}

export function parseSoundCloudMedia(url: string): ParsedMedia | null {
  return parseSoundCloudEmbedUrl(url) ?? parseSoundCloudPageUrl(url);
}
