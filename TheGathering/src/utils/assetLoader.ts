/**
 * Asset Loader Utility
 * Handles loading and managing game assets
 */

export interface AssetConfig {
  name: string;
  type: "image" | "spritesheet" | "tileset";
  url: string;
  frameWidth?: number;
  frameHeight?: number;
  tileWidth?: number;
  tileHeight?: number;
}

// Predefined asset configurations
export const ASSETS: AssetConfig[] = [
  // Tilesets
  {
    name: "tileset_floor",
    type: "tileset",
    url: "/assets/tiles/floor.png",
    tileWidth: 32,
    tileHeight: 32,
  },
  {
    name: "tileset_wall",
    type: "tileset",
    url: "/assets/tiles/wall.png",
    tileWidth: 32,
    tileHeight: 32,
  },
  {
    name: "tileset_grass",
    type: "tileset",
    url: "/assets/tiles/grass.png",
    tileWidth: 32,
    tileHeight: 32,
  },
  // Avatar spritesheet
  {
    name: "avatar_spritesheet",
    type: "spritesheet",
    url: "/assets/characters/avatar.png",
    frameWidth: 32,
    frameHeight: 32,
  },
  // Decorative objects
  {
    name: "furniture_chair",
    type: "image",
    url: "/assets/furniture/chair.png",
  },
  {
    name: "furniture_table",
    type: "image",
    url: "/assets/furniture/table.png",
  },
  {
    name: "furniture_plant",
    type: "image",
    url: "/assets/furniture/plant.png",
  },
];

/**
 * Generate programmatic tileset as fallback
 */
export const generateFallbackTileset = (scene: any) => {
  // Floor tile - light gray checkered
  const floorGraphics = scene.add.graphics();
  floorGraphics.fillStyle(0x4a5568);
  floorGraphics.fillRect(0, 0, 32, 32);
  floorGraphics.fillStyle(0x2d3748);
  floorGraphics.fillRect(16, 0, 16, 16);
  floorGraphics.fillRect(0, 16, 16, 16);
  floorGraphics.generateTexture("tile_floor", 32, 32);
  floorGraphics.destroy();

  // Wall tile - brown brick
  const wallGraphics = scene.add.graphics();
  wallGraphics.fillStyle(0x8b4513);
  wallGraphics.fillRect(0, 0, 32, 32);
  wallGraphics.lineStyle(1, 0x654321);
  wallGraphics.strokeRect(0, 0, 32, 32);
  wallGraphics.lineStyle(1, 0x654321);
  wallGraphics.moveTo(16, 0);
  wallGraphics.lineTo(16, 32);
  wallGraphics.moveTo(0, 16);
  wallGraphics.lineTo(32, 16);
  wallGraphics.strokePath();
  wallGraphics.generateTexture("tile_wall", 32, 32);
  wallGraphics.destroy();

  // Grass tile - green
  const grassGraphics = scene.add.graphics();
  grassGraphics.fillStyle(0x4ade80);
  grassGraphics.fillRect(0, 0, 32, 32);
  grassGraphics.fillStyle(0x22c55e);
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if ((i + j) % 2 === 0) {
        grassGraphics.fillRect(i * 8, j * 8, 8, 8);
      }
    }
  }
  grassGraphics.generateTexture("tile_grass", 32, 32);
  grassGraphics.destroy();
};

/**
 * Generate programmatic avatar spritesheet
 */
export const generateFallbackAvatar = (scene: any) => {
  // Create a simple colored circle avatar
  const avatarGraphics = scene.add.graphics();
  
  // 4 frames: down, left, right, up
  for (let frame = 0; frame < 4; frame++) {
    avatarGraphics.clear();
    
    // Base circle
    avatarGraphics.fillStyle(0x4f46e5); // Default purple
    avatarGraphics.fillCircle(16, 16, 14);
    
    // Face direction indicator
    avatarGraphics.fillStyle(0xffffff);
    if (frame === 0) {
      // Down - eyes at bottom
      avatarGraphics.fillCircle(10, 20, 2);
      avatarGraphics.fillCircle(22, 20, 2);
    } else if (frame === 1) {
      // Left - eyes on left
      avatarGraphics.fillCircle(8, 16, 2);
      avatarGraphics.fillCircle(8, 20, 2);
    } else if (frame === 2) {
      // Right - eyes on right
      avatarGraphics.fillCircle(24, 16, 2);
      avatarGraphics.fillCircle(24, 20, 2);
    } else {
      // Up - eyes at top
      avatarGraphics.fillCircle(10, 12, 2);
      avatarGraphics.fillCircle(22, 12, 2);
    }
    
    avatarGraphics.generateTexture(`avatar_frame_${frame}`, 32, 32);
  }
  
  avatarGraphics.destroy();
};

/**
 * Load assets with fallback
 */
export const loadAssets = async (scene: any) => {
  // Generate fallback assets first
  generateFallbackTileset(scene);
  generateFallbackAvatar(scene);

  // Try to load actual assets
  for (const asset of ASSETS) {
    try {
      if (asset.type === "spritesheet" && asset.frameWidth && asset.frameHeight) {
        scene.load.spritesheet(asset.name, asset.url, {
          frameWidth: asset.frameWidth,
          frameHeight: asset.frameHeight,
        });
      } else if (asset.type === "tileset") {
        scene.load.image(asset.name, asset.url);
      } else {
        scene.load.image(asset.name, asset.url);
      }
    } catch (error) {
      console.warn(`Failed to load asset ${asset.name}, using fallback`);
    }
  }
};

