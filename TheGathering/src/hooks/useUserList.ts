import { useMemo } from "react";
import type { User } from "../contexts/SocketContext";

interface UseUserListOptions {
  users: User[];
  currentUser: User | null;
  searchQuery: string;
}

/**
 * Custom hook to merge and filter user lists
 * Handles deduplication by username, prioritizes online users
 */
export function useUserList({ users, currentUser, searchQuery }: UseUserListOptions) {
  return useMemo(() => {
    const byUsername = new Map<string, User | null | undefined>();

    // Add users from socket context
    users.forEach((u) => {
      if (!u) return;
      const existing = byUsername.get(u.username);
      const status = (u as any).status || "online";
      const existingStatus = (existing as any)?.status || "offline";
      if (!existing || (existingStatus === "offline" && status === "online")) {
        byUsername.set(u.username, u);
      }
    });

    // Add current user if exists
    if (currentUser) {
      const existing = byUsername.get(currentUser.username);
      const existingStatus = (existing as any)?.status || "offline";
      if (!existing || existingStatus === "offline") {
        byUsername.set(currentUser.username, {
          ...currentUser,
          status: "online" as const,
        });
      }
    }

    const merged = Array.from(byUsername.values()).filter(
      (u): u is NonNullable<typeof u> => !!u
    );

    const online = merged.filter((u) => (u as any).status !== "offline");
    const offline = merged.filter((u) => (u as any).status === "offline");

    const query = searchQuery.toLowerCase();
    const filteredOnline = online.filter((u) => u.username.toLowerCase().includes(query));
    const filteredOffline = offline.filter((u) => u.username.toLowerCase().includes(query));

    return {
      onlineUsers: online,
      offlineUsers: offline,
      filteredOnlineUsers: filteredOnline,
      filteredOfflineUsers: filteredOffline,
    };
  }, [users, currentUser, searchQuery]);
}
