export { parseYouTubeUrl, toEmbedUrl } from "./youtube-utils";

export interface YouTubeSearchResult {
  videoId: string;
  title: string;
  thumbnail: string;
}

export async function searchYouTube(
  query: string,
): Promise<YouTubeSearchResult[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("YouTube search is not configured.");
  }

  const params = new URLSearchParams({
    part: "snippet",
    q: query,
    type: "video",
    maxResults: "8",
    key: apiKey,
  });

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?${params.toString()}`,
  );

  if (!response.ok) {
    throw new Error("YouTube search failed.");
  }

  const data = (await response.json()) as {
    items?: Array<{
      id: { videoId?: string };
      snippet: {
        title: string;
        thumbnails: { medium?: { url: string }; default?: { url: string } };
      };
    }>;
  };

  return (data.items ?? [])
    .filter((item) => item.id.videoId)
    .map((item) => ({
      videoId: item.id.videoId!,
      title: item.snippet.title,
      thumbnail:
        item.snippet.thumbnails.medium?.url ??
        item.snippet.thumbnails.default?.url ??
        "",
    }));
}
