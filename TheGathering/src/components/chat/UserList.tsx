import { useMemo } from "react";

interface User {
  userId: string;
  username: string;
  avatar?: string;
  status?: "online" | "offline" | "away" | "busy";
  currentVoiceChannel?: string;
  roles?: string[];
  role?: "admin" | "member";
}

interface UserListProps {
  users: User[];
  currentUserId?: string;
  onUserClick?: (userId: string) => void;
  searchQuery?: string;
  className?: string;
}

const UserList = ({
  users,
  currentUserId,
  onUserClick,
  searchQuery = "",
  className = "",
}: UserListProps) => {
  const { onlineUsers, offlineUsers } = useMemo(() => {
    const filtered = users.filter((user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Separate online and offline users based on status
    const online = filtered.filter(
      (user) =>
        user.status === "online" || !user.status || user.status === undefined
    );
    const offline = filtered.filter((user) => user.status === "offline");

    return {
      onlineUsers: online,
      offlineUsers: offline,
    };
  }, [users, searchQuery]);

  const getStatusColor = (status?: string): string => {
    switch (status) {
      case "online":
        return "#43b581";
      case "away":
        return "#faa61a";
      case "busy":
        return "#f04747";
      default:
        return "#43b581";
    }
  };

  return (
    <div
      className={`w-60 bg-linear-to-b from-[#2f3136] to-[#202225] flex flex-col overflow-hidden shadow-[-2px_0_8px_rgba(0,0,0,0.15)] ${className}`}
    >
      {/* Optional Search */}
      {searchQuery !== undefined && (
        <div className="px-3 py-3 bg-[#2f3136]/50 backdrop-blur-sm">
          <input
            type="text"
            placeholder="Tìm kiếm"
            className="w-full px-3 py-2 bg-[#202225]/80 border border-[#202225] rounded-lg text-[13px] text-[#dcddde] placeholder:text-[#72767d] transition-all duration-200 focus:outline-none focus:bg-[#1e1f22] focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
            readOnly
          />
        </div>
      )}

      {/* Online Users */}
      <div className="flex-1 overflow-y-auto py-3 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#202225] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-[#1a1c1f]">
        <div className="px-4 py-2 mb-2">
          <span className="text-xs font-bold text-[#72767d] uppercase tracking-widest flex items-center gap-2">
            <div className="w-1 h-4 bg-linear-to-b from-green-400 to-green-500 rounded-full shadow-[0_0_8px_rgba(67,181,129,0.5)]"></div>
            Trực tuyến - {onlineUsers.length}
          </span>
        </div>
        <div className="flex flex-col gap-1 px-2">
          {onlineUsers.map((user) => (
            <div
              key={user.userId}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-[#3c3f44]/80 hover:translate-x-1 group ${
                user.userId === currentUserId ? "bg-linear-to-r from-indigo-500/20 to-purple-500/20 border-l-2 border-indigo-500" : ""
              }`}
              onClick={() => onUserClick?.(user.userId)}
            >
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-full bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center font-bold text-sm shadow-[0_2px_8px_rgba(99,102,241,0.3)] group-hover:shadow-[0_4px_12px_rgba(99,102,241,0.4)] group-hover:scale-110 transition-all">
                  {user.avatar || user.username.charAt(0).toUpperCase()}
                </div>
                <div
                  className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-[2.5px] border-[#2f3136] shadow-[0_2px_4px_rgba(34,197,94,0.4)]"
                  style={{
                    backgroundColor: getStatusColor(user.status),
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-[#dcddde] whitespace-nowrap overflow-hidden text-ellipsis">
                  {user.username}
                </div>
                {(user.role === "admin" || (user.roles && user.roles.length > 0)) && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {user.role === "admin" && (
                      <span className="text-[10px] px-2 py-0.5 bg-linear-to-r from-amber-500 to-orange-500 text-white rounded-full font-bold shadow-sm">
                        ADMIN
                      </span>
                    )}
                    {user.roles?.map((role, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 bg-linear-to-r from-indigo-500 to-indigo-600 text-white rounded-full font-bold shadow-sm"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {user.currentVoiceChannel && (
                <div
                  className="text-base shrink-0 opacity-70"
                  title="In voice channel"
                >
                  🎤
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Offline Users - Always show section even if empty */}
      <div className="flex-1 overflow-y-auto py-3 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#202225] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-[#1a1c1f]">
        <div className="px-4 py-2 mb-2">
          <span className="text-xs font-bold text-[#72767d] uppercase tracking-widest flex items-center gap-2">
            <div className="w-1 h-4 bg-linear-to-b from-gray-400 to-gray-500 rounded-full"></div>
            Ngoại tuyến - {offlineUsers.length}
          </span>
        </div>
        {offlineUsers.length > 0 ? (
          <div className="flex flex-col gap-1 px-2">
            {offlineUsers.map((user) => (
              <div
                key={user.userId}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 opacity-75 hover:opacity-100 hover:bg-[#3c3f44]/60 hover:translate-x-1 group ${
                  user.userId === currentUserId ? "bg-linear-to-r from-gray-500/20 to-gray-600/20 border-l-2 border-gray-500" : ""
                }`}
                onClick={() => onUserClick?.(user.userId)}
              >
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-full bg-linear-to-br from-gray-400 to-gray-500 text-white flex items-center justify-center font-bold text-sm opacity-60 shadow-sm group-hover:opacity-80 group-hover:scale-110 transition-all">
                    {user.avatar || user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-[2.5px] border-[#2f3136] bg-[#72767d]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[#dcddde] whitespace-nowrap overflow-hidden text-ellipsis opacity-70 group-hover:opacity-100">
                    {user.username}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-2 text-center">
            <span className="text-xs text-[#72767d] italic">
              Không có người ngoại tuyến
            </span>
          </div>
        )}
      </div>

      {/* Footer Icons */}
      <div className="p-2 border-t border-[#202225] flex items-center justify-center gap-2 bg-[#2f3136]">
        <button
          className="bg-transparent border-none cursor-pointer text-xl p-1 text-[#96989d] transition-colors duration-200 w-8 h-8 flex items-center justify-center rounded hover:text-[#dcddde] hover:bg-[#3c3f44]"
          title="Emoji"
        >
          😀
        </button>
        <button
          className="bg-transparent border-none cursor-pointer text-xl p-1 text-[#96989d] transition-colors duration-200 w-8 h-8 flex items-center justify-center rounded hover:text-[#dcddde] hover:bg-[#3c3f44]"
          title="GIF"
        >
          🎬
        </button>
        <button
          className="bg-transparent border-none cursor-pointer text-xl p-1 text-[#96989d] transition-colors duration-200 w-8 h-8 flex items-center justify-center rounded hover:text-[#dcddde] hover:bg-[#3c3f44]"
          title="Sticker"
        >
          🎨
        </button>
        <button
          className="bg-transparent border-none cursor-pointer text-xl p-1 text-[#96989d] transition-colors duration-200 w-8 h-8 flex items-center justify-center rounded hover:text-[#dcddde] hover:bg-[#3c3f44]"
          title="Gift"
        >
          🎁
        </button>
      </div>
    </div>
  );
};

export default UserList;
