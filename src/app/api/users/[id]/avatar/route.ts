import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { deleteS3Object, getAvatarPublicUrl } from "@/lib/s3";

type RouteContext = { params: Promise<{ id: string }> };

const avatarSchema = z.object({
  imageKey: z.string().min(1),
});

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  try {
    const { id } = await context.params;
    if (id !== auth.userId) {
      return Response.json(
        { error: "You are not allowed to update this avatar." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const parsed = avatarSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 422 },
      );
    }

    if (!parsed.data.imageKey.startsWith(`avatars/${id}/`)) {
      return Response.json({ error: "Invalid avatar key." }, { status: 422 });
    }

    await connectDB();
    const user = await User.findById(id);

    if (!user) {
      return Response.json({ error: "User not found." }, { status: 404 });
    }

    const previousKey = user.imageKey;
    const imageUrl = getAvatarPublicUrl(parsed.data.imageKey);

    user.imageKey = parsed.data.imageKey;
    user.imageUrl = imageUrl;
    await user.save();

    if (previousKey && previousKey !== parsed.data.imageKey) {
      deleteS3Object(previousKey).catch((error) => {
        console.error("Delete previous avatar error:", error);
      });
    }

    return Response.json({
      message: "Avatar updated.",
      imageKey: parsed.data.imageKey,
      imageUrl,
    });
  } catch (error) {
    console.error("Update avatar error:", error);
    return Response.json(
      { error: "Could not update avatar." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  try {
    const { id } = await context.params;
    if (id !== auth.userId) {
      return Response.json(
        { error: "You are not allowed to remove this avatar." },
        { status: 401 },
      );
    }

    await connectDB();
    const user = await User.findById(id);

    if (!user) {
      return Response.json({ error: "User not found." }, { status: 404 });
    }

    const previousKey = user.imageKey;
    user.imageKey = "";
    user.imageUrl = "";
    await user.save();

    if (previousKey) {
      await deleteS3Object(previousKey);
    }

    return Response.json({
      message: "Avatar removed.",
      imageKey: "",
      imageUrl: "",
    });
  } catch (error) {
    console.error("Remove avatar error:", error);
    return Response.json(
      { error: "Could not remove avatar." },
      { status: 500 },
    );
  }
}
