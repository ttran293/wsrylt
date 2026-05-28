import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAuth } from "@/lib/auth";
import { Comment } from "@/lib/models/Comment";
import { MusicPost } from "@/lib/models/MusicPost";
import { Notification } from "@/lib/models/Notification";
import { User } from "@/lib/models/User";

type RouteContext = {
  params: Promise<{ id: string; commentId: string }>;
};

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  try {
    const { id, commentId } = await context.params;
    await connectDB();

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return Response.json({ error: "Comment not found." }, { status: 404 });
    }

    if (comment.byUser.toString() !== auth.userId) {
      return Response.json(
        { error: "You are not allowed to delete this comment." },
        { status: 401 },
      );
    }

    await Comment.findByIdAndDelete(commentId);

    await User.findByIdAndUpdate(auth.userId, {
      $pull: { comments: commentId },
    });
    await MusicPost.findByIdAndUpdate(id, {
      $pull: { comments: commentId },
    });
    await Notification.deleteMany({
      comment: commentId,
      type: "comment",
    });

    return Response.json({ message: "Comment deleted.", status: "200" });
  } catch (error) {
    console.error("Delete comment error:", error);
    return Response.json(
      { error: "Could not delete comment." },
      { status: 500 },
    );
  }
}
