/**
 * Utility functions for zone management and detection
 */

export interface Zone {
  id: string;
  name: string;
  bounds: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
  maxUsers?: number;
}

/**
 * Check if a point is inside a zone
 */
export const isPointInZone = (
  x: number,
  y: number,
  zone: Zone
): boolean => {
  const { x1, y1, x2, y2 } = zone.bounds;
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);

  return x >= minX && x <= maxX && y >= minY && y <= maxY;
};

/**
 * Get zone ID for a position
 */
export const getZoneForPosition = (
  x: number,
  y: number,
  zones: Zone[]
): string | null => {
  for (const zone of zones) {
    if (isPointInZone(x, y, zone)) {
      return zone.id;
    }
  }
  return null; // Outside all zones (public area)
};

/**
 * Check if two users are in the same zone
 */
export const areUsersInSameZone = (
  user1Pos: { x: number; y: number },
  user2Pos: { x: number; y: number },
  zones: Zone[]
): boolean => {
  const zone1 = getZoneForPosition(user1Pos.x, user1Pos.y, zones);
  const zone2 = getZoneForPosition(user2Pos.x, user2Pos.y, zones);

  // Both in same zone (including both null = public area)
  if (zone1 === zone2) {
    return true;
  }

  // One in zone, one outside = different zones
  return false;
};

/**
 * Get zone bounds for rendering
 */
export const getZoneBounds = (zone: Zone) => {
  const { x1, y1, x2, y2 } = zone.bounds;
  return {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
  };
};

