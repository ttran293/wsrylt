import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { resolveMediaUrl } from "@/lib/media";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  const url = request.nextUrl.searchParams.get("url")?.trim();
  if (!url) {
    return Response.json({ error: "URL is required." }, { status: 422 });
  }

  try {
    const media = await resolveMediaUrl(url);
    if (!media) {
      return Response.json(
        { error: "Could not resolve this music link." },
        { status: 422 },
      );
    }

    return Response.json({
      provider: media.provider,
      embedUrl: media.embedUrl,
    });
  } catch (error) {
    console.error("Media resolve error:", error);
    return Response.json(
      { error: "Could not resolve this music link." },
      { status: 500 },
    );
  }
}
