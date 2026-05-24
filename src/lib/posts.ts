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

export async function getAllPosts() {
  await import("@/lib/mongodb").then(({ connectDB }) => connectDB());
  return MusicPost.find()
    .populate(postPopulate)
    .sort({ _id: -1 })
    .lean()
    .exec();
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
