import { auth } from "@/auth";

export interface AuthUser {
  userId: string;
  name: string;
  email: string;
}

export async function getSessionUser(): Promise<AuthUser | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  return {
    userId: session.user.id,
    name: session.user.name ?? "",
    email: session.user.email ?? "",
  };
}

export async function requireAuth(): Promise<AuthUser | Response> {
  const user = await getSessionUser();

  if (!user) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }

  return user;
}
