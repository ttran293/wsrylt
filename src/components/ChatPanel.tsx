"use client";

import Link from "next/link";
import Lenis from "lenis";
import Pusher from "pusher-js";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { useAuth } from "@/components/AuthProvider";
import type { ActivityEvent } from "@/lib/activity";
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

interface ChatPanelProps {
  activityEvents?: ActivityEvent[];
  className?: string;
}

export function ChatPanel({ activityEvents = [], className = "" }: ChatPanelProps) {
  const { user, loading } = useAuth();
  const [messages, setMessages] = useState<ChatMessagePublic[]>([]);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(pusherConfigError);
  const [connected, setConnected] = useState(false);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  const scrollContentRef = useRef<HTMLDivElement>(null);
  const communityScrollerRef = useRef<Lenis | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const communityItems = useMemo(
    () =>
      [
        ...activityEvents.slice(0, 20).map((event) => ({
          id: `activity-${event.id}`,
          date: event.date,
          type: "activity" as const,
          event,
        })),
        ...messages.map((message) => ({
          id: `message-${message._id}`,
          date: message.createdAt,
          type: "message" as const,
          message,
        })),
      ].sort(
        (left, right) =>
          new Date(left.date).getTime() - new Date(right.date).getTime(),
      ),
    [activityEvents, messages],
  );

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
    const wrapper = scrollWrapperRef.current;
    const content = scrollContentRef.current;
    if (!wrapper || !content) return;

    const lenis = new Lenis({
      wrapper,
      content,
      lerp: 0.1,
      smoothWheel: true,
      autoRaf: true,
    });

    communityScrollerRef.current = lenis;

    return () => {
      lenis.destroy();
      if (communityScrollerRef.current === lenis) {
        communityScrollerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    communityScrollerRef.current?.resize();
    window.requestAnimationFrame(() => {
      const scroller = communityScrollerRef.current;
      const endMarker = messagesEndRef.current;

      if (!scroller || !endMarker) {
        endMarker?.scrollIntoView({ block: "end" });
        return;
      }

      scroller.scrollTo(endMarker, { immediate: true });
    });
  }, [communityItems.length]);

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
    <section className={`chat-panel ui-panel flex max-h-128 flex-col ${className}`}>
      <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3.5">
        <h2 className="ui-title text-sm font-medium">community</h2>
        <span className={`ui-meta ${connected ? "text-[#7ec8ff]" : ""}`}>
          {connected ? "live" : "offline"}
        </span>
      </div>

      <div ref={scrollWrapperRef} className="min-h-0 flex-1 overflow-hidden" data-lenis-prevent>
        <div ref={scrollContentRef} className="space-y-3 px-5 py-4">
          {communityItems.length === 0 ? (
            <p className="ui-muted text-sm">no community updates yet</p>
          ) : (
            communityItems.map((item, index) => {
              const isLatestItem = index === communityItems.length - 1;

              if (item.type === "activity") {
                return (
                  <article key={item.id} className="chat-message">
                    <div className="flex items-baseline justify-between gap-3">
                      <Link href={`/user/${item.event.user._id}`} className="ui-link text-sm">
                        {item.event.user.name}
                      </Link>
                      <time className="ui-meta shrink-0 text-xs" dateTime={item.event.date}>
                        {formatChatTime(item.event.date)}
                      </time>
                    </div>
                    <p
                      className={`ui-meta mt-1 wrap-break-word text-sm ${
                        isLatestItem ? "chat-latest-text-bop" : ""
                      }`}
                    >
                      {item.event.message}
                    </p>
                  </article>
                );
              }

              return (
                <article key={item.id} className="chat-message">
                  <div className="flex items-baseline justify-between gap-3">
                    <Link href={`/user/${item.message.sender._id}`} className="ui-link text-sm">
                      {item.message.sender.name}
                    </Link>
                    <time className="ui-meta shrink-0 text-xs" dateTime={item.message.createdAt}>
                      {formatChatTime(item.message.createdAt)}
                    </time>
                  </div>
                  <p
                    className={`ui-body mt-1 wrap-break-word text-sm ${
                      isLatestItem ? "chat-latest-text-bop" : ""
                    }`}
                  >
                    {item.message.body}
                  </p>
                </article>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
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
