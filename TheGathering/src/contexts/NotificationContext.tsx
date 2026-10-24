import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { useSocket } from "./SocketContext";

export interface Notification {
  _id: string;
  type: "message" | "friend_request" | "system";
  title: string;
  message: string;
  link?: string;
  relatedId?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationProvider"
    );
  }
  return context;
};

const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser } = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:5001";

  const fetchNotifications = useCallback(async () => {
    if (!currentUser) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      // No token, skip fetching notifications
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${serverUrl}/api/notifications?limit=50`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } else if (response.status === 401) {
        // Token expired or invalid, clear notifications
        setNotifications([]);
        setUnreadCount(0);
        // Stop further polling spam by clearing invalid token
        localStorage.removeItem("token");
        // Don't redirect here as it might be called frequently
        // The user will be redirected when they try to perform an action
      } else if (response.status === 429) {
        // Rate limit exceeded - silently skip this poll, will retry next interval
        const data = await response.json().catch(() => ({}));
        const retryAfter = data.retryAfter || 60;
        console.warn(
          `Rate limit exceeded for notifications. Will retry in ${retryAfter} seconds.`
        );
        // Don't update state, just wait for next poll
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.userId, serverUrl]);

  useEffect(() => {
    fetchNotifications();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${serverUrl}/api/notifications/${notificationId}/read`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          setNotifications((prev) =>
            prev.map((n) =>
              n._id === notificationId
                ? { ...n, isRead: true, readAt: new Date().toISOString() }
                : n
            )
          );
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    },
    [serverUrl]
  );

  const markAllAsRead = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${serverUrl}/api/notifications/read-all`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({
            ...n,
            isRead: true,
            readAt: new Date().toISOString(),
          }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  }, [serverUrl]);

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${serverUrl}/api/notifications/${notificationId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const notification = notifications.find(
            (n) => n._id === notificationId
          );
          setNotifications((prev) =>
            prev.filter((n) => n._id !== notificationId)
          );
          if (notification && !notification.isRead) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        }
      } catch (error) {
        console.error("Error deleting notification:", error);
      }
    },
    [notifications, serverUrl]
  );

  const refreshNotifications = useCallback(() => {
    return fetchNotifications();
  }, [fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

NotificationProvider.displayName = "NotificationProvider";

export { NotificationProvider };
