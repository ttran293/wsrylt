"use client";

import { SessionProvider, signOut, useSession } from "next-auth/react";
import type { SessionUser } from "@/types";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}

export function useAuth() {
  const { data: session, status } = useSession();

  const user: SessionUser | null = session?.user?.id
    ? {
        userId: session.user.id,
        name: session.user.name ?? "",
        email: session.user.email ?? "",
      }
    : null;

  return {
    user,
    loading: status === "loading",
    logout: async () => {
      await signOut({ redirect: false });
    },
  };
}
