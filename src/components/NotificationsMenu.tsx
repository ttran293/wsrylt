"use client";

import { useEffect, useRef, useState } from "react";
import { DateDisplay } from "@/components/DateDisplay";
import { BellIcon } from "@/components/NavIcons";
import type { NotificationPublic } from "@/types";

interface NotificationsResponse {
  notifications: NotificationPublic[];
  unreadCount: number;
}

function getNotificationText(notification: NotificationPublic) {
  if (notification.type === "like") {
    return `${notification.actor.name} liked your post`;
  }

  return `${notification.actor.name} commented on your post`;
}

function getPostPreview(notification: NotificationPublic) {
  return notification.post.caption || "your song";
}

export function NotificationsMenu() {
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationPublic[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function loadNotifications() {
    setLoading(true);
    try {
      const response = await fetch("/api/notifications", {
        cache: "no-store",
      });
      if (!response.ok) return;

      const data = (await response.json()) as NotificationsResponse;
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } finally {
      setLoading(false);
    }
  }

  async function markAllRead() {
    if (unreadCount === 0) return;

    setBusy(true);
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      });
      if (!response.ok) return;

      const data = (await response.json()) as { unreadCount: number };
      setUnreadCount(data.unreadCount);
      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          read: true,
        })),
      );
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void loadNotifications();
  }, []);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", closeOnOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
    };
  }, [open]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`ui-btn notification-trigger ${unreadCount > 0 ? "ui-btn-accent" : ""}`}
        aria-expanded={open}
        aria-label={`${unreadCount} unread notifications`}
      >
        <BellIcon className="notification-icon" />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notification-menu ui-panel" data-lenis-prevent>
          <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
            <p className="ui-title text-sm font-medium no-underline">
              notifications
            </p>
            <button
              type="button"
              disabled={busy || unreadCount === 0}
              onClick={markAllRead}
              className="ui-btn text-xs"
            >
              [ mark read ]
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto" data-lenis-prevent>
            {loading ? (
              <p className="ui-muted p-4 text-sm">loading...</p>
            ) : notifications.length === 0 ? (
              <p className="ui-muted p-4 text-sm">no notifications yet.</p>
            ) : (
              <ul>
                {notifications.map((notification) => (
                  <li
                    key={notification._id}
                    className={`notification-item ${
                      notification.read ? "" : "notification-item-unread"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        {getNotificationText(notification)}
                      </p>
                      <p className="ui-muted mt-1 truncate text-xs">
                        {getPostPreview(notification)}
                      </p>
                      {notification.comment && (
                        <p className="ui-muted mt-1 truncate text-xs">
                          &quot;{notification.comment.content}&quot;
                        </p>
                      )}
                      <DateDisplay date={notification.createdAt} />
                    </div>
                    {!notification.read && (
                      <span
                        className="notification-dot"
                        aria-label="unread"
                      />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
