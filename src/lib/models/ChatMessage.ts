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

const existingChatMessageModel = mongoose.models.ChatMessage as
  | Model<IChatMessage>
  | undefined;

if (existingChatMessageModel && !existingChatMessageModel.schema.path("bodyRaw")) {
  mongoose.deleteModel("ChatMessage");
}

export const ChatMessage: Model<IChatMessage> =
  (mongoose.models.ChatMessage as Model<IChatMessage> | undefined) ??
  mongoose.model<IChatMessage>("ChatMessage", ChatMessageSchema);
