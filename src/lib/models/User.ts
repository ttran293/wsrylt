import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import {
  MAX_USERNAME_LENGTH,
  MIN_USERNAME_LENGTH,
} from "@/lib/validation/username-constants";

const UserSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: MIN_USERNAME_LENGTH,
    maxlength: MAX_USERNAME_LENGTH,
  },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  information: { type: String, maxlength: 150, default: "" },
  imageUrl: { type: String, default: "" },
  imageKey: { type: String, default: "" },
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
