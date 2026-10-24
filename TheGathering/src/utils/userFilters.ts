/**
 * User filtering utilities
 */
import { calculateDistance, isWithinDistance } from "./distance.js";
import type { User } from "../contexts/SocketContext";

// Re-export User type for convenience
export type { User };

/**
 * Filter users that are nearby (within distance threshold)
 */
export function getNearbyUsers(
  users: User[],
  currentUser: User | null | undefined,
  maxDistance: number = 200
): User[] {
  if (!currentUser) return [];

  return users.filter((user) => {
    if (user.userId === currentUser.userId) return false;
    return isWithinDistance(user.position, currentUser.position, maxDistance);
  });
}

/**
 * Filter users for video chat (typically smaller distance)
 */
export function getNearbyUsersForVideo(
  users: User[],
  currentUser: User | null | undefined,
  maxDistance: number = 150
): User[] {
  return getNearbyUsers(users, currentUser, maxDistance);
}
