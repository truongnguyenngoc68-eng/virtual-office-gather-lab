import jwt from "jsonwebtoken";
import crypto from "crypto";
import Session from "../models/Session.js";

const ACCESS_TOKEN_EXPIRY = "15m"; // 15 minutes

interface TokenPayload {
  userId: string;
  type: "access" | "refresh";
}

/**
 * Generate access token (short-lived)
 */
export function generateAccessToken(userId: string): string {
  return jwt.sign(
    { userId, type: "access" },
    process.env.JWT_SECRET || "dev-secret-key-12345",
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

/**
 * Generate refresh token (long-lived)
 */
export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString("hex");
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev-secret-key-12345") as TokenPayload;
    if (decoded.type !== "access") {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Create session with refresh token
 */
export async function createSession(
  userId: string,
  deviceInfo?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const refreshToken = generateRefreshToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await Session.create({
    userId,
    refreshToken,
    deviceInfo,
    ipAddress,
    userAgent,
    expiresAt,
  });

  const accessToken = generateAccessToken(userId);

  return { accessToken, refreshToken };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; newRefreshToken?: string } | null> {
  const session = await Session.findOne({ refreshToken });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  // Generate new access token
  const accessToken = generateAccessToken(session.userId);

  // Optionally rotate refresh token (security best practice)
  // For now, we'll keep the same refresh token
  // You can implement token rotation if needed

  return { accessToken };
}

/**
 * Delete session (logout)
 */
export async function deleteSession(refreshToken: string): Promise<boolean> {
  const result = await Session.deleteOne({ refreshToken });
  return result.deletedCount > 0;
}

/**
 * Delete all sessions for a user (logout from all devices)
 */
export async function deleteAllUserSessions(userId: string): Promise<number> {
  const result = await Session.deleteMany({ userId });
  return result.deletedCount;
}

/**
 * Get all active sessions for a user
 */
export async function getUserSessions(userId: string) {
  return Session.find({ userId, expiresAt: { $gt: new Date() } })
    .select("-refreshToken") // Don't return refresh tokens
    .sort({ createdAt: -1 })
    .lean();
}

/**
 * Delete a session by id (logout one device)
 */
export async function deleteUserSessionById(
  userId: string,
  sessionId: string
): Promise<boolean> {
  const result = await Session.deleteOne({ _id: sessionId, userId });
  return result.deletedCount > 0;
}
