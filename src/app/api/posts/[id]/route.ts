import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { requireAuth } from "@/lib/auth";
import { MusicPost } from "@/lib/models/MusicPost";
import { User } from "@/lib/models/User";
import { Comment } from "@/lib/models/Comment";
import { Like } from "@/lib/models/Like";
import { Notification } from "@/lib/models/Notification";
import { getPostById, serializePost } from "@/lib/posts";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const post = await getPostById(id);

    if (!post) {
      return Response.json({ error: "Post not found." }, { status: 404 });
    }

    return Response.json(serializePost(post));
  } catch (error) {
    console.error("Get post error:", error);
    return Response.json({ error: "Could not retrieve post." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  try {
    const { id } = await context.params;
    await connectDB();

    const post = await MusicPost.findById(id).populate("creator");
    if (!post) {
      return Response.json({ error: "Post not found." }, { status: 404 });
    }

    if (post.creator._id.toString() !== auth.userId) {
      return Response.json(
        { error: "You are not allowed to delete this post." },
        { status: 401 },
      );
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const [commentIds, likeIds] = await Promise.all([
        Comment.find({ onPost: id }).distinct("_id").session(session),
        Like.find({ toPost: id }).distinct("_id").session(session),
      ]);

      await Notification.deleteMany({ post: id }, { session });
      await Comment.deleteMany({ onPost: id }, { session });
      await Like.deleteMany({ toPost: id }, { session });

      await User.updateMany(
        {},
        {
          $pull: {
            posts: id,
            comments: { $in: commentIds },
            likes: { $in: likeIds },
          },
        },
        { session },
      );

      await MusicPost.findByIdAndDelete(id, { session });

      const creator = await User.findById(auth.userId).session(session);
      if (creator) {
        creator.posts = creator.posts.filter(
          (postId) => postId.toString() !== id,
        );
        await creator.save({ session });
      }

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

    return Response.json({ message: "Deleted post.", status: "200" });
  } catch (error) {
    console.error("Delete post error:", error);
    return Response.json(
      { error: "Could not delete post." },
      { status: 500 },
    );
  }
}
