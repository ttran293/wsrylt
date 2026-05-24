import { NextRequest } from "next/server";
import { formatISO } from "date-fns";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { requireAuth } from "@/lib/auth";
import { MusicPost } from "@/lib/models/MusicPost";
import { User } from "@/lib/models/User";
import { getAllPosts, serializePost } from "@/lib/posts";
import { parseYouTubeUrl, toEmbedUrl } from "@/lib/youtube";

const createPostSchema = z.object({
  posturl: z.string().min(1, "YouTube URL is required."),
  caption: z.string().max(500).optional(),
});

export async function GET() {
  try {
    const posts = await getAllPosts();
    return Response.json(posts.map(serializePost));
  } catch (error) {
    console.error("Get posts error:", error);
    return Response.json(
      { error: "Could not retrieve posts." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  try {
    const body = await request.json();
    const parsed = createPostSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 422 },
      );
    }

    const videoId = parseYouTubeUrl(parsed.data.posturl);
    if (!videoId) {
      return Response.json(
        { error: "Invalid YouTube URL." },
        { status: 422 },
      );
    }

    await connectDB();

    const user = await User.findById(auth.userId);
    if (!user) {
      return Response.json({ error: "User not found." }, { status: 404 });
    }

    const post = await MusicPost.create({
      posturl: toEmbedUrl(videoId),
      caption: parsed.data.caption ?? "",
      creator: auth.userId,
      date: formatISO(new Date()),
      comments: [],
      likes: [],
    });

    user.posts.push(post._id);
    await user.save();

    return Response.json({ status: "201", message: "Success." }, { status: 201 });
  } catch (error) {
    console.error("Create post error:", error);
    return Response.json(
      { error: "Could not create post." },
      { status: 500 },
    );
  }
}
