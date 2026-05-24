import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const MusicPostSchema = new Schema({
  posturl: { type: String, required: true },
  caption: { type: String, default: "" },
  creator: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  date: { type: String, required: true },
  comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
  likes: [{ type: Schema.Types.ObjectId, ref: "Like" }],
});

MusicPostSchema.index({ creator: 1, _id: -1 });

export type IMusicPost = InferSchemaType<typeof MusicPostSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const MusicPost: Model<IMusicPost> =
  mongoose.models.MusicPost ??
  mongoose.model<IMusicPost>("MusicPost", MusicPostSchema);
