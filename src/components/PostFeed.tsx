"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { PostCard } from "@/components/PostCard";
import { PostModal } from "@/components/PostModal";
import { TagFilter } from "@/components/TagFilter";
import type { PostPublic, TagCount } from "@/types";

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
    setPosts(initialPosts);
  }, [initialPosts]);

  useEffect(() => {
    setTags(initialTags);
  }, [initialTags]);

  function handleTagSelect(tag: string | null) {
    setActiveTag(tag);
    void refreshPosts(tag);
  }

  return (
    <div className="min-w-0">
      <TagFilter tags={tags} activeTag={activeTag} onSelect={handleTagSelect} />

      <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_24rem] xl:items-start xl:gap-10">
        <div className="min-w-0">
          {loading && (
            <p className="ui-muted mb-4 text-sm">loading posts...</p>
          )}

          {posts.length === 0 ? (
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
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
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

        {sideContent && <div className="mt-8 xl:mt-0">{sideContent}</div>}
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
