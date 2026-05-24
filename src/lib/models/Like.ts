import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const LikeSchema = new Schema({
  byUser: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  toPost: { type: Schema.Types.ObjectId, required: true, ref: "MusicPost" },
});

LikeSchema.index({ byUser: 1, toPost: 1 }, { unique: true });

export type ILike = InferSchemaType<typeof LikeSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Like: Model<ILike> =
  mongoose.models.Like ?? mongoose.model<ILike>("Like", LikeSchema);
