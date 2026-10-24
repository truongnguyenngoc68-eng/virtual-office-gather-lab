import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../contexts/NotificationContext";
import { formatRelativeTime } from "../utils/date";

const NotificationCenter = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    if (notification.link) {
      navigate(notification.link);
      setIsOpen(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "event_reminder":
      case "event_invite":
        return "📅";
      case "forum_mention":
      case "forum_reply":
      case "forum_like":
        return "💬";
      case "message":
        return "✉️";
      case "friend_request":
        return "👤";
      case "system":
        return "🔔";
      default:
        return "🔔";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="relative bg-none border-none text-xl cursor-pointer p-2 rounded-md transition-colors text-gray-800 hover:bg-gray-100"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[11px] font-semibold px-1.5 py-0.5 rounded-[10px] min-w-[18px] text-center leading-tight">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 md:left-auto md:right-0 w-[320px] md:w-[380px] max-h-[500px] bg-[#1a1823]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-[1000] flex flex-col overflow-hidden animate-slideDown">
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
            <h3 className="m-0 text-sm font-bold text-white font-display tracking-wide">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                className="px-3 py-1.5 bg-white/5 hover:bg-violet-600/20 hover:text-violet-300 border border-white/10 rounded-lg text-[10px] font-medium text-slate-400 cursor-pointer transition-all"
                onClick={markAllAsRead}
                title="Mark all as read"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto max-h-[400px] scrollbar-hide">
            {notifications.length === 0 ? (
              <div className="py-12 px-5 text-center text-slate-500">
                <div className="text-4xl mb-3 opacity-30">🔔</div>
                <p className="m-0 text-xs font-medium">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`flex gap-3 px-4 py-3 border-b border-white/5 cursor-pointer transition-all relative group ${
                    !notification.isRead
                      ? "bg-violet-500/10 border-l-[3px] border-l-violet-500 pl-[13px]"
                      : "hover:bg-white/5"
                  } last:border-b-0`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="text-xl shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-slate-300">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-semibold mb-1 leading-tight ${!notification.isRead ? 'text-white' : 'text-slate-300'}`}>
                      {notification.title}
                    </div>
                    <div className="text-[12px] text-slate-400 mb-1.5 leading-tight line-clamp-2 font-light">
                      {notification.message}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium tracking-wide">
                      {formatRelativeTime(notification.createdAt)}
                    </div>
                  </div>
                  <button
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-400 border border-transparent hover:border-red-500/30 text-slate-500 text-xs cursor-pointer flex items-center justify-center opacity-0 transition-all group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification._id);
                    }}
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
