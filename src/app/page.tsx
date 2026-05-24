import { PostedBanner } from "@/components/PostedBanner";
import { PostFeed } from "@/components/PostFeed";
import { getAllPosts, serializePost } from "@/lib/posts";
import type { PostPublic } from "@/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let posts: PostPublic[] = [];

  try {
    const rawPosts = await getAllPosts();
    posts = rawPosts.map(serializePost) as PostPublic[];
  } catch (error) {
    console.error("Failed to load posts:", error);
  }

  return (
    <div>
      <PostedBanner />

      <div className="mb-8">
        <h1 className="ui-title text-2xl font-medium">discover music</h1>
        <p className="ui-muted mt-3 text-sm leading-relaxed">
          songs shared by the community — like, comment, and find your next
          favorite track.
        </p>
      </div>

      <PostFeed initialPosts={posts} />
    </div>
  );
}
