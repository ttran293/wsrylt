import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAuth } from "@/lib/auth";
import { Like } from "@/lib/models/Like";
import { MusicPost } from "@/lib/models/MusicPost";
import { Notification } from "@/lib/models/Notification";
import { User } from "@/lib/models/User";

type RouteContext = {
  params: Promise<{ id: string; likeId: string }>;
};

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  try {
    const { id, likeId } = await context.params;
    await connectDB();

    const like = await Like.findById(likeId);
    if (!like) {
      return Response.json({ error: "Like not found." }, { status: 404 });
    }

    if (like.byUser.toString() !== auth.userId) {
      return Response.json(
        { error: "You are not allowed to remove this like." },
        { status: 401 },
      );
    }

    await Like.findByIdAndDelete(likeId);

    await User.findByIdAndUpdate(auth.userId, {
      $pull: { likes: likeId },
    });
    await MusicPost.findByIdAndUpdate(id, {
      $pull: { likes: likeId },
    });
    await Notification.deleteMany({
      actor: auth.userId,
      type: "like",
      post: id,
    });

    return Response.json({ message: "Like removed.", status: "200" });
  } catch (error) {
    console.error("Delete like error:", error);
    return Response.json({ error: "Could not remove like." }, { status: 500 });
  }
}
