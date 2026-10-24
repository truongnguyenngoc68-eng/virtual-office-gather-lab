import { Request, Response } from "express";
import User from "../models/User.js";
import { logger } from "../utils/logger.js";

interface SearchResult {
  type: "user";
  id: string;
  title: string;
  content?: string;
  author?: string;
  createdAt: Date;
  relevance?: number;
}

/**
 * Global search across all content types
 */
export const globalSearch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, types, limit = 20, page = 1 } = req.query;
    const searchQuery = q as string;

    if (!searchQuery || searchQuery.trim().length < 2) {
      res.status(400).json({ message: "Search query must be at least 2 characters" });
      return;
    }

    const searchTypes = types
      ? (types as string).split(",")
      : ["user"];

    const skip = (Number(page) - 1) * Number(limit);
    const results: SearchResult[] = [];

    // Search Users
    if (searchTypes.includes("user")) {
      const users = await User.find({
        $or: [
          { username: { $regex: searchQuery, $options: "i" } },
          { email: { $regex: searchQuery, $options: "i" } },
        ],
      })
        .select("_id username email avatar")
        .limit(Number(limit))
        .lean();

      users.forEach((user: any) => {
        results.push({
          type: "user",
          id: user._id.toString(),
          title: user.username,
          content: user.email,
          createdAt: user.createdAt || new Date(),
        });
      });
    }

    // Sort by relevance (if available) or date
    results.sort((a, b) => {
      if (a.relevance && b.relevance) {
        return b.relevance - a.relevance;
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    // Apply pagination
    const paginatedResults = results.slice(skip, skip + Number(limit));
    const total = results.length;

    res.json({
      results: paginatedResults,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
      query: searchQuery,
    });
  } catch (error) {
    logger.error("Failed to perform global search", error as Error);
    res.status(500).json({ message: "Failed to perform search" });
  }
};

/**
 * Quick search (returns top 5 results for each type)
 */
export const quickSearch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q } = req.query;
    const searchQuery = q as string;

    if (!searchQuery || searchQuery.trim().length < 2) {
      res.json({ results: [] });
      return;
    }

    const results: SearchResult[] = [];

    // Quick search users
    const users = await User.find({
      username: { $regex: searchQuery, $options: "i" },
    })
      .select("_id username")
      .limit(5)
      .lean();

    users.forEach((user: any) => {
      results.push({
        type: "user",
        id: user._id.toString(),
        title: user.username,
        createdAt: user.createdAt || new Date(),
      });
    });

    res.json({ results });
  } catch (error) {
    logger.error("Failed to perform quick search", error as Error);
    res.status(500).json({ message: "Failed to perform search" });
  }
};
