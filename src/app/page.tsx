import { ActivityTicker } from "@/components/ActivityTicker";
import { ChatPanel } from "@/components/ChatPanel";
import { PostedBanner } from "@/components/PostedBanner";
import { PostFeed } from "@/components/PostFeed";
import { buildActivityFromPosts } from "@/lib/activity";
import { getAllPosts, getTagCounts, serializePost } from "@/lib/posts";
import type { PostPublic, TagCount } from "@/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let posts: PostPublic[] = [];
  let tags: TagCount[] = [];

  try {
    const [rawPosts, tagCounts] = await Promise.all([
      getAllPosts(),
      getTagCounts(),
    ]);
    posts = rawPosts.map(serializePost) as PostPublic[];
    tags = tagCounts;
  } catch (error) {
    console.error("Failed to load posts:", error);
  }

  const activity = buildActivityFromPosts(posts);

  return (
    <div>
      <PostedBanner />

      <div className="mb-12">
        <h1
          className="home-hero-title ui-title font-semibold"
          data-text="what song are you listening to?"
        >
          what song are you listening to?
        </h1>
        <p className="ui-muted mt-8 text-lg leading-relaxed">
          songs shared by the community — like, comment, and find your next
          favorite track.
        </p>
      </div>

      <ActivityTicker events={activity} />

      <PostFeed
        initialPosts={posts}
        initialTags={tags}
        sideContent={<ChatPanel />}
      />
    </div>
  );
}
