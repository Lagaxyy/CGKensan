"use client";

import { createContext, useContext } from "react";
import type { NotificationContextValue } from "./types";

export const NotificationContext = createContext<NotificationContextValue | null>(
  null
);

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return ctx;
}
