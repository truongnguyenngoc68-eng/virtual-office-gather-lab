/**
 * Distance calculation utilities
 */

export interface Point {
  x: number;
  y: number;
}

/**
 * Calculate Euclidean distance between two points
 */
export function calculateDistance(point1: Point, point2: Point): number {
  return Math.sqrt(
    Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
  );
}

/**
 * Check if two points are within a certain distance
 */
export function isWithinDistance(
  point1: Point,
  point2: Point,
  maxDistance: number
): boolean {
  return calculateDistance(point1, point2) < maxDistance;
}

/**
 * Calculate distance in "meters" (arbitrary scale, pixels / 10)
 */
export function calculateDistanceInMeters(point1: Point, point2: Point): number {
  return Math.round(calculateDistance(point1, point2) / 10);
}
