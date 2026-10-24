import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useWebRTC } from "../contexts/WebRTCContext";
import { useSocket } from "../contexts/SocketContext";
import ReactionPanel from "./ReactionPanel";
import NearbyChatPanel from "./chat/NearbyChatPanel";

const ControlBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { isVideoEnabled, isAudioEnabled, toggleVideo, toggleAudio } =
    useWebRTC();
  const [showReactions, setShowReactions] = useState(false);
  const [showNearbyChat, setShowNearbyChat] = useState(false);

  const isChatPage = location.pathname === "/app/chat";
  const isSidebarPage = isChatPage;

  const handleLeaveRoom = () => {
    if (confirm("Are you sure you want to leave the room?")) {
      // Disconnect socket
      if (socket) {
        console.log("Leaving room and disconnecting socket...");
        socket.disconnect();
      }
      // Clear local storage
      localStorage.removeItem("roomId");
      localStorage.removeItem("userId");
      // Navigate to spaces
      navigate("/spaces");
    }
  };

  return (
    <div
      className={`fixed flex items-center gap-3 p-2 px-3 bg-[#13111c]/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-[100] transition-all duration-300 ${isSidebarPage
          ? "bottom-6 left-20 w-auto transform-none"
          : "bottom-8 left-1/2 -translate-x-1/2"
        }`}
    >
      <div className="flex items-center gap-2 shrink-0 pr-2 border-r border-white/10">
        <button
          className="group relative w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 transition-all hover:bg-white/10 hover:border-white/20 active:scale-95"
          title="Minimap"
        >
          <div className="w-5 h-5 flex items-center justify-center">
            <div className="w-4 h-3 bg-white/20 rounded-sm overflow-hidden relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-violet-500 rounded-full shadow-[0_0_5px_rgba(139,92,246,0.8)] animate-pulse" />
            </div>
          </div>
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            Map
          </span>
        </button>
      </div>

      <div className="flex items-center gap-2 shrink-0 pr-2 border-r border-white/10">
        <div className="relative group">
          <button
            className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all active:scale-95 ${isVideoEnabled
                ? "bg-indigo-600/20 text-indigo-400 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:border-white/20 hover:text-slate-200"
              }`}
            onClick={toggleVideo}
            title="Toggle Video"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              {isVideoEnabled ? (
                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
              ) : (
                <path d="M21 6.5l-4-4v3.5H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h13v3.5l4-4v-11z" />
              )}
            </svg>
          </button>
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            {isVideoEnabled ? "Turn Off Camera" : "Turn On Camera"}
          </span>
        </div>

        <div className="relative group">
          <button
            className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all active:scale-95 ${isAudioEnabled
                ? "bg-emerald-600/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:border-white/20 hover:text-slate-200"
              }`}
            onClick={toggleAudio}
            title="Toggle Audio"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              {isAudioEnabled ? (
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              ) : (
                <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4c-.83 0-1.5.67-1.5 1.5v3.18l3 3V5.5c0-.83-.67-1.5-1.5-1.5z" />
              )}
            </svg>
          </button>
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            {isAudioEnabled ? "Mute" : "Unmute"}
          </span>
        </div>

        <div className="relative group">
          <button
            className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all active:scale-95 ${showNearbyChat
                ? "bg-violet-600/20 text-violet-400 border-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.2)]"
                : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:border-white/20 hover:text-slate-200"
              }`}
            onClick={() => setShowNearbyChat(!showNearbyChat)}
            title="Nearby Chat"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
          </button>
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            Local Chat
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="relative group">
          <button
            className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all active:scale-95 ${showReactions
                ? "bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-[0_0_15px_rgba(251,191,36,0.2)]"
                : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:border-white/20 hover:text-slate-200"
              }`}
            onClick={() => setShowReactions(!showReactions)}
            title="Send Reaction"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </button>
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            Reactions
          </span>
        </div>

        <div className="relative group">
          <button
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 transition-all hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-300 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] active:scale-95"
            onClick={handleLeaveRoom}
            title="Leave Room"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
            </svg>
          </button>
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            Leave
          </span>
        </div>
      </div>

      <ReactionPanel
        isOpen={showReactions}
        onClose={() => setShowReactions(false)}
      />

      <NearbyChatPanel
        isOpen={showNearbyChat}
        onClose={() => setShowNearbyChat(false)}
      />
    </div>
  );
};

export default ControlBar;
