import "@/lib/models";
import { Comment } from "@/lib/models/Comment";
import { Like } from "@/lib/models/Like";

function objectIdToISO(id: string): string {
  try {
    return new Date(parseInt(id.substring(0, 8), 16) * 1000).toISOString();
  } catch {
    return new Date(0).toISOString();
  }
}

const postPopulate = {
  path: "toPost" as const,
  select: "caption posturl creator date",
  populate: { path: "creator", select: "name" },
};

const commentPostPopulate = {
  path: "onPost" as const,
  select: "caption posturl creator date",
  populate: { path: "creator", select: "name" },
};

export async function getLikesByUserId(userId: string) {
  await import("@/lib/mongodb").then(({ connectDB }) => connectDB());
  return Like.find({ byUser: userId })
    .populate(postPopulate)
    .sort({ _id: -1 })
    .lean()
    .exec();
}

export async function getCommentsByUserId(userId: string) {
  await import("@/lib/mongodb").then(({ connectDB }) => connectDB());
  return Comment.find({ byUser: userId })
    .populate(commentPostPopulate)
    .sort({ date: -1 })
    .lean()
    .exec();
}

type PopulatedPost = {
  _id: { toString(): string };
  caption?: string;
  posturl: string;
  creator: { _id: { toString(): string }; name: string };
};

function serializePostRef(post: PopulatedPost | null | undefined) {
  if (!post) return null;
  return {
    _id: post._id.toString(),
    caption: post.caption ?? "",
    posturl: post.posturl,
    creator: {
      _id: post.creator._id.toString(),
      name: post.creator.name,
    },
  };
}

export function serializeUserLikes(likes: Record<string, unknown>[]) {
  return likes
    .map((like) => {
      const id = String(like._id);
      return {
        _id: id,
        date: objectIdToISO(id),
        post: serializePostRef(like.toPost as PopulatedPost | null),
      };
    })
    .filter((entry) => entry.post !== null);
}

export function serializeUserComments(comments: Record<string, unknown>[]) {
  return comments
    .map((comment) => ({
      _id: String(comment._id),
      content: String(comment.content),
      date: String(comment.date),
      post: serializePostRef(comment.onPost as PopulatedPost | null),
    }))
    .filter((entry) => entry.post !== null);
}
