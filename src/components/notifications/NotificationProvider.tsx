"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";
import { NotificationContext } from "./NotificationContext";
import type { Notification, NotificationContextValue, Toast } from "./types";

const TOAST_DURATION_MS = 3000;
const POLL_INTERVAL_MS = 30000;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated" && !!session?.user?.id;
  const userId = session?.user?.id ?? null;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const toastTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const seenNotificationIdsRef = useRef<Set<string>>(new Set());
  const isFirstFetchRef = useRef(true);

  // Compute unread count
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Fetch notifications from API and toast new ones
  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) {
        if (res.status === 401) return;
        throw new Error(`Failed to fetch notifications: ${res.status}`);
      }
      const data = await res.json();
      const fetchedNotifications: Notification[] = data.notifications ?? [];

      if (isFirstFetchRef.current) {
        // First load: remember all existing IDs, don't toast historical ones
        isFirstFetchRef.current = false;
        fetchedNotifications.forEach((n) => seenNotificationIdsRef.current.add(n.id));
      } else {
        // Subsequent polls: toast notifications we haven't seen yet
        fetchedNotifications.forEach((n) => {
          if (!seenNotificationIdsRef.current.has(n.id)) {
            seenNotificationIdsRef.current.add(n.id);
            notifyRef.current({
              title: n.title,
              message: n.message,
              type: n.type,
            });
          }
        });
      }

      setNotifications(fetchedNotifications);
    } catch (_e) {
      // Silently fail — notifications are not critical
    }
  }, [isAuthenticated]);

  // Add a toast to the queue with auto-dismiss
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = toastTimersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      toastTimersRef.current.delete(id);
    }
  }, []);

  const notify = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = generateId();
      const newToast: Toast = { ...toast, id };
      setToasts((prev) => [...prev, newToast]);

      const timer = setTimeout(() => {
        dismissToast(id);
      }, TOAST_DURATION_MS);
      toastTimersRef.current.set(id, timer);
    },
    [dismissToast]
  );

  // Memoized stable ref so refreshNotifications can call notify without circular dependency
  const notifyRef = useRef(notify);
  useEffect(() => {
    notifyRef.current = notify;
  }, [notify]);

  // Mark a single notification as read
  const markAsRead = useCallback(
    async (id: string) => {
      if (!isAuthenticated) return;
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      try {
        const res = await fetch(`/api/notifications/${id}/read`, {
          method: "PATCH",
        });
        if (!res.ok) {
          // Revert on failure
          refreshNotifications();
        }
      } catch (_e) {
        refreshNotifications();
      }
    },
    [isAuthenticated, refreshNotifications]
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!isAuthenticated) return;
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      const res = await fetch("/api/notifications/read-all", {
        method: "PATCH",
      });
      if (!res.ok) {
        refreshNotifications();
      }
    } catch (_e) {
      refreshNotifications();
    }
  }, [isAuthenticated, refreshNotifications]);

  // Delete a notification
  const deleteNotification = useCallback(
    async (id: string) => {
      if (!isAuthenticated) return;
      // Optimistic update
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      try {
        const res = await fetch(`/api/notifications/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          refreshNotifications();
        }
      } catch (_e) {
        refreshNotifications();
      }
    },
    [isAuthenticated, refreshNotifications]
  );

  // Sidebar controls
  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(
    () => setSidebarOpen((prev) => !prev),
    []
  );

  // Initial fetch + polling
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      return;
    }
    refreshNotifications();
    const interval = setInterval(refreshNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isAuthenticated, refreshNotifications]);

  // Socket.IO connection for real-time notifications
  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    let socket: Socket | null = null;
    let cancelled = false;

    async function connect() {
      try {
        const res = await fetch("/api/ws-token");
        if (!res.ok) return;
        const { token } = await res.json();

        if (cancelled) return;

        socket = io(
          (process.env.NODE_ENV === "production")
            ? process.env.NEXT_PUBLIC_SOCKET_URL
            : "http://localhost:3001",
          {
            path: "/api/socket",
            auth: { token },
            reconnectionDelay: 2000,
            reconnectionDelayMax: 10000,
          }
        );
        socketRef.current = socket;

        socket.on("notification", (notification: Notification) => {
          setNotifications((prev) => {
            if (prev.some((n) => n.id === notification.id)) return prev;
            return [notification, ...prev];
          });
          notify({
            title: notification.title,
            message: notification.message,
            type: notification.type
          });
        });

        socket.on("connect_error", async () => {
          try {
            const r = await fetch("/api/ws-token");
            if (r.ok && socket) {
              socket.auth = { token: (await r.json()).token };
            }
          } catch {
            // Polling covers the gap, Socket.IO will retry with backoff
          }
        });

        socket.on("disconnect", () => {
          // Will auto-reconnect
        });
      } catch {
        // Socket not available, polling handles fallback
      }
    }

    void connect();

    return () => {
      cancelled = true;
      socket?.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, userId, notify]);

  // Cleanup toast timers on unmount
  useEffect(() => {
    return () => {
      toastTimersRef.current.forEach((timer) => clearTimeout(timer));
      toastTimersRef.current.clear();
    };
  }, []);

  const value: NotificationContextValue = {
    notifications,
    toasts,
    unreadCount,
    sidebarOpen,
    notify,
    dismissToast,
    openSidebar,
    closeSidebar,
    toggleSidebar,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
