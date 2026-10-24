import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  users: User[];
  currentUser: User | null;
}

export interface User {
  userId: string;
  username: string;
  avatar: string;
  position: { x: number; y: number };
  direction?: string;
  roomId?: string;
  status?: "online" | "offline"; // Track user status
  role?: "admin" | "member";
  // Linked avatar from profile (optional)
  displayName?: string;
  avatarConfig?: Record<string, string>;
  [key: string]: unknown; // Index signature for flexibility
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
  username: string;
  roomId: string;
}

export const SocketProvider = ({
  children,
  username,
  roomId,
}: SocketProviderProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    console.log("SocketProvider Effect Triggered. RoomId:", roomId, "Username:", username);
    const newSocket = io(
      import.meta.env.VITE_SERVER_URL || "http://localhost:5001",
      {
        transports: ["websocket"],
      }
    );

    newSocket.on("connect", async () => {
      console.log("Connected to server");
      setIsConnected(true);

      // Join room
      // Prefer authenticated user identity (so avatar + profile can be linked)
      let userId: string | null = null;
      let resolvedUsername = username;
      let displayName: string | undefined;
      let avatarConfig: Record<string, string> | undefined;

      try {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const u = JSON.parse(userStr);
          userId = (u?.id || u?._id || null) as string | null;
          displayName = (u?.displayName || u?.username) as string | undefined;
          avatarConfig = (u?.avatarConfig || undefined) as
            | Record<string, string>
            | undefined;
          // Prefer displayName if present
          resolvedUsername =
            (localStorage.getItem("userName") as string) ||
            displayName ||
            (u?.username as string) ||
            resolvedUsername;
        }
      } catch (e) {
        console.warn("Failed to parse localStorage user profile:", e);
      }

      if (!userId) {
        userId = localStorage.getItem("userId");
      }
      if (!userId) {
        userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
      localStorage.setItem("userId", userId);

      const storedAvatar =
        localStorage.getItem("userAvatar") ||
        (resolvedUsername || username).charAt(0).toUpperCase();
      const storedPosition = (() => {
        try {
          const raw = localStorage.getItem("userPosition");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (
              parsed &&
              Number.isFinite(parsed.x) &&
              Number.isFinite(parsed.y)
            ) {
              return { x: parsed.x, y: parsed.y };
            }
          }
        } catch (error) {
          console.warn("Failed to parse stored position", error);
        }
        return { x: 100, y: 100 };
      })();
      const user: User = {
        userId,
        username: resolvedUsername,
        avatar: storedAvatar,
        position: storedPosition,
        roomId,
        status: "online",
        displayName,
        avatarConfig,
      };
      setCurrentUser(user);
      currentUserIdRef.current = userId;

      // Load all room members from API (including offline) before joining
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SERVER_URL || "http://localhost:5001"}/api/rooms/${roomId}/users`
        );
        if (response.ok) {
          const allRoomMembers: any[] = await response.json();
          console.log("Loaded room members from API:", allRoomMembers.length, "users");
          // Set initial users list (excluding current user)
          setUsers(
            allRoomMembers
              .filter((member) => member.userId !== userId)
              .map((member) => ({
                ...member,
                status: (member.status || "offline") as "online" | "offline",
                role: (member.role || "member") as "admin" | "member",
              }))
          );
        } else if (response.status === 404) {
          // Room might not have members yet, this is OK
          console.log("No room members found yet (room might be new)");
        }
      } catch (error) {
        // Silently handle errors - socket will provide users via room-users event
        console.log("Could not load room members from API (will use socket events instead):", error);
      }

      newSocket.emit("user-join", {
        userId,
        username: resolvedUsername,
        roomId,
        avatar: storedAvatar,
        avatarConfig: avatarConfig || undefined,
        position: storedPosition,
      });
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from server");
      setIsConnected(false);
    });

    newSocket.on("room-users", (roomUsers: User[]) => {
      console.log("📥 Received room-users event:", roomUsers.length, "users");
      console.log("📥 Users from server:", roomUsers.map(u => ({ userId: u.userId, username: u.username, status: (u as any).status })));

      // IMPORTANT:
      // Backend currently emits "room-users" WITHOUT the current user (to reduce noise).
      // That means in a fresh room with only you, roomUsers can be [].
      // So we MUST merge this payload into existing members (from API) instead of wiping state.
      setUsers((prev) => {
        const currentUserId = currentUserIdRef.current;

        // If server returns empty list, don't wipe existing members (API already has offline members)
        if (!roomUsers || roomUsers.length === 0) {
          return prev;
        }

        const nextMap = new Map<string, User>();
        prev.forEach((u) => nextMap.set(u.userId, u));

        // Merge payload into existing map
        roomUsers.forEach((user) => {
          if (user.userId === currentUserId) {
            // Update currentUser role/status from authoritative server payload
            setCurrentUser((cu) =>
              cu
                ? {
                  ...cu,
                  role: ((user as any).role || (cu as any).role || "member") as
                    | "admin"
                    | "member",
                }
                : cu
            );
            return;
          }
          const prevUser = nextMap.get(user.userId);
          const status = ((user as any).status ||
            prevUser?.status ||
            "online") as "online" | "offline";
          const role = ((user as any).role ||
            (prevUser as any)?.role ||
            "member") as "admin" | "member";
          nextMap.set(user.userId, {
            ...(prevUser || {}),
            ...user,
            status,
            role,
          });
        });

        const updated = Array.from(nextMap.values());
        console.log("📊 Updated users list (merged room-users):", updated.length, "users");
        return updated;
      });
    });

    newSocket.on("user-joined", (user: User) => {
      console.log("User joined event received:", user);
      setUsers((prev) => {
        const currentUserId = currentUserIdRef.current;
        // Don't update current user
        if (user.userId === currentUserId) {
          setCurrentUser((cu) =>
            cu
              ? {
                ...cu,
                role: ((user as any).role || (cu as any).role || "member") as
                  | "admin"
                  | "member",
              }
              : cu
          );
          return prev;
        }

        // Check if user already exists (could be offline)
        const existingIndex = prev.findIndex((u) => u.userId === user.userId);
        if (existingIndex >= 0) {
          // Update existing user to online IMMEDIATELY (realtime)
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            ...user,
            status: (user as any).status || "online" as const,
            role: ((user as any).role || updated[existingIndex].role || "member") as "admin" | "member",
          };
          console.log(`Updated user ${user.userId} to online - REALTIME`);
          return updated;
        }
        // Add new user as online
        return [
          ...prev,
          {
            ...user,
            status: (user as any).status || ("online" as const),
            role: ((user as any).role || "member") as "admin" | "member",
          },
        ];
      });
    });

    // Admin transfer event (optional UI sync)
    newSocket.on("room-admin-changed", (data: { roomId: string; newAdminUserId: string }) => {
      setUsers((prev) =>
        prev.map((u) =>
          u.userId === data.newAdminUserId ? { ...u, role: "admin" } : u
        )
      );
    });

    newSocket.on("user-left", (data: { userId: string; username?: string; timestamp?: number }) => {
      console.log("User left event received:", data);
      setUsers((prev) => {
        const currentUserId = currentUserIdRef.current;
        // Don't mark current user as offline (they're still connected)
        if (data.userId === currentUserId) {
          console.log("Ignoring user-left for current user");
          return prev;
        }

        // Check if user exists in list
        const existingIndex = prev.findIndex((u) => u.userId === data.userId);

        if (existingIndex >= 0) {
          // Mark existing user as offline IMMEDIATELY (realtime update)
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            status: "offline" as const
          };
          console.log(`Marked user ${data.userId} (${data.username}) as offline - REALTIME`);
          return updated;
        } else {
          // User not in list - add them as offline (they might have been in room before we joined)
          // Only add if we have username from the event
          if (data.username) {
            console.log(`Adding offline user ${data.username} (${data.userId}) to list`);
            return [...prev, {
              userId: data.userId,
              username: data.username,
              avatar: data.username.charAt(0).toUpperCase(),
              position: { x: 0, y: 0 },
              status: "offline" as const,
            }];
          }
          return prev;
        }
      });
    });

    newSocket.on("room-full", (data: { message: string; maxUsers: number; currentUsers: number }) => {
      alert(data.message);
      // Redirect to lobby or show error
    });

    newSocket.on("room-info", (data: { roomId: string; currentUsers: number; maxUsers: number }) => {
      // Update room info if needed
      console.log(`Room ${data.roomId}: ${data.currentUsers}/${data.maxUsers} users`);
    });

    newSocket.on("app-error", (data: { message: string }) => {
      console.error("App error:", data.message);
      // Show alert for all errors (including duplicate username)
      alert(data.message);
    });

    // Nhận danh sách vị trí của tất cả người chơi
    newSocket.on("allPlayersPositions", (allPlayers: User[]) => {
      // Persist current user's latest position locally to restore after refresh
      const self = allPlayers.find((p) => p.userId === currentUser?.userId);
      if (self?.position) {
        localStorage.setItem("userPosition", JSON.stringify(self.position));
        setCurrentUser((prev) =>
          prev ? { ...prev, position: self.position, direction: self.direction || prev.direction } : prev
        );
      }

      // Cập nhật danh sách users với vị trí mới và mark as online
      setUsers((prev) => {
        const updatedUsers = [...prev];
        const onlineUserIds = new Set(allPlayers.map(p => p.userId));

        // Track users that were marked offline by user-left event (preserve their offline status)
        const offlineUsersFromLeftEvent = new Set(
          prev.filter(u => u.status === "offline" && u.userId !== currentUser?.userId)
            .map(u => u.userId)
        );

        allPlayers.forEach((player) => {
          if (player.userId !== currentUser?.userId) {
            const existingIndex = updatedUsers.findIndex(
              (u) => u.userId === player.userId
            );
            if (existingIndex >= 0) {
              // Update existing user with new position/direction
              // BUT: If user was marked offline by user-left event, keep them offline
              const wasOffline = offlineUsersFromLeftEvent.has(player.userId);
              updatedUsers[existingIndex] = {
                ...updatedUsers[existingIndex],
                position: player.position || updatedUsers[existingIndex].position,
                direction: player.direction || updatedUsers[existingIndex].direction,
                status: wasOffline ? "offline" as const : "online" as const,
              };
            } else {
              // Add new user if not exists (only if they're truly online)
              updatedUsers.push({ ...player, status: "online" as const });
            }
          }
        });

        // Mark users not in allPlayers as offline (but preserve offline status from user-left event)
        updatedUsers.forEach((user, index) => {
          if (user.userId !== currentUser?.userId && !onlineUserIds.has(user.userId)) {
            // Only mark as offline if not already offline (preserve offline status from user-left)
            if (user.status !== "offline") {
              updatedUsers[index] = { ...user, status: "offline" as const };
            }
          }
        });

        return updatedUsers;
      });
    });

    // Listen for individual player movement updates
    newSocket.on("playerMoved", (data: { userId: string; position: { x: number; y: number }; direction?: string }) => {
      setUsers((prev) => {
        return prev.map((u) => {
          if (u.userId === data.userId) {
            return {
              ...u,
              position: data.position,
              direction: data.direction || u.direction,
            };
          }
          return u;
        });
      });
    });

    newSocket.on("join-success", (userData: User) => {
      console.log("Joined successfully, updating user data:", userData);
      setCurrentUser(userData);
    });

    setSocket(newSocket);

    return () => {
      console.log("Cleaning up socket connection...");
      // Remove all listeners before disconnecting to prevent memory leaks
      newSocket.removeAllListeners();
      newSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [username, roomId]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, users, currentUser }}>
      {children}
    </SocketContext.Provider>
  );
};

