import "@/lib/models";
import { MusicPost } from "@/lib/models/MusicPost";

const postPopulate = [
  { path: "creator", select: "name information datejoin email" },
  {
    path: "comments",
    populate: { path: "byUser", select: "name" },
  },
  {
    path: "likes",
    populate: { path: "byUser", select: "name" },
  },
];

export async function getAllPosts(tag?: string) {
  await import("@/lib/mongodb").then(({ connectDB }) => connectDB());

  const filter = tag ? { tags: tag } : {};

  return MusicPost.find(filter)
    .populate(postPopulate)
    .sort({ _id: -1 })
    .lean()
    .exec();
}

export async function getTagCounts(limit = 30) {
  await import("@/lib/mongodb").then(({ connectDB }) => connectDB());

  const results = await MusicPost.aggregate<{ _id: string; count: number }>([
    { $unwind: "$tags" },
    { $group: { _id: "$tags", count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
    { $limit: limit },
  ]);

  return results.map((item) => ({
    tag: item._id,
    count: item.count,
  }));
}

export async function getPostsByUserId(userId: string) {
  await import("@/lib/mongodb").then(({ connectDB }) => connectDB());
  return MusicPost.find({ creator: userId })
    .populate(postPopulate)
    .sort({ _id: -1 })
    .lean()
    .exec();
}

export async function getPostById(postId: string) {
  await import("@/lib/mongodb").then(({ connectDB }) => connectDB());
  return MusicPost.findById(postId).populate(postPopulate).lean().exec();
}

export function serializePost(post: Record<string, unknown>) {
  return JSON.parse(JSON.stringify(post));
}
