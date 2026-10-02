"use client";

import { Bell } from "lucide-react";
import { useNotifications } from "./NotificationContext";

export function NotificationBell() {
  const { unreadCount, toggleSidebar } = useNotifications();

  return (
    <button
      onClick={toggleSidebar}
      aria-label="Notifications"
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 250,
        width: 52,
        height: 52,
        borderRadius: "50%",
        border: "1px solid var(--border)",
        background: "var(--bg-cell)",
        color: "var(--fg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "all 0.35s cubic-bezier(0.23,1,0.32,1)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        fontFamily: "'Space Grotesk', system-ui, sans-serif",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--accent)";
        e.currentTarget.style.color = "var(--accent)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.color = "var(--fg)";
      }}
    >
      <Bell size={22} strokeWidth={1.5} />
      {unreadCount > 0 && (
        <span
          style={{
            position: "absolute",
            top: -2,
            right: -2,
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            background: "var(--accent)",
            color: "white",
            fontSize: 10,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 5px",
            boxShadow: "0 0 8px rgba(232,93,117,0.5)",
            letterSpacing: "0.02em",
          }}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
}
