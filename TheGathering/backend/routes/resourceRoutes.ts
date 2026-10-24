import express from "express";
import { authenticate } from "../middleware/security.js";
import { listResources, createResource } from "../controllers/resourceController.js";

const router = express.Router();

// Public approved list
router.get("/", listResources);

// Create (requires auth; not auto-approved)
router.post("/", authenticate, createResource);

export default router;

