/**
 * Pre-built Map Templates
 * Users can select and apply these templates to their rooms
 */

export interface MapTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  backgroundImage?: string;
  width: number;
  height: number;
  tileSize: number;
  tiles: number[][];
  collision: boolean[][];
  zones?: Array<{
    id: string;
    name: string;
    bounds: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    };
    maxUsers?: number;
  }>;
}

/**
 * Generate empty map with borders
 */
const generateEmptyMap = (
  width: number,
  height: number
): { tiles: number[][]; collision: boolean[][] } => {
  const tiles: number[][] = [];
  const collision: boolean[][] = [];

  for (let y = 0; y < height; y++) {
    tiles[y] = [];
    collision[y] = [];
    for (let x = 0; x < width; x++) {
      tiles[y][x] = 0; // Floor
      collision[y][x] = false;
    }
  }

  // Add border walls
  for (let x = 0; x < width; x++) {
    collision[0][x] = true; // Top
    collision[height - 1][x] = true; // Bottom
    tiles[0][x] = 1;
    tiles[height - 1][x] = 1;
  }
  for (let y = 0; y < height; y++) {
    collision[y][0] = true; // Left
    collision[y][width - 1] = true; // Right
    tiles[y][0] = 1;
    tiles[y][width - 1] = 1;
  }

  return { tiles, collision };
};

/**
 * Office Layout Template
 */
export const officeTemplate: MapTemplate = {
  id: "office",
  name: "Office Layout",
  description: "Open office with meeting rooms and private spaces",
  width: 50,
  height: 50,
  tileSize: 32,
  ...(() => {
    const { tiles, collision } = generateEmptyMap(50, 50);

    // Add some interior walls
    // Meeting room 1 (top-left)
    for (let x = 5; x < 15; x++) {
      for (let y = 5; y < 12; y++) {
        if (x === 5 || x === 14 || y === 5 || y === 11) {
          tiles[y][x] = 1;
          collision[y][x] = true;
        }
      }
    }

    // Meeting room 2 (top-right)
    for (let x = 35; x < 45; x++) {
      for (let y = 5; y < 12; y++) {
        if (x === 35 || x === 44 || y === 5 || y === 11) {
          tiles[y][x] = 1;
          collision[y][x] = true;
        }
      }
    }

    // Private office (bottom-left)
    for (let x = 5; x < 20; x++) {
      for (let y = 35; y < 45; y++) {
        if (x === 5 || x === 19 || y === 35 || y === 44) {
          tiles[y][x] = 1;
          collision[y][x] = true;
        }
      }
    }

    // Central divider
    for (let x = 20; x < 30; x++) {
      tiles[20][x] = 1;
      collision[20][x] = true;
    }

    return { tiles, collision };
  })(),
  zones: [
    {
      id: "zone-meeting-1",
      name: "Meeting Room 1",
      bounds: { x1: 160, y1: 160, x2: 448, y2: 352 }, // 5-14 tiles, 5-11 tiles
      maxUsers: 8,
    },
    {
      id: "zone-meeting-2",
      name: "Meeting Room 2",
      bounds: { x1: 1120, y1: 160, x2: 1408, y2: 352 }, // 35-44 tiles, 5-11 tiles
      maxUsers: 8,
    },
    {
      id: "zone-private",
      name: "Private Office",
      bounds: { x1: 160, y1: 1120, x2: 608, y2: 1408 }, // 5-19 tiles, 35-44 tiles
      maxUsers: 4,
    },
  ],
};

/**
 * Open Space Template
 */
export const openSpaceTemplate: MapTemplate = {
  id: "open-space",
  name: "Open Space",
  description: "Large open area perfect for events and gatherings",
  width: 60,
  height: 60,
  tileSize: 32,
  ...(() => {
    const { tiles, collision } = generateEmptyMap(60, 60);

    // Add some decorative pillars
    const pillars = [
      [15, 15],
      [45, 15],
      [15, 45],
      [45, 45],
    ];

    pillars.forEach(([x, y]) => {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (x + dx >= 0 && x + dx < 60 && y + dy >= 0 && y + dy < 60) {
            tiles[y + dy][x + dx] = 1;
            collision[y + dy][x + dx] = true;
          }
        }
      }
    });

    return { tiles, collision };
  })(),
  zones: [],
};

/**
 * Conference Center Template
 */
export const conferenceTemplate: MapTemplate = {
  id: "conference",
  name: "Conference Center",
  description: "Multiple meeting rooms with a central lobby",
  width: 55,
  height: 55,
  tileSize: 32,
  ...(() => {
    const { tiles, collision } = generateEmptyMap(55, 55);

    // Central lobby (open area)
    // Meeting rooms around the lobby

    // Top meeting rooms
    for (let i = 0; i < 3; i++) {
      const startX = 5 + i * 15;
      for (let x = startX; x < startX + 12; x++) {
        for (let y = 5; y < 15; y++) {
          if (x === startX || x === startX + 11 || y === 5 || y === 14) {
            tiles[y][x] = 1;
            collision[y][x] = true;
          }
        }
      }
    }

    // Bottom meeting rooms
    for (let i = 0; i < 3; i++) {
      const startX = 5 + i * 15;
      for (let x = startX; x < startX + 12; x++) {
        for (let y = 40; y < 50; y++) {
          if (x === startX || x === startX + 11 || y === 40 || y === 49) {
            tiles[y][x] = 1;
            collision[y][x] = true;
          }
        }
      }
    }

    // Side meeting rooms
    for (let i = 0; i < 2; i++) {
      const startY = 20 + i * 12;
      for (let x = 5; x < 15; x++) {
        for (let y = startY; y < startY + 10; y++) {
          if (x === 5 || x === 14 || y === startY || y === startY + 9) {
            tiles[y][x] = 1;
            collision[y][x] = true;
          }
        }
      }
      for (let x = 40; x < 50; x++) {
        for (let y = startY; y < startY + 10; y++) {
          if (x === 40 || x === 49 || y === startY || y === startY + 9) {
            tiles[y][x] = 1;
            collision[y][x] = true;
          }
        }
      }
    }

    return { tiles, collision };
  })(),
  zones: [
    {
      id: "zone-lobby",
      name: "Central Lobby",
      bounds: { x1: 480, y1: 480, x2: 1280, y2: 1280 }, // Approx center area
      maxUsers: 20,
    },
  ],
};

/**
 * Minimal Template
 */
export const minimalTemplate: MapTemplate = {
  id: "minimal",
  name: "Minimal",
  description: "Simple empty space with just borders",
  width: 40,
  height: 40,
  tileSize: 32,
  ...generateEmptyMap(40, 40),
  zones: [],
};

/**
 * All available templates
 */
export const mapTemplates: MapTemplate[] = [
  minimalTemplate,
  openSpaceTemplate,
  officeTemplate,
  conferenceTemplate,
  {
    id: "large-map",
    name: "Large Custom Map",
    description: "A large map with a custom background image",
    width: 64,
    height: 36,
    tileSize: 32,
    backgroundImage: "/assets/backgrounds/large_map.png",
    ...generateEmptyMap(64, 36),
    zones: [],
  },
];

/**
 * Get template by ID
 */
export const getTemplateById = (id: string): MapTemplate | undefined => {
  return mapTemplates.find((t) => t.id === id);
};

