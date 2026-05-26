import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { requireAuth } from "@/lib/auth";
import { MusicPost } from "@/lib/models/MusicPost";
import { tagsSchema } from "@/lib/validation/tags";

type RouteContext = { params: Promise<{ id: string }> };

const captionSchema = z.object({
  caption: z.string().max(500),
  tags: tagsSchema.optional(),
});

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = captionSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 422 },
      );
    }

    await connectDB();
    const post = await MusicPost.findById(id).populate("creator");

    if (!post) {
      return Response.json({ error: "Post not found." }, { status: 404 });
    }

    if (post.creator._id.toString() !== auth.userId) {
      return Response.json(
        { error: "You are not allowed to edit this caption." },
        { status: 401 },
      );
    }

    post.caption = parsed.data.caption;
    if (parsed.data.tags !== undefined) {
      post.tags = parsed.data.tags;
    }
    await post.save();

    return Response.json({
      message: "Caption edited.",
      status: "200",
      caption: parsed.data.caption,
      tags: post.tags,
    });
  } catch (error) {
    console.error("Edit caption error:", error);
    return Response.json(
      { error: "Could not update caption." },
      { status: 500 },
    );
  }
}
