import { getTagCounts } from "@/lib/posts";

export async function GET() {
  try {
    const tags = await getTagCounts();
    return Response.json(tags);
  } catch (error) {
    console.error("Get tags error:", error);
    return Response.json(
      { error: "Could not retrieve tags." },
      { status: 500 },
    );
  }
}
