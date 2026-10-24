import { Request, Response } from "express";
import EventTemplate from "../models/EventTemplate.js";
import { logger } from "../utils/logger.js";

/**
 * Get all event templates
 */
export const getTemplates = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { category, publicOnly } = req.query;

    const query: any = {};
    if (publicOnly === "true") {
      query.isPublic = true;
    } else if (userId) {
      // Show user's templates and public templates
      query.$or = [{ createdBy: userId }, { isPublic: true }];
    } else {
      query.isPublic = true;
    }

    if (category) {
      query.category = category;
    }

    const templates = await EventTemplate.find(query)
      .sort({ usageCount: -1, createdAt: -1 })
      .lean();

    res.json(templates);
  } catch (error) {
    logger.error("Failed to fetch templates", error as Error);
    res.status(500).json({ message: "Failed to fetch templates" });
  }
};

/**
 * Get single template
 */
export const getTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { templateId } = req.params;
    const template = await EventTemplate.findById(templateId).lean();

    if (!template) {
      res.status(404).json({ message: "Template not found" });
      return;
    }

    res.json(template);
  } catch (error) {
    logger.error("Failed to fetch template", error as Error);
    res.status(500).json({ message: "Failed to fetch template" });
  }
};

/**
 * Create template
 */
export const createTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const {
      name,
      description,
      duration,
      defaultLocation,
      defaultMaxParticipants,
      defaultReminders,
      category,
      isPublic,
    } = req.body;

    if (!name) {
      res.status(400).json({ message: "Template name is required" });
      return;
    }

    const template = await EventTemplate.create({
      name,
      description,
      duration: duration || 60,
      defaultLocation,
      defaultMaxParticipants,
      defaultReminders: defaultReminders || [15, 60],
      category,
      createdBy: userId,
      isPublic: isPublic || false,
      usageCount: 0,
    });

    res.status(201).json(template);
  } catch (error) {
    logger.error("Failed to create template", error as Error);
    res.status(500).json({ message: "Failed to create template" });
  }
};

/**
 * Update template
 */
export const updateTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { templateId } = req.params;

    const template = await EventTemplate.findById(templateId);
    if (!template) {
      res.status(404).json({ message: "Template not found" });
      return;
    }

    // Check if user is creator
    if (template.createdBy !== userId) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const updates = req.body;
    Object.assign(template, updates);
    await template.save();

    res.json(template);
  } catch (error) {
    logger.error("Failed to update template", error as Error);
    res.status(500).json({ message: "Failed to update template" });
  }
};

/**
 * Delete template
 */
export const deleteTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { templateId } = req.params;

    const template = await EventTemplate.findById(templateId);
    if (!template) {
      res.status(404).json({ message: "Template not found" });
      return;
    }

    // Check if user is creator
    if (template.createdBy !== userId) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    await EventTemplate.findByIdAndDelete(templateId);

    res.json({ message: "Template deleted" });
  } catch (error) {
    logger.error("Failed to delete template", error as Error);
    res.status(500).json({ message: "Failed to delete template" });
  }
};
