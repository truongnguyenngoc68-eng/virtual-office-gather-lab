/**
 * Logging middleware
 * Combines request logging and error handling
 */
import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";

// ============================================
// Request Logging
// ============================================

/**
 * Request logging middleware
 * Logs all incoming requests with method, path, status code, and duration
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const userId = (req as any).userId; // From auth middleware if present
  const fullPath = req.originalUrl || req.url || req.path;

  // Log request start
  logger.debug(`Request started: ${req.method} ${fullPath}`, {
    ip: req.ip,
    userAgent: req.get("user-agent"),
    userId,
  });

  // Override res.end to capture response
  const originalEnd = res.end;
  res.end = function (chunk?: any, encoding?: any) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Log request completion
    logger.logRequest(req.method, fullPath, statusCode, duration, userId);

    // Call original end
    originalEnd.call(this, chunk, encoding);
  };

  next();
}

// ============================================
// Error Handling
// ============================================

/**
 * Global error handler middleware
 * Should be the last middleware in the chain
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error
  logger.error("Unhandled error", err, {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userId: (req as any).userId,
  });

  // Send error response
  const statusCode = (err as any).statusCode || 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message;

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
}

/**
 * 404 handler
 */
export function notFoundHandler(req: Request, res: Response): void {
  logger.warn("Route not found", {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });

  res.status(404).json({
    message: "Route not found",
    path: req.path,
  });
}
