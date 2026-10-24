import { useState, useEffect, useMemo, useCallback } from "react";
import { useSocket } from "../contexts/SocketContext";
import { ChatMessage, ChatTab } from "../contexts/ChatContext";

interface UseChatMessagesProps {
  activeTab: ChatTab;
  dmTarget: string | null;
  selectedGroupId: string | null;
}

export const useChatMessages = ({
  activeTab,
  dmTarget,
  selectedGroupId,
}: UseChatMessagesProps) => {
  const { socket, currentUser } = useSocket();
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Load messages from database when socket connects
  useEffect(() => {
    if (!socket || !currentUser) return;

    const loadMessages = async () => {
      try {
        const roomId = localStorage.getItem("roomId") || "default-room";
        const response = await fetch(
          `${import.meta.env.VITE_SERVER_URL || "http://localhost:5001"
          }/api/chat/history/${roomId}?type=global&limit=100`
        );
        if (response.ok) {
          const data = await response.json();
          // Handle both old format (array) and new format (object with messages property)
          const historyMessages: ChatMessage[] = Array.isArray(data)
            ? data
            : (data.messages || []);

          // Ensure it's an array
          if (!Array.isArray(historyMessages)) {
            console.warn("Invalid message history format, expected array");
            return;
          }

          console.log("Loaded messages from database:", historyMessages.length);
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const newMessages = historyMessages.filter(
              (m) => !existingIds.has(m.id)
            );
            return [...prev, ...newMessages].sort(
              (a, b) => a.timestamp - b.timestamp
            );
          });
        } else {
          console.warn(
            "Failed to load message history, continuing without history"
          );
        }
      } catch (error) {
        console.warn("Error loading message history (non-critical):", error);
      }
    };

    loadMessages();
  }, [socket, currentUser?.userId]);

  // Setup socket listeners for realtime messages
  useEffect(() => {
    if (!socket) return;

    const handleIncoming = (message: ChatMessage) => {
      console.log("🔵 REAL-TIME: Received chat message:", message);
      setMessages((prev) => {
        // Deduplication: Check if message already exists
        if (prev.some((msg) => msg.id === message.id)) {
          // If message exists (e.g., from update), update it
          return prev
            .map((m) => (m.id === message.id ? message : m))
            .sort((a, b) => a.timestamp - b.timestamp);
        }
        // Add new message IMMEDIATELY (realtime)
        return [...prev, message].sort(
          (a, b) => a.timestamp - b.timestamp
        );
      });
    };

    const handleMessageReactionUpdated = (data: {
      messageId: string;
      emoji: string;
      userId: string;
    }) => {
      console.log("🔵 REAL-TIME: Received message-reaction-updated:", data);
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== data.messageId) return msg;

          const existingReactions = msg.reactions || [];
          const reactionIndex = existingReactions.findIndex(
            (r) => r.emoji === data.emoji
          );

          let newReactions: Array<{ emoji: string; users: string[] }>;

          if (reactionIndex >= 0) {
            const reaction = existingReactions[reactionIndex];
            const userIndex = reaction.users.indexOf(data.userId);

            if (userIndex >= 0) {
              // Remove reaction
              const newUsers = reaction.users.filter(
                (id) => id !== data.userId
              );
              if (newUsers.length === 0) {
                newReactions = existingReactions.filter(
                  (_, idx) => idx !== reactionIndex
                );
              } else {
                newReactions = [...existingReactions];
                newReactions[reactionIndex] = {
                  ...reaction,
                  users: newUsers,
                };
              }
            } else {
              // Add user to reaction
              newReactions = [...existingReactions];
              newReactions[reactionIndex] = {
                ...reaction,
                users: [...reaction.users, data.userId],
              };
            }
          } else {
            // Add new reaction
            newReactions = [
              ...existingReactions,
              { emoji: data.emoji, users: [data.userId] },
            ];
          }

          return {
            ...msg,
            reactions: newReactions,
          };
        })
      );
    };

    const handleMessageEdited = (data: {
      messageId: string;
      newContent: string;
      editedAt: number;
      userId: string;
    }) => {
      console.log("🔵 REAL-TIME: Received message-edited:", data);
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === data.messageId && msg.userId === data.userId) {
            return {
              ...msg,
              message: data.newContent,
              editedAt: data.editedAt,
            };
          }
          return msg;
        })
      );
    };

    const handleMessageDeleted = (data: {
      messageId: string;
      userId: string;
    }) => {
      console.log("🔵 REAL-TIME: Received message-deleted:", data);
      setMessages((prev) =>
        prev.filter((msg) => {
          if (msg.id === data.messageId) {
            return msg.userId !== data.userId;
          }
          return true;
        })
      );
    };

    // Bind listeners directly
    socket.on("chat-message", handleIncoming);
    socket.on("message-reaction-updated", handleMessageReactionUpdated);
    socket.on("message-edited", handleMessageEdited);
    socket.on("message-deleted", handleMessageDeleted);

    // Cleanup
    return () => {
      socket.off("chat-message", handleIncoming);
      socket.off("message-reaction-updated", handleMessageReactionUpdated);
      socket.off("message-edited", handleMessageEdited);
      socket.off("message-deleted", handleMessageDeleted);
    };
  }, [socket]);

  // Filter messages based on active tab
  const filteredMessages = useMemo(() => {
    if (activeTab === "nearby") {
      return messages.filter((msg) => msg.type === "nearby");
    }
    if (activeTab === "global") {
      return messages.filter((msg) => msg.type === "global");
    }
    if (activeTab === "group") {
      if (!selectedGroupId) return [];
      return messages.filter(
        (msg) => msg.type === "group" && msg.groupId === selectedGroupId
      );
    }
    // DM - Show messages where current user is either sender or receiver
    return messages.filter((msg) => {
      if (msg.type !== "dm" || !currentUser) return false;

      const isSender = msg.userId === currentUser.userId;
      const isReceiver = msg.targetUserId === currentUser.userId;

      if (!isSender && !isReceiver) return false;

      // If dmTarget is selected, filter by it
      if (dmTarget) {
        return msg.userId === dmTarget || msg.targetUserId === dmTarget;
      }

      // If no dmTarget selected, show all DMs involving current user
      return true;
    });
  }, [messages, activeTab, dmTarget, selectedGroupId, currentUser]);

  const sendMessage = useCallback(
    (
      content?: string | null,
      channelIdParam?: string,
      replyToId?: string,
      attachments?: Array<{
        filename: string;
        originalName: string;
        mimeType: string;
        size: number;
        url: string;
      }>
    ) => {
      if (!socket || !currentUser) {
        console.warn(
          "Cannot send message: socket or currentUser not available"
        );
        return;
      }
      const trimmed = (content ?? "").trim();
      if (!trimmed && (!attachments || attachments.length === 0)) {
        console.warn("Cannot send empty message");
        return;
      }

      // Determine channelId based on activeTab or parameter
      let channelId: string | undefined = channelIdParam;
      if (activeTab === "global" && !channelId) {
        channelId = "general";
      }

      // Get replyTo info if replying
      let replyTo: ChatMessage["replyTo"] | undefined;
      if (replyToId) {
        const replyMsg = messages.find((m) => m.id === replyToId);
        if (replyMsg) {
          replyTo = {
            id: replyMsg.id,
            username: replyMsg.username,
            message: replyMsg.message,
          };
        }
      }

      const payload: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: currentUser.userId,
        username: currentUser.username,
        message: trimmed || "",
        type: activeTab === "dm" ? "dm" : activeTab,
        targetUserId: activeTab === "dm" ? dmTarget : undefined,
        groupId: activeTab === "group" ? selectedGroupId : undefined,
        channelId: channelId || (activeTab === "global" ? "general" : undefined),
        timestamp: Date.now(),
        reactions: [],
        replyTo,
        attachments: attachments || [],
      };

      console.log("Sending chat message:", payload);
      socket.emit("chat-message", payload);
    },
    [socket, currentUser, activeTab, dmTarget, selectedGroupId, messages]
  );

  const editMessage = useCallback(
    (messageId: string, newContent: string, roomId: string) => {
      if (!socket || !currentUser) return;

      const trimmed = newContent.trim();
      if (!trimmed) return;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId && msg.userId === currentUser.userId
            ? { ...msg, message: trimmed, editedAt: Date.now() }
            : msg
        )
      );

      socket.emit("edit-message", {
        messageId,
        newContent: trimmed,
        userId: currentUser.userId,
        roomId,
      });
    },
    [socket, currentUser]
  );

  const deleteMessage = useCallback(
    (messageId: string, roomId: string) => {
      if (!socket || !currentUser) return;

      // Optimistically remove message
      setMessages((prev) =>
        prev.filter((msg) => {
          if (msg.id === messageId) {
            return msg.userId !== currentUser.userId;
          }
          return true;
        })
      );

      socket.emit("delete-message", {
        messageId,
        userId: currentUser.userId,
        roomId,
      });
    },
    [socket, currentUser]
  );

  return {
    messages: filteredMessages,
    allMessages: messages,
    sendMessage,
    editMessage,
    deleteMessage,
    setMessages,
  };
};


