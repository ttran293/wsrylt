import { ChatPanel } from "@/components/ChatPanel";
import { PostedBanner } from "@/components/PostedBanner";
import { PostFeed } from "@/components/PostFeed";
import { SelectableHeroTitle } from "@/components/SelectableHeroTitle";
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
    <div className="mobile-chat-layout xl:grid xl:grid-cols-[minmax(0,1fr)_26rem] xl:items-start xl:gap-6 2xl:grid-cols-[minmax(0,1fr)_28rem]">
      <div className="min-w-0">
        <PostedBanner />

        <div className="mb-5">
          <SelectableHeroTitle
            className="home-hero-title ui-title font-semibold"
            text="what song are you listening to?"
          />
          <p className="ui-muted mt-2 text-sm leading-relaxed">
            songs shared by the community — like, comment, and find your next
            favorite track.
          </p>
          <div className="pixel-divider mt-3" aria-hidden="true" />
        </div>

        <PostFeed initialPosts={posts} initialTags={tags} />
      </div>

      <aside className="mobile-chat-dock mt-8 xl:fixed xl:top-20 xl:right-4 xl:bottom-4 xl:mt-0 xl:w-104 2xl:w-md">
        <ChatPanel
          activityEvents={activity}
          className="h-full max-h-none"
        />
      </aside>
    </div>
  );
}
