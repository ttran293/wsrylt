import { NextRequest } from "next/server";
import { searchYouTube } from "@/lib/youtube";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query?.trim()) {
    return Response.json({ error: "Search query is required." }, { status: 422 });
  }

  if (!process.env.YOUTUBE_API_KEY) {
    return Response.json(
      { error: "YouTube search is not configured." },
      { status: 503 },
    );
  }

  try {
    const results = await searchYouTube(query.trim());
    return Response.json(results);
  } catch (error) {
    console.error("YouTube search error:", error);
    return Response.json({ error: "YouTube search failed." }, { status: 500 });
  }
}
