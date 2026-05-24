import getYouTubeId from "get-youtube-id";

export function parseYouTubeUrl(url: string): string | null {
  const id = getYouTubeId(url);
  return id ?? null;
}

export function toEmbedUrl(
  videoId: string,
  options?: { autoplay?: boolean },
): string {
  const params = new URLSearchParams();
  if (options?.autoplay) {
    params.set("autoplay", "1");
  }
  const query = params.toString();
  return query
    ? `https://www.youtube.com/embed/${videoId}?${query}`
    : `https://www.youtube.com/embed/${videoId}`;
}
