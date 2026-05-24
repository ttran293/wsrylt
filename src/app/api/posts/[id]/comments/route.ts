import { NextRequest } from "next/server";
import { formatISO } from "date-fns";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { requireAuth } from "@/lib/auth";
import { MusicPost } from "@/lib/models/MusicPost";
import { Comment } from "@/lib/models/Comment";
import { User } from "@/lib/models/User";

type RouteContext = { params: Promise<{ id: string }> };

const commentSchema = z.object({
  content: z.string().trim().min(1, "Comment cannot be empty."),
});

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = commentSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 422 },
      );
    }

    await connectDB();

    const post = await MusicPost.findById(id);
    const commenter = await User.findById(auth.userId);

    if (!post) {
      return Response.json({ error: "Post not found." }, { status: 404 });
    }
    if (!commenter) {
      return Response.json({ error: "User not found." }, { status: 404 });
    }

    const comment = await Comment.create({
      byUser: auth.userId,
      content: parsed.data.content,
      date: formatISO(new Date()),
      onPost: id,
    });

    commenter.comments.push(comment._id);
    post.comments.push(comment._id);
    await Promise.all([commenter.save(), post.save()]);

    return Response.json({
      message: "Comment added.",
      status: "200",
      resultCommentID: comment._id.toString(),
    });
  } catch (error) {
    console.error("Add comment error:", error);
    return Response.json(
      { error: "Could not add comment." },
      { status: 500 },
    );
  }
}
