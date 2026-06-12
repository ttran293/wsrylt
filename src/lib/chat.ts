import "@/lib/models";
import mongoose from "mongoose";
import { ChatMessage } from "@/lib/models/ChatMessage";

export const CHAT_HISTORY_LIMIT = 25;
const MAX_CHAT_HISTORY_LIMIT = 50;

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

export interface ChatMessagesPage {
  messages: ChatMessagePublic[];
  nextCursor: string | null;
  hasMore: boolean;
}

interface ChatCursor {
  createdAt: Date;
  id: mongoose.Types.ObjectId;
}

function clampLimit(limit: number): number {
  if (!Number.isFinite(limit)) {
    return CHAT_HISTORY_LIMIT;
  }

  return Math.min(Math.max(Math.floor(limit), 1), MAX_CHAT_HISTORY_LIMIT);
}

function encodeChatCursor(message: PopulatedChatMessage): string {
  return `${new Date(message.createdAt ?? Date.now()).toISOString()}|${String(message._id)}`;
}

function parseChatCursor(cursor: string | null | undefined): ChatCursor | null {
  if (!cursor) {
    return null;
  }

  const [rawCreatedAt, rawId] = cursor.split("|");
  const createdAt = new Date(rawCreatedAt);

  if (
    Number.isNaN(createdAt.getTime()) ||
    !rawId ||
    !mongoose.Types.ObjectId.isValid(rawId)
  ) {
    return null;
  }

  return {
    createdAt,
    id: new mongoose.Types.ObjectId(rawId),
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

export async function getChatMessagesPage({
  before,
  limit = CHAT_HISTORY_LIMIT,
}: {
  before?: string | null;
  limit?: number;
} = {}): Promise<ChatMessagesPage> {
  await import("@/lib/mongodb").then(({ connectDB }) => connectDB());

  const pageLimit = clampLimit(limit);
  const cursor = parseChatCursor(before);
  const query = cursor
    ? {
        $or: [
          { createdAt: { $lt: cursor.createdAt } },
          { createdAt: cursor.createdAt, _id: { $lt: cursor.id } },
        ],
      }
    : {};

  const messages = await ChatMessage.find(query)
    .populate({ path: "sender", select: "name imageUrl" })
    .sort({ createdAt: -1, _id: -1 })
    .limit(pageLimit + 1)
    .lean<PopulatedChatMessage[]>()
    .exec();

  const pageMessages = messages.slice(0, pageLimit);
  const hasMore = messages.length > pageLimit;
  const oldestMessage = pageMessages.at(-1);

  return {
    messages: pageMessages.reverse().map(serializeChatMessage),
    nextCursor: hasMore && oldestMessage ? encodeChatCursor(oldestMessage) : null,
    hasMore,
  };
}
