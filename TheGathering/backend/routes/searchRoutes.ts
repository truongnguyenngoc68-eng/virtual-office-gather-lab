import express from "express";
import { globalSearch, quickSearch } from "../controllers/searchController.js";
import { optionalAuthenticate } from "../middleware/security.js";

const router = express.Router();

// Public routes (optional auth for better results)
router.get("/", optionalAuthenticate, globalSearch);
router.get("/quick", optionalAuthenticate, quickSearch);

export default router;
