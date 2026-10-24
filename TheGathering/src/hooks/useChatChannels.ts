import { useState, useEffect, useMemo, useCallback } from "react";
import { useSocket } from "../contexts/SocketContext";
import { Channel, VoiceChannel } from "../contexts/ChatContext";

export const useChatChannels = (roomId: string) => {
  const { socket, currentUser, users } = useSocket();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [voiceChannels, setVoiceChannels] = useState<VoiceChannel[]>([]);
  const [currentVoiceChannel, setCurrentVoiceChannel] = useState<string | null>(
    null
  );
  const [channelUnreads, setChannelUnreads] = useState<Map<string, number>>(
    new Map()
  );
  // Track per-channel last read timestamp (ms). This enables "mark as read" to clear
  // the badge when a channel is opened, while still allowing future new messages
  // to increment unread again.
  const [lastReadAt, setLastReadAt] = useState<Map<string, number>>(new Map());

  // Initialize default channels (only once, don't reset if already initialized)
  useEffect(() => {
    setChannels((prev) => {
      if (prev.length > 0) {
        // Already initialized, don't reset
        return prev;
      }
      return [
        {
          id: "general",
          name: "general",
          type: "text",
          description: "Share company-wide updates, wins, announcements",
        },
        {
          id: "social",
          name: "social",
          type: "text",
          description: "Casual conversations and social interactions",
        },
      ];
    });

    setVoiceChannels((prev) => {
      if (prev.length > 0) {
        // Already initialized, don't reset - preserve users from server
        console.log("Voice channels already initialized, preserving state:", prev);
        return prev;
      }
      console.log("Initializing default voice channels");
      return [
        { id: "general-voice", name: "Chat chung", users: [], isActive: false },
      ];
    });
  }, []);

  // Don't override voice channel users - they come from server via voice-channel-update event
  // This useEffect was causing the issue by resetting users to only current user
  // Removed to let server be the source of truth

  // Listen for voice channel updates from socket
  useEffect(() => {
    if (!socket) {
      return;
    }

    const setupListener = () => {
      if (!socket.connected) {
        return;
      }

      console.log("Setting up voice-channel-update listener");

      const handleVoiceChannelUpdate = (data: {
        channelId: string;
        users: string[];
      }) => {
        console.log("✅ Received voice-channel-update:", {
          channelId: data.channelId,
          users: data.users,
          usersCount: data.users.length,
        });
        setVoiceChannels((prev) => {
          // Check if channel exists
          const channelExists = prev.some((vc) => vc.id === data.channelId);
          
          if (!channelExists) {
            console.warn(`Channel ${data.channelId} not found in voiceChannels, adding it`);
            // Channel doesn't exist, add it
            return [
              ...prev,
              {
                id: data.channelId,
                name: data.channelId, // Default name, should be set from server
                users: data.users,
                isActive: data.users.length > 0,
              },
            ];
          }

          const updated = prev.map((vc) => {
            if (vc.id === data.channelId) {
              console.log(`Updating channel ${vc.id}:`, {
                oldUsers: vc.users,
                newUsers: data.users,
                oldCount: vc.users.length,
                newCount: data.users.length,
              });
              return { ...vc, users: data.users, isActive: data.users.length > 0 };
            }
            return vc;
          });
          console.log("Updated voice channels:", updated.map(vc => ({ id: vc.id, users: vc.users, count: vc.users.length })));
          return updated;
        });
      };

      socket.on("voice-channel-update", handleVoiceChannelUpdate);
      console.log("Voice-channel-update listener registered");

      return () => {
        console.log("Cleaning up voice-channel-update listener");
        socket.off("voice-channel-update", handleVoiceChannelUpdate);
      };
    };

    // Setup listener if socket is already connected
    if (socket.connected) {
      const cleanup = setupListener();
      return cleanup;
    }

    // Otherwise wait for connection
    const onConnect = () => {
      console.log("Socket connected, setting up voice-channel-update listener");
      setupListener();
    };
    
    socket.on("connect", onConnect);

    return () => {
      socket.off("connect", onConnect);
    };
  }, [socket]);

  // Listen for channel creation events
  useEffect(() => {
    if (!socket) return;

    const handleChannelCreated = (data: Channel) => {
      console.log("✅ Received channel-created event:", data);
      setChannels((prev) => {
        // Check if channel already exists
        if (prev.some((ch) => ch.id === data.id)) {
          return prev;
        }
        return [...prev, data];
      });
    };

    const handleVoiceChannelCreated = (data: VoiceChannel & { isPrivate?: boolean }) => {
      console.log("✅ Received voice-channel-created event:", data);
      setVoiceChannels((prev) => {
        // Check if channel already exists
        if (prev.some((vc) => vc.id === data.id)) {
          return prev;
        }
        return [...prev, {
          id: data.id,
          name: data.name,
          users: data.users || [],
          isActive: data.isActive || false,
        }];
      });
    };

    socket.on("channel-created", handleChannelCreated);
    socket.on("voice-channel-created", handleVoiceChannelCreated);

    return () => {
      socket.off("channel-created", handleChannelCreated);
      socket.off("voice-channel-created", handleVoiceChannelCreated);
    };
  }, [socket]);

  const joinVoiceChannel = useCallback(
    (channelId: string) => {
      if (!socket || !currentUser) return;

      // Leave current voice channel if any
      if (currentVoiceChannel && currentVoiceChannel !== channelId) {
        leaveVoiceChannel();
      }

      setCurrentVoiceChannel(channelId);

      // Emit to server
      socket.emit("join-voice-channel", {
        channelId,
        userId: currentUser.userId,
        roomId,
      });

      // Don't optimistically update - wait for server response
      // The server will broadcast voice-channel-update with the correct list
      console.log("Emitted join-voice-channel, waiting for server response...");
    },
    [socket, currentUser, roomId, currentVoiceChannel]
  );

  const leaveVoiceChannel = useCallback(() => {
    if (!socket || !currentUser || !currentVoiceChannel) return;

    const channelToLeave = currentVoiceChannel;

    console.log("Leaving voice channel:", channelToLeave);

    socket.emit("leave-voice-channel", {
      channelId: channelToLeave,
      userId: currentUser.userId,
      roomId,
    });

    // Don't optimistically update - wait for server response
    setCurrentVoiceChannel(null);
  }, [socket, currentUser, roomId, currentVoiceChannel]);

  const updateChannelUnread = useCallback(
    (channelId: string, count: number) => {
      setChannelUnreads((prev) => {
        const next = new Map(prev);
        if (count === 0) {
          next.delete(channelId);
        } else {
          next.set(channelId, count);
        }
        return next;
      });

      // Update channels with unread counts
      setChannels((prev) =>
        prev.map((ch) =>
          ch.id === channelId ? { ...ch, unreadCount: count } : ch
        )
      );
    },
    []
  );

  const markChannelAsViewed = useCallback(
    (channelId: string) => {
      setLastReadAt((prev) => {
        const next = new Map(prev);
        next.set(channelId, Date.now());
        return next;
      });
      updateChannelUnread(channelId, 0);
    },
    [updateChannelUnread]
  );

  const createChannel = useCallback(
    (name: string, type: "text" | "voice", description?: string, isPrivate?: boolean) => {
      if (!socket || !currentUser) {
        console.error("Cannot create channel: missing socket or currentUser");
        return;
      }

      const channelId =
        type === "text"
          ? `channel-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
          : `voice-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      if (type === "text") {
        const newChannel: Channel = {
          id: channelId,
          name,
          type: type,
          description,
        };
        setChannels((prev) => [...prev, newChannel]);

        socket.emit("create-channel", {
          channelId,
          name,
          type: type,
          description,
          isPrivate: isPrivate || false,
          roomId,
        });
        console.log("✅ Emitted create-channel:", { channelId, name, type, isPrivate });
      } else {
        const newVoiceChannel: VoiceChannel = {
          id: channelId,
          name,
          users: [],
          isActive: false,
        };
        setVoiceChannels((prev) => [...prev, newVoiceChannel]);

        socket.emit("create-voice-channel", {
          channelId,
          name,
          isPrivate: isPrivate || false,
          roomId,
        });
        console.log("✅ Emitted create-voice-channel:", { channelId, name, isPrivate });
      }
    },
    [socket, currentUser, roomId]
  );

  const channelsWithUnreads = useMemo(() => {
    return channels.map((ch) => ({
      ...ch,
      unreadCount: channelUnreads.get(ch.id) || ch.unreadCount || 0,
    }));
  }, [channels, channelUnreads]);

  return {
    channels: channelsWithUnreads,
    voiceChannels,
    currentVoiceChannel,
    channelUnreads,
    lastReadAt,
    joinVoiceChannel,
    leaveVoiceChannel,
    updateChannelUnread,
    markChannelAsViewed,
    createChannel,
    setChannelUnreads,
    setLastReadAt,
  };
};
