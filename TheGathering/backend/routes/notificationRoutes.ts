import express from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controllers/notificationController.js";
import { authenticate } from "../middleware/security.js";

const router = express.Router();

// All routes require authentication
router.get("/", authenticate, getNotifications);
router.post("/:notificationId/read", authenticate, markAsRead);
router.post("/read-all", authenticate, markAllAsRead);
router.delete("/:notificationId", authenticate, deleteNotification);

export default router;
