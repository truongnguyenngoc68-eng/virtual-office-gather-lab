import mongoose, { Document, Schema } from "mongoose";

export interface IZone {
  id: string;
  name: string;
  bounds: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
  maxUsers: number;
}

export interface IMap extends Document {
  mapId: string;
  roomId: string;
  name: string;
  width: number;
  height: number;
  tileSize: number;
  backgroundImage?: string | null;
  tiles: number[][];
  collision: boolean[][];
  zones: IZone[];
  createdBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const mapSchema = new Schema<IMap>(
  {
    mapId: {
      type: String,
      required: true,
      unique: true,
    },
    roomId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      default: "Default Map",
    },
    width: {
      type: Number,
      default: 50, // tiles
    },
    height: {
      type: Number,
      default: 50, // tiles
    },
    tileSize: {
      type: Number,
      default: 32, // pixels
    },
    backgroundImage: {
      type: String,
      default: null,
    },
    // 2D array: [row][col] = tileId
    // tileId: 0 = empty/floor, 1 = wall, 2+ = custom tiles
    tiles: {
      type: [[Number]],
      default: [],
    },
    // Collision map: true = impassable
    collision: {
      type: [[Boolean]],
      default: [],
    },
    // Zones for private spaces (future)
    zones: [
      {
        id: String,
        name: String,
        bounds: {
          x1: Number,
          y1: Number,
          x2: Number,
          y2: Number,
        },
        maxUsers: Number,
      },
    ],
    createdBy: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
mapSchema.index({ roomId: 1 });

export default mongoose.model<IMap>("Map", mapSchema);

