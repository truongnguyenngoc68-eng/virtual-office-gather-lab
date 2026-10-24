/**
 * World/Map routes
 * Combines object and map management
 */
import express from "express";
import {
  getObjectsByRoom,
  getObjectById,
  createObject,
  updateObject,
  updateWhiteboardContent,
  deleteObject,
} from "../controllers/objectController.js";
import {
  getMapByRoom,
  updateMap,
  createMap,
} from "../controllers/mapController.js";

const router = express.Router();

// ============================================
// Map Routes
// ============================================

// Get map by roomId
router.get("/room/:roomId", getMapByRoom);

// Update map
router.put("/room/:roomId", updateMap);

// Create new map
router.post("/", createMap);

// ============================================
// Object Routes
// ============================================

// Get all objects in a room
router.get("/objects/room/:roomId", getObjectsByRoom);

// Get single object
router.get("/objects/:objectId", getObjectById);

// Create new object
router.post("/objects", createObject);

// Update object
router.put("/objects/:objectId", updateObject);

// Update whiteboard content
router.put("/objects/:objectId/whiteboard", updateWhiteboardContent);

// Delete object
router.delete("/objects/:objectId", deleteObject);

// Legacy routes for backward compatibility
router.get("/room/:roomId/objects", getObjectsByRoom);

export default router;
