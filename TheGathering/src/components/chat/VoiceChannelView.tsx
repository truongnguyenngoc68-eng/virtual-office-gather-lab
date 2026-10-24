import { useEffect, useState } from "react";
import { useWebRTC } from "../../contexts/WebRTCContext";
import { useSocket } from "../../contexts/SocketContext";
import { useChat } from "../../contexts/ChatContext";
import { VideoPlayer } from "../video/VideoPlayer";
import { getAvatarColor } from "../../utils/avatar";

interface VoiceChannelViewProps {
  channelId: string;
  channelName: string;
  onLeave: () => void;
}

interface VoiceUser {
  userId: string;
  username: string;
  avatar?: string;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  stream?: MediaStream;
  isSpeaking?: boolean; // NEW: For speaking indicator
}

// UserVideoPlayer is now replaced by shared VideoPlayer component

// ==========================================
// 2. Component Cha (Đã làm sạch logic)
// ==========================================
const VoiceChannelView = ({
  channelId,
  channelName,
  onLeave,
}: VoiceChannelViewProps) => {
  const { currentUser, users } = useSocket();
  const {
    localStream,
    peers,
    isVideoEnabled,
    isAudioEnabled,
    mediaError,
    cameraOwner,
    mediaStateByUser,
    speakingByUser,
    toggleVideo,
    toggleAudio,
    startMedia,
    stopMedia,
    setVoiceChannelUsers,
  } = useWebRTC();
  const { voiceChannels } = useChat();

  const [voiceUsers, setVoiceUsers] = useState<VoiceUser[]>([]);

  // Rời kênh: tắt cam/mic rồi mới gọi onLeave
  const handleLeave = () => {
    stopMedia();
    onLeave();
  };

  // Get current voice channel
  const currentVoiceChannel = voiceChannels.find((vc) => vc.id === channelId);

  // 1. Initialize media
  useEffect(() => {
    if (!localStream && channelId) {
      console.log(`🎬 VoiceChannelView: Requesting media for channel ${channelId}`);
      startMedia().catch((err) => {
        console.error("Failed to start media:", err);
        // Lỗi đã được xử lý trong startMedia, chỉ log ở đây
      });
    }
  }, [channelId, localStream, startMedia]);

  // 2. Sync voice users to WebRTC Context
  const voiceChannelUsersStr = currentVoiceChannel?.users?.join(",") || "";
  useEffect(() => {
    if (currentVoiceChannel && currentUser) {
      setVoiceChannelUsers({
        roomId: localStorage.getItem("roomId") || "default-room",
        channelId,
        userIds: currentVoiceChannel.users || [],
      });
    } else {
      setVoiceChannelUsers({
        roomId: localStorage.getItem("roomId") || "default-room",
        channelId,
        userIds: [],
      });
    }
  }, [
    voiceChannelUsersStr,
    channelId,
    currentUser?.userId,
    currentVoiceChannel,
    currentUser,
    setVoiceChannelUsers,
  ]);

  // 3. Build User List (Logic quan trọng nhất)
  // Sử dụng useEffect để tính toán danh sách user hiển thị
  const peersStreamIds = Array.from(peers.values())
    .map((p) => p.stream?.id)
    .join(",");
  useEffect(() => {
    if (!currentVoiceChannel || !currentUser) return;

    const channelUsers = currentVoiceChannel.users || [];

    // Tạo danh sách user từ channel users
    const mappedUsers: VoiceUser[] = channelUsers.map((userId) => {
      // a. Xử lý chính mình
      if (userId === currentUser.userId) {
        return {
          userId: currentUser.userId,
          username: currentUser.username,
          avatar: currentUser.avatar,
          isVideoEnabled: isVideoEnabled, // State local
          isAudioEnabled: isAudioEnabled, // State local
          stream: localStream || undefined,
          isSpeaking: speakingByUser[currentUser.userId] || false,
        };
      }

      // b. Xử lý người khác (Remote Peer)
      const user = users.find((u) => u.userId === userId);

      // FIX "UNKNOWN": Nếu chưa tìm thấy user trong list users tổng, tạo placeholder
      if (!user) {
        console.warn(
          `⚠️ User ${userId} in voice channel but not in global user list yet. Available users:`,
          users.map((u) => ({ userId: u.userId, username: u.username }))
        );
        return {
          userId: userId,
          username: "Loading...", // Hiển thị tạm thời
          isVideoEnabled: false,
          isAudioEnabled: false,
          stream: undefined,
        };
      }

      const peerConn = peers.get(userId);
      const remoteStream = peerConn?.stream;

      // Check track status
      const videoTrack = remoteStream?.getVideoTracks()[0];
      const audioTrack = remoteStream?.getAudioTracks()[0];

      // Log để debug
      if (peerConn && !remoteStream) {
        console.log(`⏳ Peer ${userId} exists but no stream yet`);
      }
      if (remoteStream) {
        console.log(`✅ Peer ${userId} has stream:`, {
          streamId: remoteStream.id,
          videoTracks: remoteStream.getVideoTracks().length,
          audioTracks: remoteStream.getAudioTracks().length,
          videoEnabled: videoTrack?.enabled,
        });
      }

      const state = mediaStateByUser[userId];
      const remoteVideoEnabled = state?.videoEnabled ?? (!!videoTrack && videoTrack.enabled);
      const remoteAudioEnabled = state?.audioEnabled ?? (audioTrack?.enabled ?? false);

      return {
        userId: userId,
        username: user.username,
        avatar: user.avatar,
        // Hiển thị video nếu có stream và có video track (không cần check readyState vì có thể track chưa live ngay)
        // Chỉ check enabled để biết user có bật cam không
        isVideoEnabled: remoteVideoEnabled,
        isAudioEnabled: remoteAudioEnabled,
        stream: remoteStream,
        isSpeaking: speakingByUser[userId] || false,
      };
    });

    // Cập nhật state
    setVoiceUsers(mappedUsers);
  }, [
    currentVoiceChannel, // Trigger khi có người vào/ra room
    users,
    currentUser,
    peers, // Trigger khi peer kết nối/ngắt
    localStream,
    isVideoEnabled,
    isAudioEnabled,
    peersStreamIds, // Force update khi stream ID thay đổi
    mediaStateByUser,
    speakingByUser,
  ]);

  // Helper UI functions
  const getGridColumns = (count: number) => {
    if (count <= 1) return 1;
    if (count <= 4) return 2;
    if (count <= 9) return 3;
    return 4;
  };

  return (
    <div className="flex flex-col h-full bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="text-xl">🔊</span>
          <h2 className="text-base font-semibold m-0 text-slate-100">{channelName}</h2>
          <span className="text-sm text-slate-400">{voiceUsers.length} người</span>
        </div>
        <button
          className="px-4 py-2 bg-red-500/10 text-red-300 border border-red-500/20 rounded-xl cursor-pointer text-sm font-medium transition-all duration-200 hover:bg-red-500/15 hover:text-red-200 hover:-translate-y-px active:translate-y-0"
          onClick={handleLeave}
        >
          Rời khỏi
        </button>
      </div>

      <div
        className="flex-1 grid gap-4 p-6 overflow-y-auto align-content-start min-h-0 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-800/50 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-slate-700/50"
        style={{
          gridTemplateColumns: `repeat(${getGridColumns(
            voiceUsers.length
          )}, 1fr)`,
        }}
      >
        {voiceUsers.map((user) => {
          const isCurrentUser = user.userId === currentUser?.userId;

          return (
            <div
              key={user.userId}
              className={`relative aspect-video rounded-xl overflow-hidden bg-slate-900/60 border border-slate-800/60 transition-all duration-200 hover:border-indigo-500/40 hover:scale-[1.02] ${
                isCurrentUser ? "border-indigo-500/50 shadow-[0_0_0_2px_rgba(99,102,241,0.2)]" : ""
              } ${user.isSpeaking ? "border-indigo-400/60 shadow-[0_0_0_3px_rgba(99,102,241,0.25)] animate-[speakingPulse_1.5s_ease-in-out_infinite]" : ""}`}
            >
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Luôn render video element nếu có stream, để video có thể hiển thị ngay khi track enabled */}
                {user.stream ? (
                  <>
                    <VideoPlayer
                      stream={user.stream}
                      isLocal={isCurrentUser}
                      isVideoEnabled={user.isVideoEnabled}
                      username={user.username}
                    />
                    {/* Avatar Fallback chỉ hiển thị khi video không enabled */}
                    {!user.isVideoEnabled && (
                      <div
                        className="absolute w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-semibold shadow-lg z-10"
                        style={{ backgroundColor: getAvatarColor(user.userId) }}
                      >
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Hiển thị avatar thay vì loading nếu là local user và có lỗi camera */}
                    {isCurrentUser && mediaError ? (
                      <>
                        <div
                          className="absolute w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-semibold shadow-lg z-10"
                          style={{ backgroundColor: getAvatarColor(user.userId) }}
                        >
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="absolute bottom-1/2 left-1/2 -translate-x-1/2 translate-y-1/2 flex flex-col items-center gap-2 text-center px-4 z-20">
                          <span className="text-[32px] opacity-70">📷</span>
                          <span className="text-sm text-slate-300 font-medium">Camera đang được sử dụng</span>
                          {cameraOwner && (
                            <span className="text-xs text-slate-400 opacity-80">bởi tab khác</span>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="absolute w-full h-full flex items-center justify-center bg-slate-900/80 z-0">
                          <div className="text-slate-400 text-sm font-medium">Đang kết nối...</div>
                        </div>
                        {/* Avatar khi chưa có stream */}
                        <div
                          className="absolute w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-semibold shadow-lg z-10"
                          style={{ backgroundColor: getAvatarColor(user.userId) }}
                        >
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                      </>
                    )}
                  </>
                )}

                <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent px-3 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {!user.isAudioEnabled && <span className="text-lg bg-black/60 px-2 py-1 rounded" title="Đã tắt mic">🔇</span>}
                    {user.isVideoEnabled && (
                      <span className="text-sm bg-black/60 px-2 py-1 rounded" title="Đang bật camera">📹</span>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{user.username}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Error Message */}
      {mediaError && (
        <div className="flex items-center justify-between gap-3 px-6 py-3 bg-red-500/10 border border-red-500/20 mx-6 mt-4 rounded-xl">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-lg shrink-0">⚠️</span>
            <span className="text-sm text-red-300 leading-relaxed">{mediaError}</span>
          </div>
          {!mediaError.includes("từ chối") && !mediaError.includes("Không tìm thấy") && (
            <button
              className="px-3 py-1.5 bg-linear-to-r from-indigo-600 to-violet-600 text-white border-none rounded-xl cursor-pointer text-[13px] font-medium transition-all duration-200 whitespace-nowrap hover:from-indigo-500 hover:to-violet-500 hover:-translate-y-px active:translate-y-0"
              onClick={() => {
                startMedia(false);
              }}
            >
              Thử lại ngay
            </button>
          )}
        </div>
      )}

      {/* Control Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 backdrop-blur-sm border-t border-slate-800/50 gap-4">
        <div className="flex items-center gap-2">
          {/* Nút Toggle Video */}
          <button
            className={`flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-800 rounded-xl cursor-pointer text-sm font-medium transition-all duration-200 min-w-[44px] h-11 hover:-translate-y-px active:translate-y-0 ${
              isVideoEnabled
                ? "bg-indigo-600/20 text-indigo-200 border-indigo-500/30 hover:bg-indigo-600/25"
                : "bg-slate-900/60 text-slate-300 hover:bg-slate-800/60"
            }`}
            onClick={toggleVideo}
            title={isVideoEnabled ? "Tắt camera" : "Bật camera"}
          >
            {isVideoEnabled ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
              </svg>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M21 6.5l-4-4v3.5H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h13v3.5l4-4v-11z" />
              </svg>
            )}
          </button>

          {/* Nút Toggle Mic */}
          <button
            className={`flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-800 rounded-xl cursor-pointer text-sm font-medium transition-all duration-200 min-w-[44px] h-11 hover:-translate-y-px active:translate-y-0 ${
              isAudioEnabled
                ? "bg-indigo-600/20 text-indigo-200 border-indigo-500/30 hover:bg-indigo-600/25"
                : "bg-slate-900/60 text-slate-300 hover:bg-slate-800/60"
            }`}
            onClick={toggleAudio}
            title={isAudioEnabled ? "Tắt mic" : "Bật mic"}
          >
            {isAudioEnabled ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4c-.83 0-1.5.67-1.5 1.5v3.18l3 3V5.5c0-.83-.67-1.5-1.5-1.5z" />
              </svg>
            )}
          </button>
        </div>

        <div className="flex-1 flex justify-center">
          <button
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-500/10 text-red-300 border border-red-500/20 rounded-xl cursor-pointer text-sm font-medium transition-all duration-200 min-w-[44px] h-11 hover:bg-red-500/15 hover:text-red-200"
            onClick={handleLeave}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
            <span>Rời khỏi</span>
          </button>
        </div>

        <div className="flex items-center gap-2" />
      </div>
    </div>
  );
};

export default VoiceChannelView;
