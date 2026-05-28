import { notFound } from "next/navigation";
import { UserProfile } from "@/components/UserProfile";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { getPostsByUserId, serializePost } from "@/lib/posts";
import {
  getCommentsByUserId,
  getLikesByUserId,
  serializeUserComments,
  serializeUserLikes,
} from "@/lib/user-activity";
import type { PostPublic, UserCommentEntry, UserLikeEntry } from "@/types";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function UserPage({ params }: PageProps) {
  const { id } = await params;

  try {
    await connectDB();
    const user = await User.findById(id)
      .select("name information imageUrl datejoin")
      .lean();

    if (!user) {
      notFound();
    }

    const [rawPosts, rawLikes, rawComments] = await Promise.all([
      getPostsByUserId(id),
      getLikesByUserId(id),
      getCommentsByUserId(id),
    ]);
    const posts = rawPosts.map(serializePost) as PostPublic[];
    const likes = serializeUserLikes(
      rawLikes as Record<string, unknown>[],
    ) as UserLikeEntry[];
    const comments = serializeUserComments(
      rawComments as Record<string, unknown>[],
    ) as UserCommentEntry[];

    return (
      <UserProfile
        userId={id}
        initialUser={{
          _id: user._id.toString(),
          name: user.name,
          information: user.information ?? "",
          imageUrl: user.imageUrl ?? "",
          datejoin: user.datejoin,
        }}
        initialPosts={posts}
        initialLikes={likes}
        initialComments={comments}
      />
    );
  } catch (error) {
    console.error("User page error:", error);
    notFound();
  }
}
