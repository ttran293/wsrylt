import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import {
  CHAT_HISTORY_LIMIT,
  serializeChatMessage,
  getChatMessagesPage,
} from "@/lib/chat";
import { CHAT_CHANNEL, CHAT_MESSAGE_EVENT } from "@/lib/chat-events";
import { connectDB } from "@/lib/mongodb";
import { ChatMessage } from "@/lib/models/ChatMessage";
import { getPusherServer } from "@/lib/pusher";

export const dynamic = "force-dynamic";

const chatMessageSchema = z.object({
  body: z.string().trim().min(1).max(500),
});

const chatMessagesQuerySchema = z.object({
  before: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(CHAT_HISTORY_LIMIT),
});

export async function GET(request: NextRequest) {
  try {
    const parsed = chatMessagesQuerySchema.safeParse({
      before: request.nextUrl.searchParams.get("before") ?? undefined,
      limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    });

    if (!parsed.success) {
      return Response.json({ error: "Invalid chat query." }, { status: 400 });
    }

    return Response.json(await getChatMessagesPage(parsed.data));
  } catch (error) {
    console.error("Get chat messages error:", error);
    return Response.json(
      { error: "Could not load chat messages." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof Response) return auth;

    const parsed = chatMessageSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: "Message must be 1-500 characters." }, { status: 400 });
    }

    await connectDB();
    const created = await ChatMessage.create({
      sender: auth.userId,
      body: parsed.data.body,
    });
    await created.populate({ path: "sender", select: "name imageUrl" });

    const message = serializeChatMessage(created.toObject());
    await getPusherServer().trigger(CHAT_CHANNEL, CHAT_MESSAGE_EVENT, message);

    return Response.json(message, { status: 201 });
  } catch (error) {
    console.error("Create chat message error:", error);
    return Response.json(
      { error: "Could not send chat message." },
      { status: 500 },
    );
  }
}
