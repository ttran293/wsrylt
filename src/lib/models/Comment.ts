import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const CommentSchema = new Schema({
  byUser: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  content: { type: String, required: true },
  date: { type: String, required: true },
  onPost: { type: Schema.Types.ObjectId, required: true, ref: "MusicPost" },
});

CommentSchema.index({ onPost: 1 });

export type IComment = InferSchemaType<typeof CommentSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Comment: Model<IComment> =
  mongoose.models.Comment ?? mongoose.model<IComment>("Comment", CommentSchema);
