"use client";

import Link from "next/link";
import EmojiPicker, {
  EmojiStyle,
  Theme,
  type EmojiClickData,
} from "emoji-picker-react";
import Lenis from "lenis";
import Pusher from "pusher-js";
import {
  Fragment,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { format } from "date-fns";
import { useAuth } from "@/components/AuthProvider";
import { VisitorLiveCount } from "@/components/VisitorStats";
import type { ActivityEvent } from "@/lib/activity";
import type { ChatMessagePublic, ChatMessagesPage } from "@/lib/chat";
import { CHAT_CHANNEL, CHAT_MESSAGE_EVENT } from "@/lib/chat-events";

const CHAT_PAGE_LIMIT = 25;
const TOP_LOAD_THRESHOLD = 80;
const BOTTOM_PRESENT_THRESHOLD = 80;
const JUMP_TO_PRESENT_DELAY_MS = 3000;
const CHAT_MESSAGE_MAX_LENGTH = 500;
const RECENT_CHAT_ANIMATION_WINDOW_MS = 60 * 60 * 1000;
const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
const pusherConfigError =
  !pusherKey || !pusherCluster ? "Chatter realtime is not configured." : "";

function formatChatTime(date: string): string {
  try {
    return format(new Date(date), "h:mm a");
  } catch {
    return date;
  }
}

function formatChatDate(date: string): string {
  try {
    return format(new Date(date), "M/d/yyyy");
  } catch {
    return date;
  }
}

function appendMessage(messages: ChatMessagePublic[], message: ChatMessagePublic) {
  if (messages.some((item) => item._id === message._id)) {
    return messages;
  }

  return [...messages, message];
}

function isRecentChatItem(date: string, now: number): boolean {
  const timestamp = new Date(date).getTime();
  return (
    Number.isFinite(timestamp) &&
    timestamp <= now &&
    now - timestamp <= RECENT_CHAT_ANIMATION_WINDOW_MS
  );
}

function prependMessages(
  messages: ChatMessagePublic[],
  olderMessages: ChatMessagePublic[],
) {
  const existingIds = new Set(messages.map((message) => message._id));
  return [
    ...olderMessages.filter((message) => !existingIds.has(message._id)),
    ...messages,
  ];
}

function ChatAuthor({
  user,
}: {
  user: { _id: string; name: string; imageUrl?: string };
}) {
  const initial = user.name.trim().charAt(0).toLowerCase() || "?";

  return (
    <Link href={`/user/${user._id}`} className="chat-username chat-author">
      {user.imageUrl ? (
        <img
          src={user.imageUrl}
          alt={`${user.name}'s profile picture`}
          className="chat-avatar"
        />
      ) : (
        <span className="chat-avatar chat-avatar-fallback" aria-hidden="true">
          {initial}
        </span>
      )}
      <span className="chat-username-text">{user.name}</span>
    </Link>
  );
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
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [atLatest, setAtLatest] = useState(true);
  const [showJumpToPresent, setShowJumpToPresent] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [animationNow, setAnimationNow] = useState(() => Date.now());
  const inputRef = useRef<HTMLInputElement>(null);
  const shouldRefocusInputRef = useRef(false);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  const scrollContentRef = useRef<HTMLDivElement>(null);
  const communityScrollerRef = useRef<Lenis | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const nextCursorRef = useRef<string | null>(null);
  const hasMoreRef = useRef(false);
  const loadingOlderRef = useRef(false);
  const atLatestRef = useRef(true);
  const shouldScrollToBottomRef = useRef(true);
  const loadOlderMessagesRef = useRef<() => void>(() => {});
  const jumpToPresentTimeoutRef = useRef<number | null>(null);
  const pendingScrollRestoreRef = useRef<{
    scroll: number;
    height: number;
  } | null>(null);
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
    nextCursorRef.current = nextCursor;
  }, [nextCursor]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    loadingOlderRef.current = loadingOlder;
  }, [loadingOlder]);

  useEffect(() => {
    atLatestRef.current = atLatest;
  }, [atLatest]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setAnimationNow(Date.now());
    }, 60 * 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (busy || !shouldRefocusInputRef.current) {
      return;
    }

    shouldRefocusInputRef.current = false;
    const frameId = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [busy]);

  const loadOlderMessages = useCallback(async () => {
    const cursor = nextCursorRef.current;
    if (!cursor || !hasMoreRef.current || loadingOlderRef.current) {
      return;
    }

    const scroller = communityScrollerRef.current;
    const content = scrollContentRef.current;
    pendingScrollRestoreRef.current = {
      scroll: scroller?.scroll ?? 0,
      height: content?.scrollHeight ?? 0,
    };

    loadingOlderRef.current = true;
    setLoadingOlder(true);
    setError("");

    try {
      const response = await fetch(
        `/api/chat/messages?limit=${CHAT_PAGE_LIMIT}&before=${encodeURIComponent(cursor)}`,
      );

      if (!response.ok) {
        throw new Error("Could not load older chatter.");
      }

      const data = (await response.json()) as ChatMessagesPage;
      setMessages((current) => prependMessages(current, data.messages));
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch {
      setError("Could not load older chatter.");
      pendingScrollRestoreRef.current = null;
    } finally {
      loadingOlderRef.current = false;
      setLoadingOlder(false);
    }
  }, []);

  useEffect(() => {
    loadOlderMessagesRef.current = () => {
      void loadOlderMessages();
    };
  }, [loadOlderMessages]);

  useEffect(() => {
    let cancelled = false;

    async function loadMessages() {
      try {
        const response = await fetch(`/api/chat/messages?limit=${CHAT_PAGE_LIMIT}`);
        if (!response.ok) throw new Error("Could not load chat.");
        const data = (await response.json()) as ChatMessagesPage;
        if (!cancelled) {
          shouldScrollToBottomRef.current = true;
          setMessages(data.messages);
          setNextCursor(data.nextCursor);
          setHasMore(data.hasMore);
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
      if (atLatestRef.current) {
        shouldScrollToBottomRef.current = true;
      }
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
    const unsubscribe = lenis.on("scroll", (instance) => {
      const isNearBottom =
        instance.limit - instance.scroll <= BOTTOM_PRESENT_THRESHOLD;
      if (atLatestRef.current !== isNearBottom) {
        atLatestRef.current = isNearBottom;
        setAtLatest(isNearBottom);

        if (jumpToPresentTimeoutRef.current) {
          window.clearTimeout(jumpToPresentTimeoutRef.current);
          jumpToPresentTimeoutRef.current = null;
        }

        if (isNearBottom) {
          setShowJumpToPresent(false);
        } else {
          jumpToPresentTimeoutRef.current = window.setTimeout(() => {
            setShowJumpToPresent(true);
            jumpToPresentTimeoutRef.current = null;
          }, JUMP_TO_PRESENT_DELAY_MS);
        }
      }

      if (instance.scroll <= TOP_LOAD_THRESHOLD) {
        loadOlderMessagesRef.current();
      }
    });

    communityScrollerRef.current = lenis;

    return () => {
      if (jumpToPresentTimeoutRef.current) {
        window.clearTimeout(jumpToPresentTimeoutRef.current);
        jumpToPresentTimeoutRef.current = null;
      }
      unsubscribe();
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
      const content = scrollContentRef.current;
      const endMarker = messagesEndRef.current;
      const scrollRestore = pendingScrollRestoreRef.current;

      if (scrollRestore && scroller && content) {
        pendingScrollRestoreRef.current = null;
        scroller.resize();
        scroller.scrollTo(
          scrollRestore.scroll + content.scrollHeight - scrollRestore.height,
          { immediate: true },
        );
        return;
      }

      if (!scroller || !endMarker) {
        endMarker?.scrollIntoView({ block: "end" });
        return;
      }

      if (shouldScrollToBottomRef.current || atLatestRef.current) {
        shouldScrollToBottomRef.current = false;
        scroller.scrollTo(endMarker, { immediate: true });
        atLatestRef.current = true;
        setAtLatest(true);
      }
    });
  }, [communityItems.length]);

  function jumpToPresent() {
    const scroller = communityScrollerRef.current;
    const endMarker = messagesEndRef.current;

    if (scroller && endMarker) {
      scroller.scrollTo(endMarker, { immediate: true });
    } else {
      endMarker?.scrollIntoView({ block: "end" });
    }

    atLatestRef.current = true;
    shouldScrollToBottomRef.current = false;
    if (jumpToPresentTimeoutRef.current) {
      window.clearTimeout(jumpToPresentTimeoutRef.current);
      jumpToPresentTimeoutRef.current = null;
    }
    setAtLatest(true);
    setShowJumpToPresent(false);
  }

  function insertEmoji(emojiData: EmojiClickData) {
    const input = inputRef.current;
    const selectionStart = input?.selectionStart ?? body.length;
    const selectionEnd = input?.selectionEnd ?? selectionStart;
    const nextBody = `${body.slice(0, selectionStart)}${emojiData.emoji}${body.slice(
      selectionEnd,
    )}`.slice(0, CHAT_MESSAGE_MAX_LENGTH);
    const nextCursor = Math.min(
      selectionStart + emojiData.emoji.length,
      nextBody.length,
    );

    setBody(nextBody);
    setShowEmojiPicker(false);
    window.requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(nextCursor, nextCursor);
    });
  }

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
      shouldScrollToBottomRef.current = true;
      shouldRefocusInputRef.current = true;
      setMessages((current) => appendMessage(current, message));
      setBody("");
      setShowEmojiPicker(false);
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
          <VisitorLiveCount fallback={connected ? "live" : "offline"} />
        </span>
      </div>

      <div
        ref={scrollWrapperRef}
        className="relative min-h-0 flex-1 overflow-hidden"
        data-lenis-prevent
      >
        <div ref={scrollContentRef} className="px-5 py-4">
          {loadingOlder && (
            <p className="ui-muted pb-3 text-center text-xs">loading older chatter...</p>
          )}
          {communityItems.length === 0 ? (
            <p className="ui-muted text-sm">no community updates yet</p>
          ) : (
            communityItems.map((item, index) => {
              const isLatestItem = index === communityItems.length - 1;
              const shouldAnimateItem =
                isLatestItem || isRecentChatItem(item.date, animationNow);
              const itemDate = formatChatDate(item.date);
              const previousDate =
                index > 0 ? formatChatDate(communityItems[index - 1].date) : null;
              const showDate = itemDate !== previousDate;

              if (item.type === "activity") {
                return (
                  <Fragment key={item.id}>
                    {showDate && (
                      <div className="chat-date-divider" aria-label={itemDate}>
                        {itemDate}
                      </div>
                    )}
                    <article className="chat-message chat-line">
                      <time className="chat-time" dateTime={item.event.date}>
                        {formatChatTime(item.event.date)}
                      </time>
                      <ChatAuthor user={item.event.user} />
                      <span className="chat-colon">:</span>
                      <span
                        className={`chat-context wrap-break-word ${
                          shouldAnimateItem ? "chat-latest-text-bop" : ""
                        }`}
                      >
                        {item.event.message}
                      </span>
                    </article>
                  </Fragment>
                );
              }

              return (
                <Fragment key={item.id}>
                  {showDate && (
                    <div className="chat-date-divider" aria-label={itemDate}>
                      {itemDate}
                    </div>
                  )}
                  <article className="chat-message chat-line">
                    <time className="chat-time" dateTime={item.message.createdAt}>
                      {formatChatTime(item.message.createdAt)}
                    </time>
                    <ChatAuthor user={item.message.sender} />
                    <span className="chat-colon">:</span>
                    <span
                      className={`chat-text wrap-break-word ${
                        shouldAnimateItem ? "chat-latest-text-bop" : ""
                      }`}
                    >
                      {item.message.body}
                    </span>
                  </article>
                </Fragment>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
        <button
          type="button"
          onClick={jumpToPresent}
          className={`ui-btn ui-btn-accent absolute! bottom-3 left-1/2 z-50! bg-surface! shadow-lg text-xs transition-all duration-700 ease-out ${
            showJumpToPresent
              ? "-translate-x-1/2 translate-y-0 scale-100 opacity-100"
              : "pointer-events-none -translate-x-1/2 translate-y-5 scale-95 opacity-0"
          }`}
          aria-hidden={!showJumpToPresent}
          tabIndex={showJumpToPresent ? 0 : -1}
        >
          jump to present
        </button>
      </div>

      <form onSubmit={handleSubmit} className="shrink-0 border-t border-border p-3">
        {error && <p className="ui-muted mb-2 text-xs">{error}</p>}

        {user ? (
          <div className="relative flex gap-2">
            {showEmojiPicker && (
              <div
                className="absolute bottom-full left-0 z-50 mb-2 w-[min(24rem,calc(100vw-2rem))]"
                data-lenis-prevent
                onTouchMove={(event) => event.stopPropagation()}
                onWheel={(event) => event.stopPropagation()}
              >
                <EmojiPicker
                  className="chat-emoji-picker"
                  emojiStyle={EmojiStyle.NATIVE}
                  height={340}
                  previewConfig={{ showPreview: false }}
                  searchPlaceHolder="search emoji"
                  skinTonesDisabled
                  theme={Theme.DARK}
                  width="100%"
                  onEmojiClick={insertEmoji}
                />
              </div>
            )}
            <button
              type="button"
              className="ui-btn"
              disabled={busy}
              aria-expanded={showEmojiPicker}
              aria-label="add emoji"
              onClick={() => setShowEmojiPicker((current) => !current)}
            >
              :)
            </button>
            <input
              ref={inputRef}
              type="text"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              maxLength={CHAT_MESSAGE_MAX_LENGTH}
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
