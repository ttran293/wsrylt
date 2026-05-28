import "@/lib/models";
import { Notification } from "@/lib/models/Notification";

const notificationPopulate = [
  { path: "actor", select: "name" },
  { path: "post", select: "caption posturl" },
  { path: "comment", select: "content" },
];

export async function getNotificationsForUser(userId: string, limit = 30) {
  await import("@/lib/mongodb").then(({ connectDB }) => connectDB());

  return Notification.find({ recipient: userId })
    .populate(notificationPopulate)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()
    .exec();
}

export async function getUnreadNotificationCount(userId: string) {
  await import("@/lib/mongodb").then(({ connectDB }) => connectDB());

  return Notification.countDocuments({ recipient: userId, read: false });
}

export function serializeNotification(notification: Record<string, unknown>) {
  return JSON.parse(JSON.stringify(notification));
}
