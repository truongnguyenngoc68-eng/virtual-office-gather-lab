import { useState, useEffect } from "react";
import socket from "../utils/socket";

export default function useReactions() {
  const [reactions, setReactions] = useState([]);
  const [reactionTrayOpen, setReactionTrayOpen] = useState(false);

  useEffect(() => {
    socket.on("player:reacted", (data) => {
      const key = `${data.id}-${Date.now()}`;
      setReactions((prev) => [...prev, { ...data, playerName: data.name, key }]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.key !== key));
      }, 3000);
    });
    return () => socket.off("player:reacted");
  }, []);

  const toggleTray = () => setReactionTrayOpen((prev) => !prev);

  return { reactions, reactionTrayOpen, toggleTray };
}