"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Check,
  Trash2,
  X,
} from "lucide-react";
import { useNotifications } from "./NotificationContext";
import type { Notification, NotificationType } from "./types";

const typeAccentMap: Record<NotificationType, string> = {
  info: "var(--accent)",
  success: "#4ade80",
  warning: "#fbbf24",
  error: "#f87171",
};

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 10) return "à l'instant";
  if (diffSec < 60) return `il y a ${diffSec}s`;
  if (diffMin < 60) return `il y a ${diffMin}min`;
  if (diffHr < 24) return `il y a ${diffHr}h`;
  if (diffDay < 7) return `il y a ${diffDay}j`;
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

function NotificationItem({ notification }: { notification: Notification }) {
  const { markAsRead, deleteNotification } = useNotifications();
  const accent = typeAccentMap[notification.type] ?? typeAccentMap.info;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "12px 16px",
        borderBottom: "1px solid var(--border)",
        transition: "background 0.25s ease",
        cursor: "pointer",
        opacity: notification.read ? 0.55 : 1,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--accent-soft)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
      onClick={() => {
        if (!notification.read) markAsRead(notification.id);
      }}
    >
      {/* Unread indicator */}
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: notification.read ? "transparent" : accent,
          flexShrink: 0,
          marginTop: 6,
          boxShadow: notification.read ? "none" : `0 0 6px ${accent}`,
          transition: "all 0.3s ease",
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: notification.read ? 400 : 700,
            color: "var(--fg)",
            lineHeight: 1.35,
            letterSpacing: "-0.01em",
            wordBreak: "break-word",
          }}
        >
          {notification.title}
        </div>
        {notification.message && (
          <div
            style={{
              fontSize: 11,
              color: "var(--fg-dim)",
              marginTop: 3,
              lineHeight: 1.4,
              wordBreak: "break-word",
            }}
          >
            {notification.message}
          </div>
        )}
        <div
          style={{
            fontSize: 10,
            color: "var(--fg-dim)",
            marginTop: 5,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
          }}
        >
          {formatRelativeTime(notification.createdAt)}
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          deleteNotification(notification.id);
        }}
        aria-label="Supprimer"
        style={{
          background: "transparent",
          border: "none",
          color: "var(--fg-dim)",
          cursor: "pointer",
          padding: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 4,
          transition: "color 0.2s ease",
          flexShrink: 0,
          marginTop: 2,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "var(--accent)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "var(--fg-dim)";
        }}
      >
        <Trash2 size={13} strokeWidth={1.5} />
      </button>
    </div>
  );
}

export function NotificationSidebar() {
  const {
    notifications,
    sidebarOpen,
    closeSidebar,
    markAllAsRead,
    unreadCount,
  } = useNotifications();
  const [isVisible, setIsVisible] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Handle enter/exit animation
  useEffect(() => {
    if (sidebarOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 350);
      return () => clearTimeout(timer);
    }
  }, [sidebarOpen]);

  // Close on escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && sidebarOpen) closeSidebar();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [sidebarOpen, closeSidebar]);

  // Close on click outside
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) closeSidebar();
  };

  if (!isVisible && !sidebarOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 260,
        background: sidebarOpen ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0)",
        opacity: sidebarOpen ? 1 : 0,
        transition: "background 0.35s ease, opacity 0.35s ease",
        pointerEvents: sidebarOpen ? "auto" : "none",
      }}
    >
      <aside
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: "clamp(320px, 30vw, 400px)",
          maxWidth: "100%",
          background: "var(--bg-cell)",
          borderLeft: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          transform: sidebarOpen
            ? "translateX(0)"
            : "translateX(100%)",
          transition: "transform 0.35s cubic-bezier(0.23,1,0.32,1)",
          fontFamily: "'Space Grotesk', system-ui, sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 18px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Bell size={18} strokeWidth={1.5} color="var(--fg)" />
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--fg)",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
              }}
            >
              Notifications
            </span>
            {unreadCount > 0 && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--accent)",
                  background: "var(--accent-soft)",
                  padding: "2px 7px",
                  borderRadius: 10,
                  letterSpacing: "0.02em",
                }}
              >
                {unreadCount}
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                aria-label="Tout marquer comme lu"
                style={{
                  background: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: 4,
                  color: "var(--fg-dim)",
                  cursor: "pointer",
                  padding: "5px 8px",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  transition: "all 0.25s ease",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.color = "var(--accent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.color = "var(--fg-dim)";
                }}
              >
                <Check size={12} strokeWidth={1.5} />
                Tout lire
              </button>
            )}
            <button
              onClick={closeSidebar}
              aria-label="Fermer"
              style={{
                background: "transparent",
                border: "none",
                color: "var(--fg-dim)",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 4,
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--fg-dim)";
              }}
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* List */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          {notifications.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                gap: 12,
                padding: 32,
              }}
            >
              <Bell
                size={32}
                strokeWidth={1}
                color="var(--fg-dim)"
                style={{ opacity: 0.3 }}
              />
              <span
                style={{
                  fontSize: 12,
                  color: "var(--fg-dim)",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                }}
              >
                Aucune notification
              </span>
            </div>
          ) : (
            notifications.map((n) => (
              <NotificationItem key={n.id} notification={n} />
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
