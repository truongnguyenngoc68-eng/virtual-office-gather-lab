import { Request, Response } from "express";
import User from "../models/User.js";

// Get user profile (current user)
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("Hits getUserProfile");
    const userId = (req as any).userId as string | undefined;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    console.log("UserID:", userId);

    const user = await User.findById(userId).select("-password");

    if (!user) {
      console.log("User not found in DB");
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Safely construct response
    const userData = {
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      status: user.status,
      role: (user as any).role || "member",
      // Use logical OR for safety
      displayName: (user as any).displayName || user.username,
      avatarConfig: (user as any).avatarConfig || {},
      profileColor: user.avatarColor || '#87CEEB',
    };

    console.log("Sending user data:", userData);
    res.json(userData);

  } catch (error) {
    console.error("Get User Profile Error CATCH:", error);
    res.status(500).json({ message: "Internal Server Error", error: String(error) });
  }
};

// Get user by ID (public profile)
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select("-password -googleId");

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json(user);
  } catch {
    res.status(500).json({ message: "Failed to fetch user" });
  }
};

// Update user profile
export const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId as string | undefined;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const { username, avatar, status } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (username) user.username = username;
    if (avatar) user.avatar = avatar;
    if (status) user.status = status;

    await user.save();

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      status: user.status,
    });
  } catch (error) {
    const err = error as Error;
    res.status(400).json({ message: err.message });
  }
};

// Update user avatar
export const updateUserAvatar = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId as string | undefined;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { displayName, avatarConfig } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (displayName) user.displayName = displayName;
    if (avatarConfig) user.avatarConfig = avatarConfig;

    await user.save();

    res.json({
      id: user._id,
      username: user.username,
      displayName: user.displayName,
      avatarConfig: user.avatarConfig,
      avatar: user.avatar,
      message: "Avatar updated successfully"
    });
  } catch (error) {
    const err = error as Error;
    res.status(400).json({ message: err.message });
  }
};

