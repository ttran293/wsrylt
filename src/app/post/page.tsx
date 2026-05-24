"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PostForm } from "@/components/PostForm";
import { useAuth } from "@/components/AuthProvider";

export default function CreatePostPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return <p className="ui-muted text-center">loading...</p>;
  }

  if (!user) {
    return (
      <div className="ui-panel mx-auto max-w-md p-8 text-center">
        <p>you need to log in to create a post.</p>
        <Link href="/login" className="ui-btn ui-btn-accent mt-4 inline-block">
          [ log in ]
        </Link>
      </div>
    );
  }

  return <PostForm />;
}
