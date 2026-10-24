import { useCallback } from "react";
import { useSocket } from "../contexts/SocketContext";

interface UseChatReactionsProps {
  setMessages: React.Dispatch<React.SetStateAction<any[]>>;
  roomId: string;
}

export const useChatReactions = ({
  setMessages,
  roomId,
}: UseChatReactionsProps) => {
  const { socket, currentUser } = useSocket();

  const reactToMessage = useCallback(
    (messageId: string, emoji: string) => {
      if (!socket || !currentUser) return;

      setMessages((prev: any[]) =>
        prev.map((msg) => {
          if (msg.id !== messageId) return msg;

          const existingReactions = msg.reactions || [];
          const reactionIndex = existingReactions.findIndex(
            (r: any) => r.emoji === emoji
          );

          let newReactions: Array<{ emoji: string; users: string[] }>;

          if (reactionIndex >= 0) {
            // Toggle reaction
            const reaction = existingReactions[reactionIndex];
            const userIndex = reaction.users.indexOf(currentUser.userId);

            if (userIndex >= 0) {
              // Remove reaction
              const newUsers = reaction.users.filter(
                (id: string) => id !== currentUser.userId
              );
              if (newUsers.length === 0) {
                // Remove reaction entirely if no users
                newReactions = existingReactions.filter(
                  (_: any, idx: number) => idx !== reactionIndex
                );
              } else {
                newReactions = [...existingReactions];
                newReactions[reactionIndex] = { ...reaction, users: newUsers };
              }
            } else {
              // Add user to reaction
              newReactions = [...existingReactions];
              newReactions[reactionIndex] = {
                ...reaction,
                users: [...reaction.users, currentUser.userId],
              };
            }
          } else {
            // Add new reaction
            newReactions = [
              ...existingReactions,
              { emoji, users: [currentUser.userId] },
            ];
          }

          return {
            ...msg,
            reactions: newReactions,
          };
        })
      );

      // Emit to server
      socket.emit("message-reaction", {
        messageId,
        emoji,
        userId: currentUser.userId,
        roomId,
      });
    },
    [socket, currentUser, roomId, setMessages]
  );

  return {
    reactToMessage,
  };
};


