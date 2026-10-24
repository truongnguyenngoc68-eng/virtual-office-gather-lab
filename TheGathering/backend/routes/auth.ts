import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import OtpCode, { OtpPurpose } from "../models/OtpCode.js";
import {
  validatePassword,
  isCommonPassword,
  sanitizeString,
  isValidEmail,
  isValidUsername,
  usernameFromFullName,
} from "../utils/validators.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";
import {
  isAccountLocked,
  recordFailedAttempt,
  clearFailedAttempts,
  getLockoutTimeRemaining,
} from "../utils/accountLockout.js";
import {
  createSession,
  refreshAccessToken,
  deleteSession,
  deleteAllUserSessions,
  getUserSessions,
  deleteUserSessionById,
} from "../utils/tokenManager.js";
import { authenticate } from "../middleware/security.js";
import { sendOtpEmail } from "../utils/email.js";

const router = express.Router();

// Register (with optional OTP verification)
router.post(
  "/register",
  authRateLimiter,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const email = sanitizeString(req.body.email || "").toLowerCase();
      const password = req.body.password || "";
      const otp = sanitizeString(req.body.otp || "");
      const fullName = sanitizeString(req.body.fullName || "").trim();
      const rawUsername = sanitizeString(req.body.username || "");

      // Tạo username từ họ tên (Phát Bành -> phat_banh) hoặc từ email nếu không có fullName
      const username = rawUsername
        ? rawUsername
        : fullName
          ? usernameFromFullName(fullName, email)
          : (email || "").split("@")[0] || "";

      const finalUsername = username.slice(0, 20).replace(/^_+|_+$/g, "") || "user";

      // Validate input
      if (!email || !password) {
        res.status(400).json({ message: "Email và mật khẩu là bắt buộc." });
        return;
      }

      if (!isValidUsername(finalUsername)) {
        res.status(400).json({
          message: "Không thể tạo tên đăng nhập từ tên của bạn. Vui lòng thử tên khác hoặc thêm ký tự.",
        });
        return;
      }

      if (!isValidEmail(email)) {
        res.status(400).json({ message: "Định dạng email không hợp lệ." });
        return;
      }

      // Validate password strength
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        res.status(400).json({
          message: "Mật khẩu chưa đủ mạnh.",
          errors: passwordValidation.errors,
        });
        return;
      }

      // Check for common passwords
      if (isCommonPassword(password)) {
        res.status(400).json({
          message: "Mật khẩu quá phổ biến. Vui lòng chọn mật khẩu khác.",
        });
        return;
      }

      // Enforce OTP for new registrations if provided by frontend
      if (otp) {
        const latestOtp = await OtpCode.findOne({
          email,
          purpose: "register",
          used: false,
        })
          .sort({ createdAt: -1 })
          .lean();

        if (!latestOtp || latestOtp.code !== otp || latestOtp.expiresAt < new Date()) {
          res.status(400).json({ message: "Mã OTP không hợp lệ hoặc đã hết hạn" });
          return;
        }

        // Mark OTP as used (best-effort)
        await OtpCode.updateMany(
          { email, purpose: "register", used: false },
          { $set: { used: true } }
        );
      }

      // Check if user exists (username có thể trùng sau slugify, thêm suffix nếu cần)
      let uniqueUsername = finalUsername;
      let suffix = 0;
      while (await User.findOne({ username: uniqueUsername })) {
        suffix++;
        uniqueUsername = `${finalUsername.slice(0, 17)}${suffix}`.slice(0, 20);
      }

      const existingByEmail = await User.findOne({ email });
      if (existingByEmail) {
        res.status(400).json({ message: "Email này đã được đăng ký." });
        return;
      }

      // Hash password with higher salt rounds for better security
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user: username dùng cho hệ thống, displayName là tên hiển thị (Phát Bành)
      const user = new User({
        username: uniqueUsername,
        email,
        password: hashedPassword,
        displayName: fullName || undefined,
      });

      await user.save();

      // Create session with refresh token
      const deviceInfo = req.headers["user-agent"] || "Unknown";
      const ipAddress = req.ip || req.socket.remoteAddress || "Unknown";
      const { accessToken, refreshToken } = await createSession(
        user._id.toString(),
        deviceInfo,
        ipAddress,
        req.headers["user-agent"]
      );

      res.status(201).json({
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          username: user.username,
          displayName: user.displayName || user.username,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Google OAuth Login/Create
router.post("/google", async (req: Request, res: Response): Promise<void> => {
  try {
    const { googleId, email, username, avatar } = req.body;

    if (!googleId || !email) {
      res.status(400).json({ message: "Google ID and email are required" });
      return;
    }

    // Find or create user
    let user = await User.findOne({ googleId });

    if (!user) {
      // Check if email already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        // Link Google account to existing user
        existingUser.googleId = googleId;
        if (avatar) existingUser.avatar = avatar;
        await existingUser.save();
        user = existingUser;
      } else {
        // Create new user
        user = new User({
          username: username || email.split("@")[0],
          email,
          googleId,
          avatar: avatar || "default",
          password: "", // OAuth users don't need password
        });
        await user.save();
      }
    } else {
      // Update avatar if provided
      if (avatar) {
        user.avatar = avatar;
        await user.save();
      }
    }

    // Update last seen
    user.lastSeen = new Date();
    await user.save();

    // Create session with refresh token
    const deviceInfo = req.headers["user-agent"] || "Unknown";
    const ipAddress = req.ip || req.socket.remoteAddress || "Unknown";
    const { accessToken, refreshToken } = await createSession(
      user._id.toString(),
      deviceInfo,
      ipAddress,
      req.headers["user-agent"]
    );

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Google OAuth error:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// Check email availability
router.post("/check-email", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ message: "Email is required" });
      return;
    }
    const user = await User.findOne({ email });
    res.json({ exists: !!user });
  } catch (error) {
    console.error("Check email error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Helper to create OTP and store in DB
async function createOtp(email: string, purpose: OtpPurpose): Promise<string> {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await OtpCode.create({
    email,
    code,
    purpose,
    used: false,
    expiresAt,
  });

  console.log(`[OTP:${purpose}] for ${email}: ${code}`);
  return code;
}

// Send OTP for registration
router.post("/send-otp", authRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const email = sanitizeString(req.body.email || "").toLowerCase();

    if (!email || !isValidEmail(email)) {
      res.status(400).json({ message: "Valid email is required" });
      return;
    }

    // For registration, we don't care if user already exists on this step;
    // frontend will call /check-email first.
    const code = await createOtp(email, "register");
    const sent = await sendOtpEmail(email, code, "register");

    res.json({
      message: sent
        ? "Mã xác thực đã được gửi đến email của bạn."
        : "Mã xác thực đã lưu (chưa cấu hình gửi mail – xem console server trong dev).",
      expiresIn: 600,
    });
  } catch (error) {
    console.error("send-otp error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Forgot password - request reset OTP
router.post("/forgot-password", async (req: Request, res: Response): Promise<void> => {
  try {
    const email = sanitizeString(req.body.email || "").toLowerCase();
    if (!email || !isValidEmail(email)) {
      res.status(400).json({ message: "Valid email is required" });
      return;
    }

    const user = await User.findOne({ email }).select("_id");
    if (!user) {
      // Avoid email enumeration
      res.json({
        message:
          "If your email exists, you will receive a password reset code.",
      });
      return;
    }

    const code = await createOtp(email, "reset");
    const sent = await sendOtpEmail(email, code, "reset");

    res.json({
      message: sent
        ? "Nếu email tồn tại, mã đặt lại mật khẩu đã được gửi đến email."
        : "Nếu email tồn tại, mã đã lưu (chưa cấu hình gửi mail – xem console trong dev).",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Verify OTP (used primarily for forgot-password flow)
router.post("/verify-otp", async (req: Request, res: Response): Promise<void> => {
  try {
    const email = sanitizeString(req.body.email || "").toLowerCase();
    const otp = sanitizeString(req.body.otp || "");

    if (!email || !otp) {
      res.status(400).json({ message: "Email and OTP are required" });
      return;
    }

    const latestOtp = await OtpCode.findOne({
      email,
      purpose: "reset",
      used: false,
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!latestOtp || latestOtp.code !== otp || latestOtp.expiresAt < new Date()) {
      res.status(400).json({ message: "Mã OTP không hợp lệ hoặc đã hết hạn" });
      return;
    }

    // Do not mark used yet; we will mark in reset-password
    res.json({ message: "OTP verified" });
  } catch (error) {
    console.error("verify-otp error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Reset password with OTP
router.post("/reset-password", async (req: Request, res: Response): Promise<void> => {
  try {
    const email = sanitizeString(req.body.email || "").toLowerCase();
    const otp = sanitizeString(req.body.otp || "");
    const newPassword = req.body.newPassword || "";

    if (!email || !otp || !newPassword) {
      res.status(400).json({ message: "Email, OTP and newPassword are required" });
      return;
    }

    if (!isValidEmail(email)) {
      res.status(400).json({ message: "Invalid email format" });
      return;
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      res.status(400).json({
        message: "Password validation failed",
        errors: passwordValidation.errors,
      });
      return;
    }

    const otpDoc = await OtpCode.findOne({
      email,
      purpose: "reset",
      used: false,
    })
      .sort({ createdAt: -1 })
      .exec();

    if (!otpDoc || otpDoc.code !== otp || otpDoc.expiresAt < new Date()) {
      res.status(400).json({ message: "Mã OTP không hợp lệ hoặc đã hết hạn" });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    otpDoc.used = true;
    await otpDoc.save();

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("reset-password error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Login
router.post(
  "/login",
  authRateLimiter,
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Sanitize input
      const email = sanitizeString(req.body.email || "").toLowerCase();
      const password = req.body.password || "";
      const recaptchaToken = req.body.recaptchaToken;

      // Validate input
      if (!email || !password) {
        res.status(400).json({ message: "Email and password are required" });
        return;
      }

      if (!isValidEmail(email)) {
        res.status(400).json({ message: "Invalid email format" });
        return;
      }

      // Check if account is locked
      if (isAccountLocked(email)) {
        const remaining = getLockoutTimeRemaining(email);
        res.status(423).json({
          message: `Account is temporarily locked due to too many failed login attempts. Please try again in ${remaining} seconds.`,
          lockoutUntil: remaining,
        });
        return;
      }

      // Verify reCAPTCHA only if token is provided
      if (process.env.GOOGLE_RECAPTCHA_SECRET_KEY && recaptchaToken) {
        const recaptchaResponse = await fetch(
          "https://www.google.com/recaptcha/api/siteverify",
          {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `secret=${process.env.GOOGLE_RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`,
          }
        );
        const recaptchaData = (await recaptchaResponse.json()) as {
          success: boolean;
        };
        if (!recaptchaData.success) {
          res
            .status(400)
            .json({ message: "Xác thực CAPTCHA không thành công." });
          return;
        }
      }

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        // Record failed attempt even if user doesn't exist (prevent email enumeration)
        recordFailedAttempt(email);
        res.status(401).json({ message: "Invalid credentials" });
        return;
      }

      // Check password
      if (!user.password) {
        recordFailedAttempt(email);
        res.status(401).json({ message: "Invalid credentials" });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        const { isLocked, remainingAttempts } = recordFailedAttempt(email);
        if (isLocked) {
          res.status(423).json({
            message: `Too many failed login attempts. Account locked for 15 minutes.`,
            lockoutUntil: 900,
          });
        } else {
          res.status(401).json({
            message: "Invalid credentials",
            remainingAttempts,
          });
        }
        return;
      }

      // Clear failed attempts on successful login
      clearFailedAttempts(email);

      // Update last seen
      user.lastSeen = new Date();
      await user.save();

      // Create session with refresh token
      const deviceInfo = req.headers["user-agent"] || "Unknown";
      const ipAddress = req.ip || req.socket.remoteAddress || "Unknown";
      const { accessToken, refreshToken } = await createSession(
        user._id.toString(),
        deviceInfo,
        ipAddress,
        req.headers["user-agent"]
      );

      res.json({
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Refresh access token
router.post("/refresh", async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ message: "Refresh token is required" });
      return;
    }

    const result = await refreshAccessToken(refreshToken);

    if (!result) {
      res.status(401).json({ message: "Invalid or expired refresh token" });
      return;
    }

    res.json({
      accessToken: result.accessToken,
      refreshToken: result.newRefreshToken || refreshToken, // Return same token if not rotated
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Logout (delete session)
router.post("/logout", async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ message: "Refresh token is required" });
      return;
    }

    await deleteSession(refreshToken);

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Logout from all devices
router.post(
  "/logout-all",
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).userId;

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const deletedCount = await deleteAllUserSessions(userId);

      res.json({
        message: "Logged out from all devices",
        deletedSessions: deletedCount,
      });
    } catch (error) {
      console.error("Logout all error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// List active sessions (devices)
router.get(
  "/sessions",
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).userId;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const sessions = await getUserSessions(userId);
      res.json({ sessions });
    } catch (error) {
      console.error("Get sessions error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Logout one device by session id
router.delete(
  "/sessions/:sessionId",
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).userId;
      const sessionId = String(req.params.sessionId || "");
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      if (!sessionId) {
        res.status(400).json({ message: "sessionId is required" });
        return;
      }

      const ok = await deleteUserSessionById(userId, sessionId);
      if (!ok) {
        res.status(404).json({ message: "Session not found" });
        return;
      }
      res.json({ message: "Logged out device" });
    } catch (error) {
      console.error("Delete session error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;
