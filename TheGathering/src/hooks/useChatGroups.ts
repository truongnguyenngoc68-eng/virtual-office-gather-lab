import { useState, useEffect, useCallback } from "react";
import { useSocket } from "../contexts/SocketContext";
import { GroupChat } from "../contexts/ChatContext";

export const useChatGroups = (roomId: string) => {
  const { socket, currentUser } = useSocket();
  const [groupChats, setGroupChats] = useState<GroupChat[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Listen for group chat events
  useEffect(() => {
    if (!socket) return;

    const handleGroupCreated = (group: GroupChat) => {
      setGroupChats((prev) => {
        if (prev.some((g) => g.id === group.id)) {
          return prev;
        }
        return [...prev, group];
      });
    };

    socket.on("group-chat-created", handleGroupCreated);

    return () => {
      socket.off("group-chat-created", handleGroupCreated);
    };
  }, [socket]);

  const createGroupChat = useCallback(
    (name: string, memberIds: string[], setActiveTab: (tab: any) => void) => {
      if (!socket || !currentUser) return;

      const groupId = `group-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 6)}`;
      const newGroup: GroupChat = {
        id: groupId,
        name,
        members: [currentUser.userId, ...memberIds],
        createdBy: currentUser.userId,
        createdAt: Date.now(),
      };

      socket.emit("create-group-chat", {
        groupId,
        name,
        members: newGroup.members,
        roomId,
      });

      setGroupChats((prev) => [...prev, newGroup]);
      setSelectedGroupId(groupId);
      setActiveTab("group");
    },
    [socket, currentUser, roomId]
  );

  return {
    groupChats,
    selectedGroupId,
    setSelectedGroupId,
    createGroupChat,
  };
};


