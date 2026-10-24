import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../contexts/SocketContext";
import { useChat } from "../contexts/ChatContext";
import { useTheme } from "../contexts/ThemeContext";
import { InviteModal, CreateChannelModal } from "../components/modals";
import { ServerList, ChannelList, ChatArea, UserList } from "../components/chat/index";
import VoiceChannelView from "../components/chat/VoiceChannelView";
import { Home } from "lucide-react";
import SpacesManager from "../components/chat/SpacesManager";

type DirectMessage = {
  userId: string;
  username: string;
  avatar: string;
};

const ChatPage = () => {
  const navigate = useNavigate();
  const { users, currentUser } = useSocket();
  const { theme, toggleTheme } = useTheme();
  const {
    activeTab,
    setActiveTab,
    messages,
    sendMessage,
    setDmTarget,
    channels,
    voiceChannels,
    joinVoiceChannel,
    leaveVoiceChannel,
    currentVoiceChannel,
    updateChannelUnread,
    markChannelAsViewed,
    createChannel,
    reactToMessage,
    editMessage,
    deleteMessage,
  } = useChat();

  const [selectedChannel, setSelectedChannel] = useState<string>("general");
  const [selectedDM, setSelectedDM] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [createChannelType, setCreateChannelType] = useState<"text" | "voice">("text");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileUserListOpen, setMobileUserListOpen] = useState(false);
  const [forumView, setForumView] = useState<"chat" | "spaces">("chat");

  // Get roomId from localStorage
  const roomId = localStorage.getItem("roomId") || "default-room";

  // Mark channel as viewed when selected
  useEffect(() => {
    if (activeTab === "global" && selectedChannel) {
      markChannelAsViewed(selectedChannel);
    }
  }, [activeTab, selectedChannel, markChannelAsViewed]);

  const directMessages: DirectMessage[] = useMemo(() => {
    const dmMap = new Map<string, DirectMessage & { status?: "online" | "offline" }>();

    users
      .filter((u) => u.userId !== currentUser?.userId)
      .forEach((u) => {
        const status = (u as any).status || "online";
        const existing = dmMap.get(u.username);

        if (!existing) {
          dmMap.set(u.username, {
            userId: u.userId,
            username: u.username,
            avatar: u.avatar,
            status,
          });
        } else {
          if (existing.status === "offline" && status === "online") {
            dmMap.set(u.username, {
              userId: u.userId,
              username: u.username,
              avatar: u.avatar,
              status,
            });
          }
        }
      });

    return Array.from(dmMap.values()).map(({ status: _status, ...rest }) => rest);
  }, [users, currentUser]);

  useEffect(() => {
    if (selectedDM) {
      setDmTarget(selectedDM);
      setActiveTab("dm");
    } else {
      setDmTarget(null);
    }
  }, [selectedDM, setDmTarget, setActiveTab]);

  useEffect(() => {
    if (selectedChannel) {
      setActiveTab("global");
      setSelectedDM(null);
    }
  }, [selectedChannel, setActiveTab]);

  const currentChannel = channels?.find((ch) => ch.id === selectedChannel) || null;
  const currentDMUser = directMessages?.find((dm) => dm.userId === selectedDM) || null;

  const displayMessages = useMemo(() => {
    if (activeTab === "dm" && selectedDM) {
      return messages.filter((msg) => {
        if (msg.type !== "dm") return false;
        const participants = [msg.userId, msg.targetUserId];
        return (
          participants.includes(currentUser?.userId || "") &&
          participants.includes(selectedDM)
        );
      });
    }
    if (activeTab === "global" && selectedChannel) {
      return messages.filter((msg) => {
        return msg.type === "global" && msg.channelId === selectedChannel;
      });
    }
    return messages;
  }, [messages, activeTab, selectedDM, currentUser, selectedChannel]);

  const handleSendMessage = (content: string, replyToId?: string) => {
    if (activeTab === "global" && selectedChannel) {
      sendMessage(content, selectedChannel, replyToId);
    } else {
      sendMessage(content, undefined, replyToId);
    }
  };

  const usersForList = useMemo(() => {
    const byUsername = new Map<
      string,
      (typeof users)[0] | (typeof currentUser) | null | undefined
    >();

    users.forEach((u) => {
      if (!u) return;
      const existing = byUsername.get(u.username);
      const status = (u as any).status || "online";
      const existingStatus = (existing as any)?.status || "offline";

      if (!existing || (existingStatus === "offline" && status === "online")) {
        byUsername.set(u.username, u);
      }
    });

    if (currentUser) {
      const existing = byUsername.get(currentUser.username);
      const existingStatus = (existing as any)?.status || "offline";
      if (!existing || existingStatus === "offline") {
        byUsername.set(currentUser.username, { ...currentUser, status: "online" as const });
      }
    }

    const merged = Array.from(byUsername.values()).filter(
      (u): u is NonNullable<typeof u> => !!u
    );

    const sorted = merged.sort((a, b) => {
      if (a.userId === currentUser?.userId) return -1;
      if (b.userId === currentUser?.userId) return 1;
      const aStatus = (a as any).status || "online";
      const bStatus = (b as any).status || "online";
      if (aStatus !== bStatus) return aStatus === "online" ? -1 : 1;
      return a.username.localeCompare(b.username);
    });

    return sorted.map((user) => ({
      userId: user.userId,
      username: user.username,
      avatar: user.avatar,
      status: ((user as any).status || "online") as "online" | "offline",
      role: ((user as any).role || "member") as "admin" | "member",
      currentVoiceChannel:
        currentVoiceChannel && user.userId === currentUser?.userId
          ? currentVoiceChannel
          : undefined,
    }));
  }, [users, currentUser, currentVoiceChannel]);

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#0f0e13] font-sans text-slate-100 overflow-hidden relative selection:bg-violet-500/30">
      {/* Header với nút Trở về */}
      <div className="flex-shrink-0 px-4 py-2 bg-[#1a1823]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between gap-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600/20 hover:bg-teal-600/30 text-teal-400 transition-colors font-medium text-sm"
        >
          <Home size={18} />
          Trở về Trang chủ
        </button>

        {/* Forum tabs: Chat + Spaces (merged) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setForumView("chat")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors border ${
              forumView === "chat"
                ? "bg-white/10 border-white/20 text-white"
                : "bg-transparent border-white/10 text-slate-300 hover:bg-white/5"
            }`}
          >
            Forum
          </button>
          <button
            type="button"
            onClick={() => setForumView("spaces")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors border ${
              forumView === "spaces"
                ? "bg-white/10 border-white/20 text-white"
                : "bg-transparent border-white/10 text-slate-300 hover:bg-white/5"
            }`}
          >
            Quản lý Spaces
          </button>
        </div>
      </div>
      
      <div className="flex-1 flex overflow-hidden relative max-w-[1920px] mx-auto w-full shadow-2xl">
        {/* Navigation & Channels */}
        <div className="flex flex-row w-[320px] flex-shrink-0 z-10 glass-panel border-r-0 rounded-r-2xl my-2 ml-2 overflow-hidden">
            {/* Server List - Vertical Slim */}
            <ServerList
            currentServerId="default"
            onServerSelect={(id: string) => console.log("Server selected:", id)}
            />
            
            {/* Channel List */}
            <ChannelList
            className={mobileMenuOpen ? "open" : ""}
            serverName="My Virtual Office"
            channels={channels || []}
            voiceChannels={voiceChannels || []}
            selectedChannelId={selectedChannel}
            currentVoiceChannelId={currentVoiceChannel}
            onChannelSelect={(id: string) => {
                setSelectedChannel(id);
                setSelectedDM(null);
                setActiveTab("global");
                markChannelAsViewed(id);
                setMobileMenuOpen(false);
            }}
            onVoiceChannelJoin={(id: string) => {
                if (currentVoiceChannel === id) {
                leaveVoiceChannel();
                } else {
                joinVoiceChannel(id);
                }
            }}
            onCreateChannel={(type: "text" | "voice") => {
                setCreateChannelType(type);
                setShowCreateChannelModal(true);
            }}
            currentUser={currentUser ? {
                userId: currentUser.userId,
                username: currentUser.username,
                avatar: currentUser.avatar,
            } : undefined}
            />
        </div>

        {/* Main Content */}
        <div
          className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
            currentVoiceChannel ? "mr-[380px]" : "mr-2"
          } my-2 mx-2 bg-[#1a1823]/80 backdrop-blur-md rounded-2xl border border-white/5 shadow-2xl overflow-hidden relative`}
        >
          {/* Background Mesh Gradient */}
          <div className="absolute inset-0 bg-linear-to-br from-violet-900/10 via-transparent to-fuchsia-900/5 pointer-events-none" />

          {forumView === "spaces" ? (
            <div className="flex-1 overflow-y-auto relative">
              <SpacesManager />
            </div>
          ) : (
            <ChatArea
              channelName={
                activeTab === "dm" && currentDMUser
                  ? currentDMUser.username
                  : currentChannel?.name || selectedChannel || "general"
              }
              channelType={activeTab === "dm" ? "dm" : "text"}
              messages={displayMessages.map((msg) => ({
                id: msg.id,
                userId: msg.userId,
                username: msg.username,
                message: msg.message,
                timestamp: msg.timestamp,
                editedAt: msg.editedAt,
                replyTo: msg.replyTo,
                reactions: msg.reactions,
                attachments: msg.attachments,
              }))}
              currentUserId={currentUser?.userId}
              onSendMessage={(
                content: string,
                attachments?: Array<{
                  filename: string;
                  originalName: string;
                  mimeType: string;
                  size: number;
                  url: string;
                }>
              ) => {
                if (activeTab === "global" && selectedChannel) {
                  sendMessage(content, selectedChannel, undefined, attachments);
                } else {
                  sendMessage(content, undefined, undefined, attachments);
                }
              }}
              onReply={(messageId: string, content: string) => {
                handleSendMessage(content, messageId);
              }}
              onReact={reactToMessage}
              onEdit={editMessage}
              onDelete={deleteMessage}
              inputPlaceholder={
                activeTab === "dm" && currentDMUser
                  ? `Message @${currentDMUser.username}`
                  : `Message #${selectedChannel || "general"}`
              }
            />
          )}
        </div>

        {/* Voice Channel View - Floating Sidebar */}
        {currentVoiceChannel && (
          <div className="absolute top-2 right-2 bottom-2 w-[360px] bg-[#13111c]/95 backdrop-blur-2xl rounded-2xl border border-white/10 z-20 flex flex-col shadow-2xl animate-slideLeft">
            <VoiceChannelView
              channelId={currentVoiceChannel}
              channelName={
                voiceChannels.find((vc) => vc.id === currentVoiceChannel)?.name ||
                "Voice Channel"
              }
              onLeave={() => {
                leaveVoiceChannel();
                setSelectedChannel("general");
                setActiveTab("global");
              }}
            />
          </div>
        )}

      </div>
      
      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        roomId={roomId}
      />
      <CreateChannelModal
        isOpen={showCreateChannelModal}
        onClose={() => setShowCreateChannelModal(false)}
        onCreateChannel={(name: string, type: "text" | "voice", description?: string, isPrivate?: boolean) => {
          createChannel(name, type, description, isPrivate);
          setShowCreateChannelModal(false);
        }}
        defaultType={createChannelType}
      />
    </div>
  );
};

export default ChatPage;

