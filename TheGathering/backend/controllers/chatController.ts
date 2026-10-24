import { Server, Socket } from "socket.io";
import mongoose from "mongoose";
import Message from "../models/Message.js";

interface ConnectedUser {
  userId: string;
  username: string;
  roomId: string;
  avatar?: string;
  position: { x: number; y: number };
  direction?: string;
  socketId: string;
}

interface GroupChat {
  id: string;
  name: string;
  members: string[];
  roomId: string;
  createdBy: string;
  createdAt: number;
}

interface ChatHandlersParams {
  io: Server;
  socket: Socket;
  connectedUsers: Map<string, ConnectedUser>;
  roomUsers: Map<string, Set<string>>;
  groupChats: Map<string, GroupChat>;
}

interface ChatMessageData {
  id?: string;
  message?: string;
  content?: string;
  type?: "nearby" | "global" | "dm" | "group";
  targetUserId?: string;
  groupId?: string;
  channelId?: string;
  timestamp?: number;
  editedAt?: number | null;
  replyTo?: {
    id: string;
    username: string;
    message: string;
  } | null;
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

interface MessageReactionData {
  messageId: string;
  emoji: string;
  userId: string;
  roomId?: string;
}

interface EditMessageData {
  messageId: string;
  newContent: string;
  userId: string;
  roomId?: string;
}

interface DeleteMessageData {
  messageId: string;
  userId: string;
  roomId?: string;
}

interface CreateGroupChatData {
  groupId: string;
  name: string;
  members: string[];
  roomId: string;
}

interface CreateChannelData {
  channelId: string;
  name: string;
  type: "text" | "voice" | "forum";
  description?: string;
  isPrivate?: boolean;
  roomId: string;
}

interface CreateVoiceChannelData {
  channelId: string;
  name: string;
  isPrivate?: boolean;
  roomId: string;
}

export const registerChatHandlers = ({
  io,
  socket,
  connectedUsers,
  roomUsers,
  groupChats,
}: ChatHandlersParams): void => {
  // Socket rate limiting (in-memory)
  const rateStore = new Map<string, { count: number; resetTime: number }>();
  const rateHit = (key: string, windowMs: number, max: number) => {
    const t = Date.now();
    const cur = rateStore.get(key);
    if (!cur || cur.resetTime <= t) {
      rateStore.set(key, { count: 1, resetTime: t + windowMs });
      return { limited: false, retryAfterSec: 0 };
    }
    if (cur.count >= max) {
      return { limited: true, retryAfterSec: Math.ceil((cur.resetTime - t) / 1000) };
    }
    cur.count += 1;
    rateStore.set(key, cur);
    return { limited: false, retryAfterSec: 0 };
  };

  // -----------------------------
  // Rules enforcement (in-memory)
  // -----------------------------
  const MAX_MESSAGE_LENGTH = 2000;
  const SPAM_WINDOW_MS = 3000;
  const SPAM_MAX_MESSAGES = 5;
  const TEMP_MUTE_MS = 10_000;

  const recentMessageTimesByUser = new Map<string, number[]>();
  const mutedUntilByUser = new Map<string, number>();

  const now = () => Date.now();

  const isMuted = (userId: string) => {
    const until = mutedUntilByUser.get(userId) || 0;
    return until > now() ? until : 0;
  };

  const recordMessageAndCheckSpam = (userId: string) => {
    const t = now();
    const arr = recentMessageTimesByUser.get(userId) || [];
    const kept = arr.filter((x) => t - x <= SPAM_WINDOW_MS);
    kept.push(t);
    recentMessageTimesByUser.set(userId, kept);
    if (kept.length > SPAM_MAX_MESSAGES) {
      mutedUntilByUser.set(userId, t + TEMP_MUTE_MS);
      return true;
    }
    return false;
  };

  // Channel rules (per-room, in-memory)
  const normalizeChannelName = (name: string) =>
    name.trim().toLowerCase().replace(/\s+/g, "-");
  const isValidChannelName = (name: string) =>
    /^[a-z0-9][a-z0-9-_]{0,29}$/.test(name);

  // roomId -> type -> set(normalizedName)
  const channelsByRoom: Map<string, Map<string, Set<string>>> =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((globalThis as any).__channelsByRoom ||= new Map());
  const ensureRoomChannelSets = (roomId: string) => {
    if (!channelsByRoom.has(roomId)) {
      const typeMap = new Map<string, Set<string>>();
      typeMap.set("text", new Set(["general", "social"]));
      typeMap.set("voice", new Set(["general-voice", "lobby", "chat-chung"]));
      channelsByRoom.set(roomId, typeMap);
    }
    return channelsByRoom.get(roomId)!;
  };

  // Handle group chat creation
  socket.on("create-group-chat", (data: CreateGroupChatData) => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;

    const { groupId, name, members, roomId } = data;

    // Verify all members are in the same room
    const validMembers = members.filter((memberId) => {
      return Array.from(roomUsers.get(roomId) || []).some((socketId) => {
        const u = connectedUsers.get(socketId);
        return u && u.userId === memberId;
      });
    });

    if (validMembers.length < 2) {
      socket.emit("app-error", {
        message: "Group chat cần ít nhất 2 thành viên",
      });
      return;
    }

    const groupChat: GroupChat = {
      id: groupId,
      name,
      members: validMembers,
      roomId,
      createdBy: user.userId,
      createdAt: Date.now(),
    };

    groupChats.set(groupId, groupChat);

    // Notify all members about the new group
    validMembers.forEach((memberId) => {
      const memberSocket = Array.from(connectedUsers.values()).find(
        (u) => u.userId === memberId && u.roomId === roomId
      );
      if (memberSocket) {
        io.to(memberSocket.socketId).emit("group-chat-created", groupChat);
      }
    });

    console.log(
      `Group chat "${name}" created with ${validMembers.length} members`
    );
  });

  // Handle channel creation
  socket.on("create-channel", (data: CreateChannelData) => {
    const user = connectedUsers.get(socket.id);
    if (!user) {
      socket.emit("app-error", { message: "User not found" });
      return;
    }

    const { channelId, name, type, description, isPrivate, roomId } = data;

    // Verify user is in the same room
    if (user.roomId !== roomId) {
      socket.emit("app-error", {
        message: "Bạn không thể tạo kênh trong phòng khác",
      });
      return;
    }

    const roomSets = ensureRoomChannelSets(roomId);
    const norm = normalizeChannelName(name || "");
    if (!norm) {
      socket.emit("app-error", { message: "Tên kênh không được rỗng" });
      return;
    }
    if (!isValidChannelName(norm)) {
      socket.emit("app-error", {
        message: "Tên kênh chỉ gồm chữ/số, '-' '_' và tối đa 30 ký tự",
      });
      return;
    }
    const setForType = roomSets.get(type) || new Set<string>();
    if (setForType.has(norm)) {
      socket.emit("app-error", { message: `Kênh #${norm} đã tồn tại trong room` });
      return;
    }
    setForType.add(norm);
    roomSets.set(type, setForType);

    // Broadcast new channel to all users in room
    const channelData = {
      id: channelId,
      name: norm,
      type,
      description,
      isPrivate: isPrivate || false,
      roomId,
      createdBy: user.userId,
      createdAt: Date.now(),
    };

    io.to(roomId).emit("channel-created", channelData);
    console.log(`✅ Channel "${name}" (${type}) created by ${user.username} in room ${roomId}${isPrivate ? " (PRIVATE)" : ""}`);
  });

  // Handle voice channel creation
  socket.on("create-voice-channel", (data: CreateVoiceChannelData) => {
    const user = connectedUsers.get(socket.id);
    if (!user) {
      socket.emit("app-error", { message: "User not found" });
      return;
    }

    const { channelId, name, isPrivate, roomId } = data;

    // Verify user is in the same room
    if (user.roomId !== roomId) {
      socket.emit("app-error", {
        message: "Bạn không thể tạo kênh trong phòng khác",
      });
      return;
    }

    const roomSets = ensureRoomChannelSets(roomId);
    const norm = normalizeChannelName(name || "");
    if (!norm) {
      socket.emit("app-error", { message: "Tên kênh voice không được rỗng" });
      return;
    }
    if (!isValidChannelName(norm)) {
      socket.emit("app-error", {
        message: "Tên kênh voice chỉ gồm chữ/số, '-' '_' và tối đa 30 ký tự",
      });
      return;
    }
    const setForType = roomSets.get("voice") || new Set<string>();
    if (setForType.has(norm)) {
      socket.emit("app-error", { message: `Voice channel ${norm} đã tồn tại trong room` });
      return;
    }
    setForType.add(norm);
    roomSets.set("voice", setForType);

    // Broadcast new voice channel to all users in room
    const channelData = {
      id: channelId,
      name: norm,
      type: "voice",
      isPrivate: isPrivate || false,
      roomId,
      createdBy: user.userId,
      createdAt: Date.now(),
      users: [],
      isActive: false,
    };

    io.to(roomId).emit("voice-channel-created", channelData);
    console.log(`✅ Voice channel "${name}" created by ${user.username} in room ${roomId}${isPrivate ? " (PRIVATE)" : ""}`);
  });

  socket.on("chat-message", async (data: ChatMessageData) => {
    const user = connectedUsers.get(socket.id);
    if (!user) {
      console.warn(
        "Chat message received but user not found for socket:",
        socket.id
      );
      return;
    }

    console.log("Received chat-message event:", {
      userId: user.userId,
      username: user.username,
      data: data,
    });

    // Rate limit socket event (rule 31)
    const rlMsg = rateHit(`chat-message:${user.userId}`, 3000, 8);
    if (rlMsg.limited) {
      socket.emit("app-error", { message: `Bạn gửi quá nhanh. Thử lại sau ${rlMsg.retryAfterSec}s` });
      return;
    }

    const rawContent = (data.message ?? data.content ?? "").toString();
    const content = rawContent.trim();
    const messageType = (data.type || "global") as "nearby" | "global" | "dm" | "group";

    // Rule: spam protection + temp mute
    const mutedUntil = isMuted(user.userId);
    if (mutedUntil) {
      socket.emit("app-error", {
        message: `Bạn đang bị mute tạm thời. Thử lại sau ${Math.ceil((mutedUntil - now()) / 1000)}s`,
      });
      return;
    }
    if (recordMessageAndCheckSpam(user.userId)) {
      socket.emit("app-error", { message: "Bạn gửi quá nhanh. Bị mute tạm thời 10s." });
      return;
    }

    // Rule: message not empty + max length
    if (!content) {
      socket.emit("app-error", { message: "Message không được rỗng" });
      return;
    }
    if (content.length > MAX_MESSAGE_LENGTH) {
      socket.emit("app-error", { message: `Message tối đa ${MAX_MESSAGE_LENGTH} ký tự` });
      return;
    }

    // Rule: DM cannot be sent to self
    if (messageType === "dm" && data.targetUserId && data.targetUserId === user.userId) {
      socket.emit("app-error", { message: "Không thể DM chính mình" });
      return;
    }

    const message = {
      id: "", // set after DB save
      userId: user.userId,
      username: user.username,
      message: content,
      type: messageType,
      targetUserId: data.targetUserId || null,
      groupId: data.groupId || null,
      channelId: data.channelId || (messageType === "global" ? "general" : null),
      timestamp: data.timestamp || Date.now(),
      editedAt: null as number | null,
      replyTo: data.replyTo || null,
      reactions: [],
      attachments: data.attachments || [],
    };

    console.log("Backend processing message:", {
      id: message.id,
      channelId: message.channelId,
      type: message.type,
      userId: message.userId,
      username: message.username,
    });

    console.log("Processing chat message (validated):", {
      type: message.type,
      channelId: message.channelId,
      userId: message.userId,
    });

    const recipients: string[] = [];

    if (message.type === "nearby") {
      const nearbyUsers = Array.from(roomUsers.get(user.roomId) || [])
        .map((id) => connectedUsers.get(id))
        .filter((u) => {
          if (!u || u.userId === user.userId) return false;
          const distance = Math.sqrt(
            Math.pow((u.position?.x || 0) - (user.position?.x || 0), 2) +
              Math.pow((u.position?.y || 0) - (user.position?.y || 0), 2)
          );
          return distance < 200;
        });

      // compute recipients; emit after DB save
      nearbyUsers.forEach((recipient) => recipient && recipients.push(recipient.userId));
    } else if (message.type === "global") {
      recipients.push(
        ...Array.from(roomUsers.get(user.roomId) || []).map((id) => {
          const recipient = connectedUsers.get(id);
          return recipient?.userId;
        }).filter((id): id is string => id !== undefined)
      );
    } else if (message.type === "group" && message.groupId) {
      // Group chat - send to all members of the group
      const group = groupChats.get(message.groupId);
      if (!group) {
        console.warn(`Group chat ${message.groupId} not found`);
        socket.emit("app-error", {
          message: "Group chat không tồn tại",
        });
        return;
      }

      // Verify user is a member of the group
      if (!group.members.includes(user.userId)) {
        console.warn(
          `User ${user.userId} is not a member of group ${message.groupId}`
        );
        socket.emit("app-error", {
          message: "Bạn không phải thành viên của group này",
        });
        return;
      }

      // Send message to all group members
      group.members.forEach((memberId) => {
        const memberSocket = Array.from(connectedUsers.values()).find(
          (u) => u.userId === memberId && u.roomId === user.roomId
        );
        if (memberSocket) {
          io.to(memberSocket.socketId).emit("chat-message", message);
          recipients.push(memberId);
        }
      });

      console.log(
        `Sent group message to ${group.members.length} members in group "${group.name}"`
      );
    } else if (message.type === "dm" && message.targetUserId) {
      const targetUser = Array.from(connectedUsers.values()).find(
        (u) => u.userId === message.targetUserId && u.roomId === user.roomId
      );
      if (targetUser) {
        recipients.push(targetUser.userId);
      } else {
        console.warn(
          `Target user ${message.targetUserId} not found for DM in room ${user.roomId}`
        );
        console.log(
          "Available users in room:",
          Array.from(roomUsers.get(user.roomId) || [])
            .map((id) => {
              const u = connectedUsers.get(id);
              return u ? `${u.username} (${u.userId})` : null;
            })
            .filter(Boolean)
        );
        socket.emit("app-error", { message: "Người nhận không tìm thấy hoặc đã rời phòng" });
        return;
      }
    }

    // Persist message
    try {
      // IMPORTANT:
      // We use a stable id that is unique upfront to satisfy unique index on messageId
      // and to keep server as the source of truth for edit/delete/reaction.
      const _id = new mongoose.Types.ObjectId();
      const stableId = _id.toString();
      message.id = stableId;

      const messageDoc: any = {
        _id,
        roomId: user.roomId,
        messageId: stableId,
        senderId: user.userId,
        senderName: user.username,
        type: message.type,
        content: message.message,
        targetUserId: message.targetUserId,
        groupId: message.groupId,
        channelId: message.channelId,
        recipients: recipients.filter(Boolean),
        timestamp: new Date(message.timestamp),
        isDeleted: false,
      };
      
      // Add optional fields if they exist
      if (message.editedAt) {
        messageDoc.editedAt = new Date(message.editedAt);
      }
      if (message.replyTo) {
        messageDoc.replyTo = message.replyTo;
      }
      if (data.attachments && data.attachments.length > 0) {
        messageDoc.attachments = data.attachments;
      }
      
      await Message.create(messageDoc);

      // Emit AFTER DB save so id is authoritative and consistent
      if (message.type === "nearby") {
        const nearbySockets = Array.from(roomUsers.get(user.roomId) || [])
          .map((id) => connectedUsers.get(id))
          .filter((u) => u && recipients.includes(u.userId));
        nearbySockets.forEach((recipient) => {
          io.to(recipient!.socketId).emit("chat-message", message);
        });
        socket.emit("chat-message", message);
      } else if (message.type === "global") {
        io.to(user.roomId).emit("chat-message", message);
      } else if (message.type === "group" && message.groupId) {
        const group = groupChats.get(message.groupId);
        group?.members.forEach((memberId) => {
          const memberSocket = Array.from(connectedUsers.values()).find(
            (u) => u.userId === memberId && u.roomId === user.roomId
          );
          if (memberSocket) {
            io.to(memberSocket.socketId).emit("chat-message", message);
          }
        });
      } else if (message.type === "dm" && message.targetUserId) {
        const targetUser = Array.from(connectedUsers.values()).find(
          (u) => u.userId === message.targetUserId && u.roomId === user.roomId
        );
        if (targetUser) {
          io.to(targetUser.socketId).emit("chat-message", message);
        }
        socket.emit("chat-message", message);
      }
      console.log("✅ Message saved+emitted with id:", message.id);
    } catch (error) {
      console.error("Failed to save message", error);
      socket.emit("app-error", { message: "Không thể lưu tin nhắn. Thử lại." });
    }
  });

  // Handle message reaction
  socket.on("message-reaction", async (data: MessageReactionData) => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;

    const rlReact = rateHit(`reaction:${user.userId}`, 5000, 25);
    if (rlReact.limited) {
      socket.emit("app-error", { message: `Bạn react quá nhanh. Thử lại sau ${rlReact.retryAfterSec}s` });
      return;
    }

    const { messageId, emoji, roomId } = data;
    const targetRoomId = roomId || user.roomId;

    if (!messageId || !emoji) return;

    // Rule: cannot react to deleted message, and cap 20 reactions/user/message
    const doc = await Message.findOne({ roomId: targetRoomId, messageId }).exec();
    if (!doc) {
      socket.emit("app-error", { message: "Message không tồn tại" });
      return;
    }
    if (doc.isDeleted) {
      socket.emit("app-error", { message: "Không thể react message đã xóa" });
      return;
    }

    const uid = user.userId;
    const existing = doc.reactions || [];
    const idx = existing.findIndex((r: any) => r.emoji === emoji);

    const totalReactionsByUser = existing.reduce((acc: number, r: any) => {
      return acc + (r.users?.includes(uid) ? 1 : 0);
    }, 0);

    const userAlreadyReactedToThisEmoji =
      idx >= 0 ? (existing[idx].users || []).includes(uid) : false;

    if (!userAlreadyReactedToThisEmoji && totalReactionsByUser >= 20) {
      socket.emit("app-error", { message: "Bạn đã react tối đa 20 lần cho message này" });
      return;
    }

    if (idx >= 0) {
      const usersArr = existing[idx].users || [];
      if (usersArr.includes(uid)) {
        existing[idx].users = usersArr.filter((x: string) => x !== uid);
        if (existing[idx].users.length === 0) {
          existing.splice(idx, 1);
        }
      } else {
        existing[idx].users = [...usersArr, uid];
      }
    } else {
      existing.push({ emoji, users: [uid] });
    }

    doc.reactions = existing as any;
    await doc.save();

    console.log(`📢 Broadcasting message-reaction-updated to room ${targetRoomId}:`, { messageId, emoji, userId: uid });

    // Broadcast reaction update to ALL users in room (realtime)
    io.to(targetRoomId).emit("message-reaction-updated", {
      messageId,
      emoji,
      userId: uid,
    });

    console.log(`✅ User ${user.username} reacted ${emoji} to message ${messageId} - broadcasted to room ${targetRoomId}`);
  });

  // Handle message edit
  socket.on("edit-message", async (data: EditMessageData) => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;

    const rlEdit = rateHit(`edit:${user.userId}`, 5000, 10);
    if (rlEdit.limited) {
      socket.emit("app-error", { message: `Bạn thao tác quá nhanh. Thử lại sau ${rlEdit.retryAfterSec}s` });
      return;
    }

    const { messageId, newContent, roomId } = data;
    const targetRoomId = roomId || user.roomId;
    const content = (newContent || "").toString().trim();

    if (!content) {
      socket.emit("app-error", { message: "Message không được rỗng" });
      return;
    }
    if (content.length > MAX_MESSAGE_LENGTH) {
      socket.emit("app-error", { message: `Message tối đa ${MAX_MESSAGE_LENGTH} ký tự` });
      return;
    }

    const doc = await Message.findOne({ roomId: targetRoomId, messageId }).exec();
    if (!doc) {
      socket.emit("app-error", { message: "Message không tồn tại" });
      return;
    }
    if (doc.isDeleted) {
      socket.emit("app-error", { message: "Không thể sửa message đã xóa" });
      return;
    }
    if (doc.senderId !== user.userId) {
      socket.emit("app-error", { message: "Không thể sửa message của người khác" });
      return;
    }

    doc.content = content;
    doc.editedAt = new Date();
    await doc.save();

    console.log(`📢 Broadcasting message-edited to room ${targetRoomId}:`, { messageId, userId, newContent: newContent?.substring(0, 50) });

    // Broadcast edit to ALL users in room (realtime)
    io.to(targetRoomId).emit("message-edited", {
      messageId,
      newContent: content,
      editedAt: Date.now(),
      userId: user.userId,
    });

    console.log(`✅ User ${user.username} edited message ${messageId} - broadcasted to room ${targetRoomId}`);
  });

  // Handle message delete
  socket.on("delete-message", async (data: DeleteMessageData) => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;

    const rlDel = rateHit(`delete:${user.userId}`, 5000, 10);
    if (rlDel.limited) {
      socket.emit("app-error", { message: `Bạn thao tác quá nhanh. Thử lại sau ${rlDel.retryAfterSec}s` });
      return;
    }

    const { messageId, roomId } = data;
    const targetRoomId = roomId || user.roomId;

    const doc = await Message.findOne({ roomId: targetRoomId, messageId }).exec();
    if (!doc) {
      socket.emit("app-error", { message: "Message không tồn tại" });
      return;
    }
    if (doc.isDeleted) {
      socket.emit("app-error", { message: "Message đã bị xóa" });
      return;
    }
    if (doc.senderId !== user.userId) {
      socket.emit("app-error", { message: "Không thể xóa message của người khác" });
      return;
    }

    doc.isDeleted = true;
    doc.deletedAt = new Date();
    doc.deletedBy = user.userId;
    await doc.save();

    console.log(`📢 Broadcasting message-deleted to room ${targetRoomId}:`, { messageId, userId });

    // Broadcast delete to ALL users in room (realtime)
    io.to(targetRoomId).emit("message-deleted", {
      messageId,
      userId: user.userId,
    });

    console.log(`✅ User ${user.username} deleted message ${messageId} - broadcasted to room ${targetRoomId}`);
  });
};

