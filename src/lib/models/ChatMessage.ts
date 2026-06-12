import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { MAX_CHAT_MESSAGE_LENGTH } from "@/lib/validation/chat-message";

const ChatMessageSchema = new Schema(
  {
    sender: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: MAX_CHAT_MESSAGE_LENGTH,
    },
    bodyRaw: { type: String, trim: true, maxlength: MAX_CHAT_MESSAGE_LENGTH },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type IChatMessage = InferSchemaType<typeof ChatMessageSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ChatMessage: Model<IChatMessage> =
  mongoose.models.ChatMessage ??
  mongoose.model<IChatMessage>("ChatMessage", ChatMessageSchema);
