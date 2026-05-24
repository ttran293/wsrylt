"use client";

import { useCallback, useEffect, useState } from "react";
import { DateDisplay } from "@/components/DateDisplay";
import {
  CommentsTabIcon,
  LikesTabIcon,
  PostsTabIcon,
} from "@/components/NavIcons";
import { PostCard } from "@/components/PostCard";
import { PostModal } from "@/components/PostModal";
import { UserBio } from "@/components/UserBio";
import type {
  PostPublic,
  UserCommentEntry,
  UserLikeEntry,
} from "@/types";

type ProfileTab = "posts" | "likes" | "comments";

interface UserProfileProps {
  userId: string;
  initialUser: {
    _id: string;
    name: string;
    information: string;
    datejoin: string;
  };
  initialPosts: PostPublic[];
  initialLikes: UserLikeEntry[];
  initialComments: UserCommentEntry[];
}

const tabs: {
  id: ProfileTab;
  label: string;
  icon: typeof PostsTabIcon;
}[] = [
  { id: "posts", label: "posts", icon: PostsTabIcon },
  { id: "likes", label: "likes", icon: LikesTabIcon },
  { id: "comments", label: "comments", icon: CommentsTabIcon },
];

export function UserProfile({
  userId,
  initialUser,
  initialPosts,
  initialLikes,
  initialComments,
}: UserProfileProps) {
  const [user, setUser] = useState(initialUser);
  const [posts, setPosts] = useState(initialPosts);
  const [likes, setLikes] = useState(initialLikes);
  const [comments, setComments] = useState(initialComments);
  const [tab, setTab] = useState<ProfileTab>("posts");
  const [selectedPost, setSelectedPost] = useState<PostPublic | null>(null);

  const refresh = useCallback(async () => {
    const response = await fetch(`/api/users/${userId}`);
    if (response.ok) {
      const data = await response.json();
      setUser(data.user);
      setPosts(data.posts);
      setLikes(data.likes);
      setComments(data.comments);
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
    setLikes(initialLikes);
    setComments(initialComments);
  }, [initialUser, initialPosts, initialLikes, initialComments]);

  async function openPost(postId: string) {
    const response = await fetch(`/api/posts/${postId}`);
    if (response.ok) {
      setSelectedPost(await response.json());
    }
  }

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
        <div className="ui-profile-tabs" role="tablist" aria-label="Profile sections">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`ui-profile-tab ${tab === id ? "ui-profile-tab-active" : ""}`}
            >
              <Icon className="ui-tab-icon" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="ui-profile-tab-panel p-5" role="tabpanel">
          {tab === "posts" && (
            <>
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
            </>
          )}

          {tab === "likes" && (
            <>
              {likes.length === 0 ? (
                <p className="ui-muted text-sm">no likes yet.</p>
              ) : (
                <ul className="divide-y divide-[var(--border)]">
                  {likes.map((like) => (
                    <li key={like._id}>
                      <button
                        type="button"
                        onClick={() => openPost(like.post._id)}
                        className="flex w-full items-start justify-between gap-4 px-1 py-3 text-left transition-colors hover:bg-[var(--surface-hover)]"
                      >
                        <div className="min-w-0">
                          <p className="ui-body text-sm">
                            liked{" "}
                            <span className="ui-link no-underline">
                              {like.post.creator.name}
                            </span>
                            &apos;s post
                          </p>
                          <p className="ui-meta mt-1 truncate">
                            {like.post.caption || "no caption"}
                          </p>
                        </div>
                        <DateDisplay date={like.date} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {tab === "comments" && (
            <>
              {comments.length === 0 ? (
                <p className="ui-muted text-sm">no comments yet.</p>
              ) : (
                <ul className="divide-y divide-[var(--border)]">
                  {comments.map((comment) => (
                    <li key={comment._id}>
                      <button
                        type="button"
                        onClick={() => openPost(comment.post._id)}
                        className="flex w-full items-start justify-between gap-4 px-1 py-3 text-left transition-colors hover:bg-[var(--surface-hover)]"
                      >
                        <div className="min-w-0">
                          <p className="ui-body text-sm">
                            &ldquo;{comment.content}&rdquo;
                          </p>
                          <p className="ui-meta mt-1 truncate">
                            on {comment.post.creator.name}&apos;s post —{" "}
                            {comment.post.caption || "no caption"}
                          </p>
                        </div>
                        <DateDisplay date={comment.date} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
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
