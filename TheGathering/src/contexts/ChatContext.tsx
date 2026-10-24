import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import {
  useChatMessages,
  useChatChannels,
  useChatReactions,
  useChatGroups,
} from "../hooks";

export type ChatTab = "nearby" | "global" | "dm" | "group" | "users";

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  type: ChatTab;
  targetUserId?: string | null;
  groupId?: string | null;
  channelId?: string | null; // For tracking which channel the message belongs to
  timestamp: number;
  editedAt?: number;
  replyTo?: {
    id: string;
    username: string;
    message: string;
  };
  reactions?: Array<{
    emoji: string;
    users: string[];
  }>;
  attachments?: Array<{
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
  }>;
}

export interface GroupChat {
  id: string;
  name: string;
  members: string[];
  createdBy: string;
  createdAt: number;
}

export interface Channel {
  id: string;
  name: string;
  type: "text" | "voice";
  category?: string;
  unreadCount?: number;
  description?: string;
  isPrivate?: boolean;
}

export interface VoiceChannel {
  id: string;
  name: string;
  users: string[]; // userIds
  isActive: boolean;
  duration?: number; // in seconds
}

interface ChatContextType {
  isOpen: boolean;
  toggleChat: () => void;
  activeTab: ChatTab;
  setActiveTab: (tab: ChatTab) => void;
  messages: ChatMessage[];
  sendMessage: (
    content: string,
    channelId?: string,
    replyToId?: string,
    attachments?: Array<{
      filename: string;
      originalName: string;
      mimeType: string;
      size: number;
      url: string;
    }>
  ) => void;
  dmTarget: string | null;
  setDmTarget: (id: string | null) => void;
  groupChats: GroupChat[];
  selectedGroupId: string | null;
  setSelectedGroupId: (id: string | null) => void;
  createGroupChat: (name: string, memberIds: string[]) => void;
  isHistoryLoading: boolean;
  channels: Channel[];
  voiceChannels: VoiceChannel[];
  joinVoiceChannel: (channelId: string) => void;
  leaveVoiceChannel: () => void;
  currentVoiceChannel: string | null;
  updateChannelUnread: (channelId: string, count: number) => void;
  markChannelAsViewed: (channelId: string) => void;
  createChannel: (
    name: string,
    type: "text" | "voice",
    description?: string,
    isPrivate?: boolean
  ) => void;
  reactToMessage: (messageId: string, emoji: string) => void;
  editMessage: (messageId: string, newContent: string) => void;
  deleteMessage: (messageId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within ChatProvider");
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
  roomId: string;
}

export const ChatProvider = ({ children, roomId }: ChatProviderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ChatTab>("global");
  const [dmTarget, setDmTarget] = useState<string | null>(null);
  const [isHistoryLoading] = useState(false);

  // Get group chat state first
  const {
    groupChats,
    selectedGroupId,
    setSelectedGroupId,
    createGroupChat: createGroupChatHook,
  } = useChatGroups(roomId);

  // Use extracted hooks with selectedGroupId
  const {
    messages,
    sendMessage,
    editMessage: editMessageHook,
    deleteMessage: deleteMessageHook,
    setMessages,
  } = useChatMessages({
    activeTab,
    dmTarget,
    selectedGroupId,
  });

  const {
    channels,
    voiceChannels,
    currentVoiceChannel,
    lastReadAt,
    joinVoiceChannel,
    leaveVoiceChannel,
    updateChannelUnread,
    markChannelAsViewed,
    createChannel,
    setChannelUnreads,
  } = useChatChannels(roomId);

  const { reactToMessage } = useChatReactions({
    setMessages,
    roomId,
  });

  // Update unread counts when messages arrive
  useEffect(() => {
    const unreadCounts = new Map<string, number>();

    messages.forEach((msg) => {
      // Count unread messages newer than the last-read timestamp per channel
      if (
        msg.type === "global" &&
        msg.channelId &&
        msg.timestamp > (lastReadAt.get(msg.channelId) || 0)
      ) {
        const current = unreadCounts.get(msg.channelId) || 0;
        unreadCounts.set(msg.channelId, current + 1);
      }
    });

    setChannelUnreads(unreadCounts);
  }, [messages, lastReadAt, setChannelUnreads]);

  const createGroupChat = useCallback(
    (name: string, memberIds: string[]) => {
      createGroupChatHook(name, memberIds, setActiveTab);
    },
    [createGroupChatHook]
  );

  const toggleChat = () => setIsOpen((prev) => !prev);

  const value: ChatContextType = {
    isOpen,
    toggleChat,
    activeTab,
    setActiveTab,
    messages,
    sendMessage,
    dmTarget,
    setDmTarget,
    groupChats,
    selectedGroupId,
    setSelectedGroupId,
    createGroupChat,
    isHistoryLoading,
    channels,
    voiceChannels,
    joinVoiceChannel,
    leaveVoiceChannel,
    currentVoiceChannel,
    updateChannelUnread,
    markChannelAsViewed,
    createChannel,
    reactToMessage,
    editMessage: (messageId: string, newContent: string) =>
      editMessageHook(messageId, newContent, roomId),
    deleteMessage: (messageId: string) => deleteMessageHook(messageId, roomId),
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
