import type { ParsedMedia } from "../types";

const BANDCAMP_EMBED_PATTERN = /bandcamp\.com\/EmbeddedPlayer\//i;

const BANDCAMP_PAGE_PATTERN =
  /^https?:\/\/(?:[\w-]+\.)?bandcamp\.com\/(track|album)\/[\w-]+/i;

function bandcampFrameClass(embedUrl: string): string {
  if (embedUrl.includes("album=") || /tracklist=(?!false)/.test(embedUrl)) {
    return "h-[472px] w-full overflow-hidden bg-[#fafafa]";
  }

  return "h-[120px] w-full overflow-hidden bg-[#fafafa]";
}

function normalizeBandcampEmbedUrl(embedUrl: string): string {
  const trimmed = embedUrl.trim().replace(/&amp;/g, "&");
  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  if (trimmed.startsWith("http://")) {
    return `https://${trimmed.slice("http://".length)}`;
  }

  if (trimmed.startsWith("https://")) {
    return trimmed;
  }

  return `https://bandcamp.com/${trimmed.replace(/^\/+/, "")}`;
}

export function isBandcampPageUrl(url: string): boolean {
  return BANDCAMP_PAGE_PATTERN.test(url.trim());
}

export function parseBandcampMedia(url: string): ParsedMedia | null {
  const trimmed = url.trim();
  if (!BANDCAMP_EMBED_PATTERN.test(trimmed)) return null;

  const embedUrl = normalizeBandcampEmbedUrl(trimmed);

  return {
    provider: "bandcamp",
    embedUrl,
    frameClass: bandcampFrameClass(embedUrl),
  };
}

export async function resolveBandcampMedia(
  url: string,
): Promise<ParsedMedia | null> {
  const existing = parseBandcampMedia(url);
  if (existing) return existing;

  if (!isBandcampPageUrl(url)) return null;

  try {
    const response = await fetch(url.trim(), {
      headers: {
        "User-Agent": "music-blog-v3/1.0",
        Accept: "text/html",
      },
      redirect: "follow",
    });

    if (!response.ok) return null;

    const html = await response.text();
    const ogVideoMatch = html.match(
      /property="og:video"\s+content="([^"]+)"/i,
    );
    const embedMatch = html.match(
      /(https?:\/\/bandcamp\.com\/EmbeddedPlayer\/[^"'<\s]+)/i,
    );

    const candidate = ogVideoMatch?.[1] ?? embedMatch?.[1];
    if (!candidate) return null;

    return parseBandcampMedia(normalizeBandcampEmbedUrl(candidate));
  } catch {
    return null;
  }
}
