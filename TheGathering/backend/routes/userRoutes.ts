import express from "express";
import {
  getUserProfile,
  getUserById,
  updateUserProfile,
  updateUserAvatar,
} from "../controllers/userController.js";
import { authenticate } from "../middleware/security.js";

const router = express.Router();

// Get user profile (current user)
router.get("/profile", authenticate, getUserProfile);

// Aliases for frontend compatibility (Must be before /:userId)
router.get("/me", authenticate, getUserProfile);
router.get("/settings", (req, res) => res.json({})); // Placeholder for settings

// Update user profile
router.put("/profile", authenticate, updateUserProfile);

// Update user avatar
router.post("/avatar", authenticate, updateUserAvatar);

// Get user by ID (public profile) - Must be last
router.get("/:userId", getUserById);


export default router;

