"use client";

import Link from "next/link";
import Pusher from "pusher-js";
import { FormEvent, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { useAuth } from "@/components/AuthProvider";
import type { ChatMessagePublic } from "@/lib/chat";
import { CHAT_CHANNEL, CHAT_MESSAGE_EVENT } from "@/lib/chat-events";

const MAX_MESSAGES = 50;
const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
const pusherConfigError =
  !pusherKey || !pusherCluster ? "Chatter realtime is not configured." : "";

function formatChatTime(date: string): string {
  try {
    return format(new Date(date), "MMM d, h:mm a");
  } catch {
    return date;
  }
}

function appendMessage(messages: ChatMessagePublic[], message: ChatMessagePublic) {
  if (messages.some((item) => item._id === message._id)) {
    return messages;
  }

  return [...messages, message].slice(-MAX_MESSAGES);
}

export function ChatPanel() {
  const { user, loading } = useAuth();
  const [messages, setMessages] = useState<ChatMessagePublic[]>([]);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(pusherConfigError);
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadMessages() {
      try {
        const response = await fetch("/api/chat/messages");
        if (!response.ok) throw new Error("Could not load chat.");
        const data = (await response.json()) as ChatMessagePublic[];
        if (!cancelled) {
          setMessages(data);
        }
      } catch {
        if (!cancelled) {
          setError("Could not load chatter.");
        }
      }
    }

    void loadMessages();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!pusherKey || !pusherCluster) {
      return;
    }

    const pusher = new Pusher(pusherKey, { cluster: pusherCluster });
    const channel = pusher.subscribe(CHAT_CHANNEL);

    pusher.connection.bind("connected", () => setConnected(true));
    pusher.connection.bind("disconnected", () => setConnected(false));
    pusher.connection.bind("unavailable", () => setConnected(false));

    channel.bind(CHAT_MESSAGE_EVENT, (message: ChatMessagePublic) => {
      setMessages((current) => appendMessage(current, message));
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(CHAT_CHANNEL);
      pusher.disconnect();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || busy || !user) return;

    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: trimmed }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Could not send message.");
      }

      const message = (await response.json()) as ChatMessagePublic;
      setMessages((current) => appendMessage(current, message));
      setBody("");
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Could not send message.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="chat-panel ui-panel flex max-h-112 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3.5">
        <h2 className="ui-title text-sm font-medium">chatter</h2>
        <span className={`ui-meta ${connected ? "text-[#7ec8ff]" : ""}`}>
          {connected ? "live" : "offline"}
        </span>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4" data-lenis-prevent>
        {messages.length === 0 ? (
          <p className="ui-muted text-sm">no messages yet</p>
        ) : (
          messages.map((message) => (
            <article key={message._id} className="chat-message">
              <div className="flex items-baseline justify-between gap-3">
                <Link href={`/user/${message.sender._id}`} className="ui-link text-sm">
                  {message.sender.name}
                </Link>
                <time className="ui-meta shrink-0 text-xs" dateTime={message.createdAt}>
                  {formatChatTime(message.createdAt)}
                </time>
              </div>
              <p className="ui-body mt-1 wrap-break-word text-sm">{message.body}</p>
            </article>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="shrink-0 border-t border-border p-3">
        {error && <p className="ui-muted mb-2 text-xs">{error}</p>}

        {user ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              maxLength={500}
              placeholder="say something..."
              className="ui-input min-w-0 flex-1"
              disabled={busy}
            />
            <button type="submit" className="ui-btn ui-btn-accent" disabled={busy || !body.trim()}>
              send
            </button>
          </div>
        ) : (
          <p className="ui-muted text-sm">
            {loading ? "checking session..." : "log in to join the chatter."}
          </p>
        )}
      </form>
    </section>
  );
}
