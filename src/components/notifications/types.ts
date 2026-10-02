export type NotificationType = "info" | "success" | "warning" | "error";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string | null;
  type: NotificationType;
  read: boolean;
  createdAt: string;
}

export interface Toast {
  id: string;
  title: string;
  message?: string | null;
  type: NotificationType;
}

export interface NotificationContextValue {
  notifications: Notification[];
  toasts: Toast[];
  unreadCount: number;
  sidebarOpen: boolean;
  notify: (toast: Omit<Toast, "id">) => void;
  dismissToast: (id: string) => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}
