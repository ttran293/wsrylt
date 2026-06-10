import "@/lib/models";
import { ChatMessage } from "@/lib/models/ChatMessage";

const CHAT_HISTORY_LIMIT = 50;

interface PopulatedChatMessage {
  _id: unknown;
  body: string;
  createdAt?: Date | string;
  sender?: {
    _id?: unknown;
    name?: string;
    imageUrl?: string;
  } | null;
}

export interface ChatMessagePublic {
  _id: string;
  body: string;
  createdAt: string;
  sender: {
    _id: string;
    name: string;
    imageUrl: string;
  };
}

export function serializeChatMessage(message: PopulatedChatMessage): ChatMessagePublic {
  const sender = message.sender;

  return {
    _id: String(message._id),
    body: message.body,
    createdAt: new Date(message.createdAt ?? Date.now()).toISOString(),
    sender: {
      _id: String(sender?._id ?? ""),
      name: sender?.name ?? "unknown",
      imageUrl: sender?.imageUrl ?? "",
    },
  };
}

export async function getRecentChatMessages(limit = CHAT_HISTORY_LIMIT) {
  await import("@/lib/mongodb").then(({ connectDB }) => connectDB());

  const messages = await ChatMessage.find()
    .populate({ path: "sender", select: "name imageUrl" })
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit)
    .lean<PopulatedChatMessage[]>()
    .exec();

  return messages.reverse().map(serializeChatMessage);
}
