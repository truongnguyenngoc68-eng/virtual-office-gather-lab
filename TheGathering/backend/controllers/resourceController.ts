import { Request, Response } from "express";
import Resource from "../models/Resource.js";

export const listResources = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, type, approved = "true", limit = "50", page = "1" } = req.query;
    const take = Math.min(200, Math.max(1, Number(limit) || 50));
    const skip = (Math.max(1, Number(page) || 1) - 1) * take;

    const query: any = {};
    if (String(approved) === "true") query.isApproved = true;
    if (type && type !== "all") query.content_type = String(type);
    if (q && String(q).trim().length > 1) query.$text = { $search: String(q).trim() };

    const [items, total] = await Promise.all([
      Resource.find(query)
        .sort(q ? { score: { $meta: "textScore" }, createdAt: -1 } : { createdAt: -1 })
        .skip(skip)
        .limit(take)
        .lean(),
      Resource.countDocuments(query),
    ]);

    res.json({
      resources: items,
      pagination: { page: Number(page) || 1, limit: take, total },
    });
  } catch {
    res.status(500).json({ message: "Failed to list resources" });
  }
};

export const createResource = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId as string | undefined;
    const { title, author, content_type, url, thumbnail_url, description } = req.body || {};
    if (!String(title || "").trim()) {
      res.status(400).json({ message: "title is required" });
      return;
    }

    const resource = await Resource.create({
      title: String(title).trim(),
      author: author ? String(author).trim() : undefined,
      content_type: content_type || "other",
      url: url ? String(url).trim() : undefined,
      thumbnail_url: thumbnail_url ? String(thumbnail_url).trim() : undefined,
      description: description ? String(description).trim() : "",
      createdBy: userId || null,
      isApproved: false, // moderation by admin
    });

    res.status(201).json({ resource });
  } catch {
    res.status(400).json({ message: "Failed to create resource" });
  }
};

