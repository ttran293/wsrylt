import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { getPostsByUserId, serializePost } from "@/lib/posts";
import {
  getCommentsByUserId,
  getLikesByUserId,
  serializeUserComments,
  serializeUserLikes,
} from "@/lib/user-activity";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    await connectDB();
    const user = await User.findById(id).select(
      "name information imageUrl datejoin",
    );

    if (!user) {
      return Response.json({ error: "User not found." }, { status: 404 });
    }

    const [posts, rawLikes, rawComments] = await Promise.all([
      getPostsByUserId(id),
      getLikesByUserId(id),
      getCommentsByUserId(id),
    ]);

    return Response.json({
      user: {
        _id: user._id.toString(),
        name: user.name,
        information: user.information,
        imageUrl: user.imageUrl,
        datejoin: user.datejoin,
      },
      posts: posts.map(serializePost),
      likes: serializeUserLikes(rawLikes as Record<string, unknown>[]),
      comments: serializeUserComments(rawComments as Record<string, unknown>[]),
    });
  } catch (error) {
    console.error("Get user error:", error);
    return Response.json({ error: "Could not retrieve user." }, { status: 500 });
  }
}
