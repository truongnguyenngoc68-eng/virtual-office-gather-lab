import { isWalkable } from "./map.js";

const SOLID_FURNITURE = new Set([2, 4, 5, 6, 7, 8, 12, 13, 14, 15]);
const placedFurniture = new Map();
let nextId = 1;

export function isTileBlockedByFurniture(x, y) {
  for (const [, f] of placedFurniture)
    if (f.x === x && f.y === y && SOLID_FURNITURE.has(f.type)) return true;
  return false;
}

export function getFurnitureState() {
  return Object.fromEntries(placedFurniture);
}

export function placeFurniture({ type, x, y, placedBy }, map, players) {
  if (!isWalkable(map[y]?.[x])) return null;
  if (isTileBlockedByFurniture(x, y)) return null;
  for (const [, p] of players)
    if (p.x === x && p.y === y) return null;

  const id = `f_${nextId++}`;
  const item = { id, type, x, y, placedBy };
  placedFurniture.set(id, item);
  return item;
}

export function removeFurniture(furnitureId) {
  const item = placedFurniture.get(furnitureId);
  if (!item) return null;
  placedFurniture.delete(furnitureId);
  return item;
}