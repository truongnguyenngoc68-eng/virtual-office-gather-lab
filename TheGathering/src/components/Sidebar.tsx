import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSocket } from "../contexts/SocketContext";
import { InviteModal } from "./modals";
import SettingsModal from "./modals/SettingsModal";
import { SidebarTabs } from "./sidebar/SidebarTabs";
import { SidebarHeader } from "./sidebar/SidebarHeader";
import { useUserList } from "../hooks/useUserList";

const Sidebar = () => {
  const { users, currentUser, isConnected, socket } = useSocket();
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab based on current route
  const getActiveTab = () => {
    if (location.pathname.includes("/app/events")) return "events";
    if (location.pathname.includes("/app/chat")) return "chat";
    if (location.pathname.includes("/app/admin")) return "admin";
    if (location.pathname.includes("/app/library")) return "game"; // building icon = Library
    if (location.pathname.startsWith("/app/")) return "users"; // people icon = Office (game view)
    return "users";
  };

  const [activeTab, setActiveTab] = useState<"users" | "chat" | "events" | "admin" | "game">(getActiveTab());

  // Sync activeTab when location changes
  useEffect(() => {
    setActiveTab(getActiveTab());
  }, [location.pathname]);

  // Use custom hook for user list logic
  const {
    onlineUsers,
    offlineUsers,
    filteredOnlineUsers,
    filteredOfflineUsers,
  } = useUserList({
    users,
    currentUser,
    searchQuery,
  });
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const RESERVED_ROUTES = ["chat", "events", "profile", "admin", "library"];
  const storedRoomId = localStorage.getItem("roomId");
  const roomIdFromStorage =
    storedRoomId && !RESERVED_ROUTES.includes(storedRoomId)
      ? storedRoomId
      : null;

  const resolveTargetRoom = () => {
    try {
      const saved = localStorage.getItem("savedRooms");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const valid = parsed.find(
            (r: any) =>
              r &&
              typeof r.id === "string" &&
              !RESERVED_ROUTES.includes(r.id)
          );
          if (valid?.id) {
            return valid.id as string;
          }
        }
      }
    } catch (e) {
      console.warn("Failed to parse savedRooms", e);
    }
    if (roomIdFromStorage && !RESERVED_ROUTES.includes(roomIdFromStorage)) {
      return roomIdFromStorage;
    }
    return "default-room";
  };

  const currentRoomId = resolveTargetRoom();

  const handleExit = () => {
    if (socket) {
      console.log("Disconnecting socket before exit...");
      socket.disconnect();
    }
    localStorage.removeItem("roomId");
    localStorage.removeItem("userId");
    navigate("/spaces");
  };

  const handleTabClick = (tab: "users" | "chat" | "events" | "admin" | "game") => {
    setActiveTab(tab);
    if (tab === "chat") {
      navigate("/app/chat");
    } else if (tab === "events") {
      navigate("/app/events");
    } else if (tab === "admin") {
      navigate("/app/admin");
    } else if (tab === "game") {
      // Building icon: mở Library trong app shell
      console.log("Sidebar: navigating to Library (app)");
      navigate("/app/library");
    } else {
      // Office (users) tab - mở main office view với sidebar
      if (
        !location.pathname.startsWith("/app/") ||
        location.pathname.includes("/events") ||
        location.pathname.includes("/chat") ||
        location.pathname.includes("/admin") ||
        location.pathname.includes("/profile")
      ) {
        const targetRoom = resolveTargetRoom();
        const safeRoom = RESERVED_ROUTES.includes(targetRoom)
          ? "default-room"
          : targetRoom;
        console.log("Sidebar: navigating to office room", safeRoom);
        navigate(`/app/${encodeURIComponent(safeRoom)}`);
      }
    }
  };

  const projectName = "My Virtual Office";

  return (
    <div
      className={`h-screen bg-[#0f0e13]/90 backdrop-blur-2xl text-slate-100 flex overflow-hidden transition-all duration-300 border-r border-white/10 ${activeTab !== "users" ? "w-[72px]" : "w-80"
        }`}
    >
      {/* Vertical Navigation Strip */}
      <div className="w-[72px] bg-[#1a1d21] flex flex-col items-center py-4 gap-2 flex-shrink-0 border-r border-[#2d2f34]">
        <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center mb-4 text-white font-bold text-xl cursor-default hover:bg-violet-700 transition-colors">
          G
        </div>

        {/* Library Tab (building icon) */}
        <button
          className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-300 group relative mb-2 ${activeTab === "game" || (activeTab === "users" && location.pathname.includes(currentRoomId))
            ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(124,58,237,0.5)]"
            : "text-slate-400 hover:bg-white/10 hover:text-white"
            }`}
          onClick={() => handleTabClick("game")}
          title="Library"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          {/* Tooltip */}
          <span className="absolute left-16 bg-black/80 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10 z-50">
            Library
          </span>
          {(activeTab === "game" || (activeTab === "users" && location.pathname.includes(currentRoomId))) && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-white shadow-[0_0_8px_white]" />
          )}
        </button>

        {/* Calendar / Events Tab */}
        <button
          className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-300 group relative mb-2 ${activeTab === "events"
            ? "bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.5)]"
            : "text-slate-400 hover:bg-white/10 hover:text-white"
            }`}
          onClick={() => handleTabClick("events")}
          title="Events"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="absolute left-16 bg-black/80 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10 z-50">
            Events
          </span>
          {activeTab === "events" && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-white shadow-[0_0_8px_white]" />}
        </button>

        {/* Chat Tab */}
        <button
          className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-300 group relative mb-2 ${activeTab === "chat"
            ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]"
            : "text-slate-400 hover:bg-white/10 hover:text-white"
            }`}
          onClick={() => handleTabClick("chat")}
          title="Chat"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="absolute left-16 bg-black/80 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10 z-50">
            Chat
          </span>
          {activeTab === "chat" && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-white shadow-[0_0_8px_white]" />}
        </button>

        {/* Office / People Tab */}
        <button
          className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-300 group relative mb-2 ${activeTab === "users"
            ? "bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]"
            : "text-slate-400 hover:bg-white/10 hover:text-white"
            }`}
          onClick={() => handleTabClick("users")}
          title="Office"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span className="absolute left-16 bg-black/80 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10 z-50">
            Office
          </span>
          {activeTab === "users" && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-white shadow-[0_0_8px_white]" />}
        </button>

        <div className="flex-1" />

        {/* Admin Tab - Always Visible for now */}
        <button
          className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-300 group relative ${activeTab === "admin"
            ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.5)]"
            : "text-slate-400 hover:bg-white/10 hover:text-white"
            }`}
          onClick={() => handleTabClick("admin")}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="absolute left-16 bg-black/80 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10 z-50">
            Admin Dashboard
          </span>
          {activeTab === "admin" && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-white shadow-[0_0_8px_white]" />}
        </button>
      </div>

      {/* Main Sidebar Panel */}
      {activeTab === "users" && (
        <div className="flex-1 flex flex-col overflow-hidden animate-slideRight">
          {/* Header */}
          <SidebarHeader
            projectName={projectName}
            onSettingsClick={() => setShowSettingsModal(true)}
          />

          {/* Invite Card */}
          <div className="p-4 mx-4 mt-4 mb-2 rounded-2xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-white/10">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0 text-violet-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="m-0 mb-1 text-sm font-semibold text-white font-display">
                  Invite Peers
                </h3>
                <p className="m-0 text-[11px] text-slate-400 leading-relaxed font-light">
                  Share the link to invite others to this space.
                </p>
              </div>
            </div>
            <button
              className="w-full py-2 bg-white/10 hover:bg-violet-600 hover:text-white hover:border-violet-500 text-violet-200 border border-white/10 rounded-lg text-xs font-medium cursor-pointer transition-all duration-200 shadow-sm"
              onClick={() => setShowInviteModal(true)}
            >
              Copy Invite Link
            </button>
          </div>

          {/* Search within Office */}
          <div className="px-5 py-3">
            <div className="relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-violet-400 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <input
                type="text"
                placeholder="Search office..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-black/20 border border-white/10 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50 focus:bg-black/40 transition-all font-light"
              />
            </div>
          </div>

          {/* Users List */}
          <div className="flex-1 overflow-y-auto px-3 scrollbar-hide">
            {/* Online */}
            <div className="mb-4">
              <div className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 font-display">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
                Online — {onlineUsers.length}
              </div>

              <div className="flex flex-col gap-1">
                {filteredOnlineUsers.map((user) => (
                  <div
                    key={user.userId}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all duration-200 hover:bg-white/5 group border border-transparent hover:border-white/5"
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-md ring-2 ring-transparent group-hover:ring-white/10 transition-all">
                        {user.avatar}
                      </div>
                      <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-[2.5px] border-[#0f0e13]"></div>
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-[13px] font-medium text-slate-200 whitespace-nowrap overflow-hidden text-ellipsis group-hover:text-white transition-colors">
                        {user.username.length > 18
                          ? `${user.username.slice(0, 15)}...`
                          : user.username}
                      </span>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[10px] text-emerald-500/80 font-medium">
                          Active now
                        </span>
                        {(user as any).role === "admin" && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 shadow-sm">
                            ADMIN
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {filteredOnlineUsers.length === 0 && (
                  <div className="px-4 py-6 text-center opacity-40">
                    <p className="text-xs">No one is online</p>
                  </div>
                )}
              </div>
            </div>

            {/* Offline */}
            {offlineUsers.length > 0 && (
              <div className="mb-4">
                <div className="px-3 py-2 text-[11px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2 font-display">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                  Offline — {offlineUsers.length}
                </div>
                <div className="flex flex-col gap-1">
                  {filteredOfflineUsers.map((user) => (
                    <div
                      key={user.userId}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all duration-200 hover:bg-white/5 group opacity-60 hover:opacity-100"
                    >
                      <div className="relative flex-shrink-0 grayscale group-hover:grayscale-0 transition-all">
                        <div className="w-9 h-9 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-xs shadow-inner">
                          {user.avatar}
                        </div>
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-[13px] font-medium text-slate-400 whitespace-nowrap overflow-hidden text-ellipsis group-hover:text-slate-200">
                          {user.username.length > 18
                            ? `${user.username.slice(0, 15)}...`
                            : user.username}
                        </span>
                        {(user as any).role === "admin" && (
                          <div className="mt-1">
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 shadow-sm">
                              ADMIN
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Control */}
          <div className="p-4 border-t border-white/10 bg-black/20 backdrop-blur-md">
            <div className="flex items-center justify-between mb-3 text-xs font-medium">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                <span className={isConnected ? "text-emerald-400" : "text-red-400"}>
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
            </div>
            <button
              className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-red-900/20 active:scale-95 flex items-center justify-center gap-2"
              onClick={handleExit}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Leave Space
            </button>
          </div>
        </div>
      )
      }

      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        roomId={currentRoomId}
      />
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </div >
  );
};

export default Sidebar;
