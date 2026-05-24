"use client";

import { useCallback, useEffect, useState } from "react";
import { PostCard } from "@/components/PostCard";
import { PostModal } from "@/components/PostModal";
import type { PostPublic } from "@/types";

interface PostFeedProps {
  initialPosts: PostPublic[];
}

export function PostFeed({ initialPosts }: PostFeedProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [selectedPost, setSelectedPost] = useState<PostPublic | null>(null);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/posts");
    if (response.ok) {
      const data = await response.json();
      setPosts(data);
      if (selectedPost) {
        const updated = data.find((p: PostPublic) => p._id === selectedPost._id);
        if (updated) setSelectedPost(updated);
      }
    }
  }, [selectedPost]);

  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  if (posts.length === 0) {
    return (
      <div className="ui-panel border-dashed p-12 text-center">
        <p className="text-lg">no posts yet</p>
        <p className="ui-muted mt-2 text-sm">
          be the first to share a song you love.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <PostCard
            key={post._id}
            post={post}
            onUpdated={refresh}
            onOpen={setSelectedPost}
          />
        ))}
      </div>

      {selectedPost && (
        <PostModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onUpdated={refresh}
        />
      )}
    </>
  );
}
