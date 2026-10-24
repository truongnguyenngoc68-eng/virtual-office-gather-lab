import React, { useMemo } from "react";
import type { User } from "../../contexts/SocketContext";

interface UserListProps {
  onlineUsers: User[];
  offlineUsers: User[];
  searchQuery: string;
}

/**
 * User list component for Sidebar
 * Displays online and offline users with search filtering
 */
export const UserList: React.FC<UserListProps> = React.memo(({ onlineUsers, offlineUsers, searchQuery }) => {
  const filteredOnline = useMemo(
    () =>
      onlineUsers.filter((u) => u.username.toLowerCase().includes(searchQuery.toLowerCase())),
    [onlineUsers, searchQuery]
  );

  const filteredOffline = useMemo(
    () =>
      offlineUsers.filter((u) => u.username.toLowerCase().includes(searchQuery.toLowerCase())),
    [offlineUsers, searchQuery]
  );

  const truncateUsername = (username: string, maxLength: number = 18) => {
    return username.length > maxLength ? `${username.slice(0, 15)}...` : username;
  };

  const UserItem: React.FC<{ user: User; isOnline: boolean }> = ({ user, isOnline }) => (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors group">
      <div className="relative flex-shrink-0">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm"
          style={{
            background: `linear-gradient(135deg, ${
              (user as any).profileColor || "#4f46e5"
            } 0%, ${(user as any).profileColor || "#7c3aed"} 100%)`,
          }}
        >
          {String(user.username?.[0] || "U").toUpperCase()}
        </div>
        {isOnline && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">
          {truncateUsername(user.username)}
        </div>
        {isOnline && (
          <div className="text-[10px] text-slate-400 font-light">Online</div>
        )}
      </div>
    </div>
  );

  UserItem.displayName = "UserItem";

  return (
    <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      {filteredOnline.length > 0 && (
        <div className="mb-3">
          <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Online ({filteredOnline.length})
          </div>
          <div className="space-y-1">
            {filteredOnline.map((user) => (
              <UserItem key={user.username} user={user} isOnline={true} />
            ))}
          </div>
        </div>
      )}

      {filteredOffline.length > 0 && (
        <div>
          <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Offline ({filteredOffline.length})
          </div>
          <div className="space-y-1">
            {filteredOffline.map((user) => (
              <UserItem key={user.username} user={user} isOnline={false} />
            ))}
          </div>
        </div>
      )}

      {filteredOnline.length === 0 && filteredOffline.length === 0 && (
        <div className="px-3 py-8 text-center">
          <p className="text-sm text-slate-500">No users found</p>
        </div>
      )}
    </div>
  );
});

UserList.displayName = "UserList";
