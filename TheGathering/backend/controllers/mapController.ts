import { Request, Response } from "express";
import Map from "../models/Map.js";

// Create default map
const createDefaultMap = async (roomId: string) => {
  const width = 50;
  const height = 50;
  const tiles: number[][] = [];
  const collision: boolean[][] = [];

  // Initialize with floor tiles (0) and no collision
  for (let y = 0; y < height; y++) {
    tiles[y] = [];
    collision[y] = [];
    for (let x = 0; x < width; x++) {
      tiles[y][x] = 0; // Floor tile
      collision[y][x] = false; // Passable
    }
  }

  // Add some walls around edges
  for (let x = 0; x < width; x++) {
    collision[0][x] = true; // Top wall
    collision[height - 1][x] = true; // Bottom wall
  }
  for (let y = 0; y < height; y++) {
    collision[y][0] = true; // Left wall
    collision[y][width - 1] = true; // Right wall
  }

  // Add some interior walls
  for (let x = 10; x < 20; x++) {
    collision[10][x] = true;
    tiles[10][x] = 1; // Wall tile
  }
  for (let y = 10; y < 20; y++) {
    collision[y][20] = true;
    tiles[y][20] = 1; // Wall tile
  }

  const mapId = `map-${roomId}-${Date.now()}`;
  const map = new Map({
    mapId,
    roomId,
    name: "Default Map",
    width,
    height,
    tileSize: 32,
    tiles,
    collision,
  });

  await map.save();
  return map;
};

// Get map by roomId
export const getMapByRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomId } = req.params;
    let map = await Map.findOne({ roomId });

    // If no map exists, create default map
    if (!map) {
      map = await createDefaultMap(roomId);
    }

    res.json(map);
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

// Update map
export const updateMap = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomId } = req.params;
    const updates = req.body;

    let map = await Map.findOne({ roomId });
    if (!map) {
      map = await createDefaultMap(roomId);
    }

    // Update map data
    if (updates.tiles) map.tiles = updates.tiles;
    if (updates.collision) map.collision = updates.collision;
    if (updates.width) map.width = updates.width;
    if (updates.height) map.height = updates.height;
    if (updates.name) map.name = updates.name;
    if (updates.zones) map.zones = updates.zones;
    if (updates.backgroundImage !== undefined) map.backgroundImage = updates.backgroundImage;

    map.updatedAt = new Date();
    await map.save();

    res.json(map);
  } catch (error) {
    const err = error as Error;
    res.status(400).json({ message: err.message });
  }
};

// Create new map
export const createMap = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomId, name, width, height, tiles, collision } = req.body;

    // Check if map already exists
    const existing = await Map.findOne({ roomId });
    if (existing) {
      res.status(400).json({ message: "Map already exists for this room" });
      return;
    }

    const mapId = `map-${roomId}-${Date.now()}`;
    const map = new Map({
      mapId,
      roomId,
      name: name || "New Map",
      width: width || 50,
      height: height || 50,
      tileSize: 32,
      tiles: tiles || [],
      collision: collision || [],
      backgroundImage: req.body.backgroundImage || null,
    });

    await map.save();
    res.status(201).json(map);
  } catch (error) {
    const err = error as Error;
    res.status(400).json({ message: err.message });
  }
};

