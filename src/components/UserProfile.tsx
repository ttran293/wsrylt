"use client";

import { useCallback, useEffect, useState } from "react";
import { PostCard } from "@/components/PostCard";
import { PostModal } from "@/components/PostModal";
import { UserBio } from "@/components/UserBio";
import type { PostPublic } from "@/types";

interface UserProfileProps {
  userId: string;
  initialUser: {
    _id: string;
    name: string;
    information: string;
    datejoin: string;
  };
  initialPosts: PostPublic[];
}

export function UserProfile({
  userId,
  initialUser,
  initialPosts,
}: UserProfileProps) {
  const [user, setUser] = useState(initialUser);
  const [posts, setPosts] = useState(initialPosts);
  const [selectedPost, setSelectedPost] = useState<PostPublic | null>(null);

  const refresh = useCallback(async () => {
    const response = await fetch(`/api/users/${userId}`);
    if (response.ok) {
      const data = await response.json();
      setUser(data.user);
      setPosts(data.posts);
      if (selectedPost) {
        const updated = data.posts.find(
          (p: PostPublic) => p._id === selectedPost._id,
        );
        if (updated) setSelectedPost(updated);
      }
    }
  }, [userId, selectedPost]);

  useEffect(() => {
    setUser(initialUser);
    setPosts(initialPosts);
  }, [initialUser, initialPosts]);

  return (
    <div className="space-y-8">
      <UserBio
        userId={user._id}
        name={user.name}
        information={user.information}
        datejoin={user.datejoin}
        onUpdated={refresh}
      />

      <section>
        <h2 className="ui-title mb-4 text-lg font-medium">
          {user.name}&apos;s posts
        </h2>

        {posts.length === 0 ? (
          <p className="ui-muted text-sm">no posts yet.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                showDelete
                onUpdated={refresh}
                onOpen={setSelectedPost}
              />
            ))}
          </div>
        )}
      </section>

      {selectedPost && (
        <PostModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onUpdated={refresh}
        />
      )}
    </div>
  );
}
