import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import {
  AVATAR_MAX_BYTES,
  createAvatarKey,
  createAvatarUploadPost,
  getAvatarPublicUrl,
  isAvatarContentType,
} from "@/lib/s3";

type RouteContext = { params: Promise<{ id: string }> };

const uploadUrlSchema = z.object({
  contentType: z.string().refine(isAvatarContentType, {
    message: "Avatar must be a JPEG, PNG, or WebP image.",
  }),
  size: z
    .number()
    .int()
    .positive()
    .max(AVATAR_MAX_BYTES, "Avatar must be 2MB or smaller."),
});

export async function POST(request: NextRequest, context: RouteContext) {
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
    const parsed = uploadUrlSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 422 },
      );
    }

    const imageKey = createAvatarKey(id, parsed.data.contentType);
    const upload = await createAvatarUploadPost({
      key: imageKey,
      contentType: parsed.data.contentType,
    });

    return Response.json({
      uploadUrl: upload.url,
      fields: upload.fields,
      imageKey,
      imageUrl: getAvatarPublicUrl(imageKey),
      maxBytes: AVATAR_MAX_BYTES,
    });
  } catch (error) {
    console.error("Create avatar upload URL error:", error);
    return Response.json(
      { error: "Could not create avatar upload URL." },
      { status: 500 },
    );
  }
}
