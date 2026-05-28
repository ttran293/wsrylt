import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { Notification } from "@/lib/models/Notification";
import {
  getNotificationsForUser,
  getUnreadNotificationCount,
  serializeNotification,
} from "@/lib/notifications";
import { connectDB } from "@/lib/mongodb";

const patchSchema = z
  .object({
    ids: z.array(z.string()).optional(),
    read: z.boolean().default(true),
  })
  .optional();

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  try {
    const limitParam = request.nextUrl.searchParams.get("limit");
    const limit = Math.min(Math.max(Number(limitParam) || 30, 1), 50);

    const [notifications, unreadCount] = await Promise.all([
      getNotificationsForUser(auth.userId, limit),
      getUnreadNotificationCount(auth.userId),
    ]);

    return Response.json({
      notifications: notifications.map((notification) =>
        serializeNotification(notification as Record<string, unknown>),
      ),
      unreadCount,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    return Response.json(
      { error: "Could not retrieve notifications." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  try {
    const body = await request.json().catch(() => undefined);
    const parsed = patchSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 422 },
      );
    }

    await connectDB();

    const ids = parsed.data?.ids;
    const read = parsed.data?.read ?? true;
    const filter = ids?.length
      ? { recipient: auth.userId, _id: { $in: ids } }
      : { recipient: auth.userId };

    const result = await Notification.updateMany(filter, { $set: { read } });
    const unreadCount = await getUnreadNotificationCount(auth.userId);

    return Response.json({
      message: read ? "Notifications marked read." : "Notifications marked unread.",
      modifiedCount: result.modifiedCount,
      unreadCount,
    });
  } catch (error) {
    console.error("Update notifications error:", error);
    return Response.json(
      { error: "Could not update notifications." },
      { status: 500 },
    );
  }
}
