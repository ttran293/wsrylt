import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAuth } from "@/lib/auth";
import { Like } from "@/lib/models/Like";
import { MusicPost } from "@/lib/models/MusicPost";
import { Notification } from "@/lib/models/Notification";
import { User } from "@/lib/models/User";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  try {
    const { id } = await context.params;
    await connectDB();

    const existingLike = await Like.findOne({
      byUser: auth.userId,
      toPost: id,
    });

    if (existingLike) {
      return Response.json({
        message: "Already liked.",
        status: "500",
        resultLikeID: existingLike._id.toString(),
      });
    }

    const [user, post] = await Promise.all([
      User.findById(auth.userId),
      MusicPost.findById(id),
    ]);

    if (!user) {
      return Response.json({ error: "User not found." }, { status: 404 });
    }
    if (!post) {
      return Response.json({ error: "Post not found." }, { status: 404 });
    }

    const like = await Like.create({
      byUser: auth.userId,
      toPost: id,
    });

    user.likes.push(like._id);
    post.likes.push(like._id);

    const writes: Promise<unknown>[] = [user.save(), post.save()];
    if (post.creator.toString() !== auth.userId) {
      writes.push(
        Notification.create({
          recipient: post.creator,
          actor: auth.userId,
          type: "like",
          post: id,
        }),
      );
    }

    await Promise.all(writes);

    return Response.json({
      message: "Like added.",
      status: "200",
      resultLikeID: like._id.toString(),
    });
  } catch (error) {
    console.error("Add like error:", error);
    return Response.json({ error: "Could not add like." }, { status: 500 });
  }
}
