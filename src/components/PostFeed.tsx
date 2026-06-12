"use client";

import Pusher from "pusher-js";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { PostCard } from "@/components/PostCard";
import { PostModal } from "@/components/PostModal";
import { TagFilter } from "@/components/TagFilter";
import { POSTS_CHANNEL, POST_CREATED_EVENT } from "@/lib/post-events";
import type { PostPublic, TagCount } from "@/types";

const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

function getPostTime(post: PostPublic) {
  const timestamp = new Date(post.date).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function sortPostsNewestFirst(posts: PostPublic[]) {
  return [...posts].sort((left, right) => {
    const dateDifference = getPostTime(right) - getPostTime(left);

    if (dateDifference !== 0) {
      return dateDifference;
    }

    return right._id.localeCompare(left._id);
  });
}

function prependPost(posts: PostPublic[], post: PostPublic) {
  if (posts.some((item) => item._id === post._id)) {
    return posts;
  }

  return [post, ...posts];
}

interface PostFeedProps {
  initialPosts: PostPublic[];
  initialTags: TagCount[];
  sideContent?: ReactNode;
}

export function PostFeed({ initialPosts, initialTags, sideContent }: PostFeedProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [tags, setTags] = useState(initialTags);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<PostPublic | null>(null);
  const [loading, setLoading] = useState(false);
  const activeTagRef = useRef<string | null>(null);
  const sortedPosts = sortPostsNewestFirst(posts);

  const refreshTags = useCallback(async () => {
    const response = await fetch("/api/tags");
    if (response.ok) {
      setTags(await response.json());
    }
  }, []);

  const refreshPosts = useCallback(
    async (tag: string | null) => {
      setLoading(true);
      try {
        const url = tag
          ? `/api/posts?tag=${encodeURIComponent(tag)}`
          : "/api/posts";
        const response = await fetch(url);
        if (!response.ok) return;

        const data = await response.json();
        setPosts(data);
        setSelectedPost((current) => {
          if (!current) return null;
          return data.find((post: PostPublic) => post._id === current._id) ?? null;
        });
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const refresh = useCallback(async () => {
    await Promise.all([refreshPosts(activeTag), refreshTags()]);
  }, [activeTag, refreshPosts, refreshTags]);

  useEffect(() => {
    activeTagRef.current = activeTag;
  }, [activeTag]);

  useEffect(() => {
    if (!pusherKey || !pusherCluster) {
      return;
    }

    const pusher = new Pusher(pusherKey, { cluster: pusherCluster });
    const channel = pusher.subscribe(POSTS_CHANNEL);

    channel.bind(POST_CREATED_EVENT, (post: PostPublic) => {
      const activeFilter = activeTagRef.current;

      if (!activeFilter || post.tags.includes(activeFilter)) {
        setPosts((current) => prependPost(current, post));
      }

      void refreshTags();
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(POSTS_CHANNEL);
      pusher.disconnect();
    };
  }, [refreshTags]);

  function handleTagSelect(tag: string | null) {
    setActiveTag(tag);
    void refreshPosts(tag);
  }

  return (
    <div className="min-w-0">
      <TagFilter tags={tags} activeTag={activeTag} onSelect={handleTagSelect} />

      <div
        className={
          sideContent
            ? "xl:grid xl:grid-cols-[minmax(0,1fr)_26rem] xl:items-start xl:gap-6 2xl:grid-cols-[minmax(0,1fr)_28rem]"
            : ""
        }
      >
        <div className="min-w-0">
          {loading && (
            <p className="ui-muted mb-4 text-sm">loading posts...</p>
          )}

          {sortedPosts.length === 0 ? (
            <div className="ui-panel border-dashed p-12 text-center">
              <p className="text-lg">
                {activeTag ? `no posts tagged #${activeTag}` : "no posts yet"}
              </p>
              <p className="ui-muted mt-2 text-sm">
                {activeTag
                  ? "try another tag or browse all posts."
                  : "be the first to share a song you love."}
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {sortedPosts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  onUpdated={refresh}
                  onOpen={setSelectedPost}
                  onTagClick={handleTagSelect}
                />
              ))}
            </div>
          )}
        </div>

        {sideContent && (
          <div className="mt-8 xl:sticky xl:top-16 xl:mt-0 xl:h-[calc(100dvh-5rem)]">
            {sideContent}
          </div>
        )}
      </div>

      {selectedPost && (
        <PostModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onUpdated={refresh}
          onTagClick={handleTagSelect}
        />
      )}
    </div>
  );
}
