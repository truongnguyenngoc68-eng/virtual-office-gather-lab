import { Request, Response, NextFunction } from "express";
import User from "../models/User.js";

/**
 * Role-Based Access Control middleware
 */

type UserRole = "admin" | "moderator" | "member" | "guest";

/**
 * Check if user has required role
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as any).userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    try {
      const user = await User.findById(userId).select("role");
      
      if (!user) {
        res.status(401).json({ message: "User not found" });
        return;
      }

      const userRole = (user.role || "member") as UserRole;

      // Role hierarchy: admin > moderator > member > guest
      const roleHierarchy: Record<UserRole, number> = {
        admin: 4,
        moderator: 3,
        member: 2,
        guest: 1,
      };

      // Check if user has at least one of the required roles
      const hasAccess = allowedRoles.some(
        (role) => roleHierarchy[userRole] >= roleHierarchy[role]
      );

      if (!hasAccess) {
        res.status(403).json({ 
          message: "Forbidden: Insufficient permissions",
          required: allowedRoles,
          current: userRole
        });
        return;
      }

      // Attach user role to request
      (req as any).userRole = userRole;
      next();
    } catch (error) {
      console.error("RBAC error:", error);
      res.status(500).json({ message: "Server error" });
    }
  };
}

/**
 * Require admin role
 */
export const requireAdmin = requireRole("admin");

/**
 * Require moderator or admin
 */
export const requireModerator = requireRole("moderator", "admin");

/**
 * Require member or higher
 */
export const requireMember = requireRole("member", "moderator", "admin");
