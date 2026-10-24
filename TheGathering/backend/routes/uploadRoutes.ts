import express, { Request, Response } from "express";
import { upload, getFileUrl } from "../middleware/upload.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Upload file endpoint
router.post("/", upload.single("file"), (req: Request, res: Response): void => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
      return;
    }

    const fileUrl = getFileUrl(req.file.filename);

    res.json({
      success: true,
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: fileUrl,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload file",
    });
  }
});

// Serve uploaded files
router.get("/:filename", (req: Request, res: Response): void => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, "../uploads", filename);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({
        success: false,
        message: "File not found",
      });
      return;
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error("File serve error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to serve file",
    });
  }
});

// Delete file endpoint
router.delete("/:filename", (req: Request, res: Response): void => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, "../uploads", filename);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({
        success: false,
        message: "File not found",
      });
      return;
    }

    fs.unlinkSync(filePath);
    res.json({
      success: true,
      message: "File deleted",
    });
  } catch (error) {
    console.error("Delete file error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete file",
    });
  }
});

export default router;

