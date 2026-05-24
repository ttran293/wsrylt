import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { requireAuth } from "@/lib/auth";
import { User } from "@/lib/models/User";

type RouteContext = { params: Promise<{ id: string }> };

const bioSchema = z.object({
  content: z.string().max(150),
});

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  try {
    const { id } = await context.params;

    if (id !== auth.userId) {
      return Response.json(
        { error: "You are not allowed to edit this bio." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const parsed = bioSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 422 },
      );
    }

    await connectDB();
    const user = await User.findById(id);

    if (!user) {
      return Response.json({ error: "User not found." }, { status: 404 });
    }

    user.information = parsed.data.content;
    await user.save();

    return Response.json({
      message: "Bio edited.",
      status: "200",
      bio: parsed.data.content,
    });
  } catch (error) {
    console.error("Edit bio error:", error);
    return Response.json({ error: "Could not update bio." }, { status: 500 });
  }
}
