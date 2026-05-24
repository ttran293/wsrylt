import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { getPostsByUserId, serializePost } from "@/lib/posts";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    await connectDB();
    const user = await User.findById(id).select("name information datejoin");

    if (!user) {
      return Response.json({ error: "User not found." }, { status: 404 });
    }

    const posts = await getPostsByUserId(id);

    return Response.json({
      user: {
        _id: user._id.toString(),
        name: user.name,
        information: user.information,
        datejoin: user.datejoin,
      },
      posts: posts.map(serializePost),
    });
  } catch (error) {
    console.error("Get user error:", error);
    return Response.json({ error: "Could not retrieve user." }, { status: 500 });
  }
}
