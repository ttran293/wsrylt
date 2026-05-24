import { notFound } from "next/navigation";
import { UserProfile } from "@/components/UserProfile";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { getPostsByUserId, serializePost } from "@/lib/posts";
import type { PostPublic } from "@/types";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function UserPage({ params }: PageProps) {
  const { id } = await params;

  try {
    await connectDB();
    const user = await User.findById(id).select("name information datejoin").lean();

    if (!user) {
      notFound();
    }

    const rawPosts = await getPostsByUserId(id);
    const posts = rawPosts.map(serializePost) as PostPublic[];

    return (
      <UserProfile
        userId={id}
        initialUser={{
          _id: user._id.toString(),
          name: user.name,
          information: user.information ?? "",
          datejoin: user.datejoin,
        }}
        initialPosts={posts}
      />
    );
  } catch (error) {
    console.error("User page error:", error);
    notFound();
  }
}
