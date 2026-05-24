import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const UserSchema = new Schema({
  name: { type: String, required: true, unique: true },
  email: { type: String },
  information: { type: String, maxlength: 150, default: "" },
  datejoin: { type: String, required: true },
  password: { type: String, required: true, minlength: 6 },
  posts: [{ type: Schema.Types.ObjectId, ref: "MusicPost" }],
  comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
  likes: [{ type: Schema.Types.ObjectId, ref: "Like" }],
});

export type IUser = InferSchemaType<typeof UserSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);
