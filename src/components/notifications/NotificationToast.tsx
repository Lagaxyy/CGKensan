"use client";

import { useEffect, useState } from "react";
import { useNotifications } from "./NotificationContext";
import type { NotificationType } from "./types";

const typeAccentMap: Record<NotificationType, string> = {
  info: "var(--accent)",
  success: "#4ade80",
  warning: "#fbbf24",
  error: "#f87171",
};

function ToastItem({
  id,
  title,
  message,
  type,
}: {
  id: string;
  title: string;
  message?: string | null;
  type: NotificationType;
}) {
  const { dismissToast } = useNotifications();
  const [phase, setPhase] = useState<"enter" | "idle" | "exit">("enter");

  useEffect(() => {
    // Slide in from right on next frame
    const enterTimer = requestAnimationFrame(() => {
      setPhase("idle");
    });

    // After 3 seconds, slide out to the right
    const exitTimer = setTimeout(() => {
      setPhase("exit");
    }, 3000);

    // Remove from DOM after exit animation completes
    const removeTimer = setTimeout(() => {
      dismissToast(id);
    }, 3400);

    return () => {
      cancelAnimationFrame(enterTimer);
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [id, dismissToast]);

  const accent = typeAccentMap[type] ?? typeAccentMap.info;

  const transform =
    phase === "enter"
      ? "translateX(120%)"
      : phase === "exit"
        ? "translateX(120%)"
        : "translateX(0)";

  return (
    <div
      onClick={() => setPhase("exit")}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "14px 18px",
        background: "var(--bg-cell)",
        borderLeft: `3px solid ${accent}`,
        borderRadius: 2,
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
        cursor: "pointer",
        minWidth: 280,
        maxWidth: 380,
        opacity: phase === "idle" ? 1 : 0,
        transform,
        transition: "transform 0.4s cubic-bezier(0.23,1,0.32,1), opacity 0.35s cubic-bezier(0.23,1,0.32,1)",
        pointerEvents: "auto",
        fontFamily: "'Space Grotesk', system-ui, sans-serif",
      }}
    >
      {/* Accent dot */}
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: accent,
          flexShrink: 0,
          marginTop: 4,
          boxShadow: `0 0 8px ${accent}`,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "var(--fg)",
            lineHeight: 1.3,
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </div>
        {message && (
          <div
            style={{
              fontSize: 12,
              color: "var(--fg-dim)",
              marginTop: 4,
              lineHeight: 1.4,
            }}
          >
            {message}
          </div>
        )}
      </div>
      {/* Close x */}
      <span
        style={{
          fontSize: 14,
          color: "var(--fg-dim)",
          lineHeight: 1,
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        ×
      </span>
    </div>
  );
}

export function NotificationToast() {
  const { toasts } = useNotifications();

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 16,
        right: 16,
        zIndex: 300,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        pointerEvents: "none",
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} />
      ))}
    </div>
  );
}
