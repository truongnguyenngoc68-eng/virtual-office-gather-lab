/**
 * Security middleware
 * Combines authentication and validation
 */
import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/tokenManager.js";
import { sanitizeString, sanitizeObject, isValidEmail, isValidUsername } from "../utils/validators.js";

// ============================================
// Authentication
// ============================================

/**
 * Authentication middleware
 * Verifies JWT access token and attaches user info to request
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized: No token provided" });
    return;
  }

  const token = authHeader.substring(7);
  const decoded = verifyAccessToken(token);

  if (!decoded) {
    res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
    return;
  }

  // Attach user ID to request for use in route handlers
  (req as any).userId = decoded.userId;
  next();
}

/**
 * Optional authentication middleware
 * Doesn't fail if no token, but attaches user info if token is valid
 */
export function optionalAuthenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    if (decoded) {
      (req as any).userId = decoded.userId;
    }
  }

  next();
}

// ============================================
// Input Validation & Sanitization
// ============================================

/**
 * Middleware to sanitize request body
 */
export function sanitizeBody(req: Request, res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }
  next();
}

/**
 * Middleware to sanitize query parameters
 */
export function sanitizeQuery(req: Request, res: Response, next: NextFunction): void {
  if (req.query && typeof req.query === "object") {
    for (const key in req.query) {
      if (typeof req.query[key] === "string") {
        req.query[key] = sanitizeString(req.query[key] as string);
      }
    }
  }
  next();
}

/**
 * Validate register request
 */
export function validateRegister(req: Request, res: Response, next: NextFunction): void {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    res.status(400).json({ message: "Username, email, and password are required" });
    return;
  }

  if (!isValidUsername(username)) {
    res.status(400).json({
      message: "Username must be 3-20 characters, alphanumeric with underscores only",
    });
    return;
  }

  if (!isValidEmail(email)) {
    res.status(400).json({ message: "Invalid email format" });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ message: "Password must be at least 8 characters long" });
    return;
  }

  next();
}

/**
 * Validate login request
 */
export function validateLogin(req: Request, res: Response, next: NextFunction): void {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required" });
    return;
  }

  if (!isValidEmail(email)) {
    res.status(400).json({ message: "Invalid email format" });
    return;
  }

  next();
}
