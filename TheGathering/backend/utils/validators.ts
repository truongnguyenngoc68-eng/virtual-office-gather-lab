/**
 * Validation and sanitization utilities
 * Combines password and input validation
 */

// ============================================
// Password Validation
// ============================================

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: "weak" | "medium" | "strong";
}

/**
 * Validate password strength
 * Requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  let strength: "weak" | "medium" | "strong" = "weak";

  if (!password) {
    return {
      isValid: false,
      errors: ["Password is required"],
      strength: "weak",
    };
  }

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  // Determine strength
  if (errors.length === 0) {
    if (password.length >= 12 && /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      strength = "strong";
    } else if (password.length >= 10) {
      strength = "medium";
    } else {
      strength = "medium";
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
}

/**
 * Check if password is in common passwords list
 */
export function isCommonPassword(password: string): boolean {
  const commonPasswords = [
    "password",
    "12345678",
    "password123",
    "admin123",
    "qwerty123",
    "letmein",
    "welcome123",
    "monkey123",
    "1234567890",
    "password1",
  ];

  return commonPasswords.includes(password.toLowerCase());
}

// ============================================
// Input Validation & Sanitization
// ============================================

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  return input
    .trim()
    .replace(/[<>]/g, "") // Remove < and >
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, ""); // Remove event handlers like onclick=
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.toLowerCase());
}

/**
 * Validate username format
 * Requirements:
 * - 3-20 characters
 * - Alphanumeric and underscores only
 * - Cannot start or end with underscore
 */
export function isValidUsername(username: string): boolean {
  if (!username || typeof username !== "string") {
    return false;
  }

  const usernameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9_]{1,18}[a-zA-Z0-9])?$/;
  return usernameRegex.test(username) && username.length >= 3 && username.length <= 20;
}

/** Map Vietnamese diacritics to ASCII for slug */
const VI_TO_ASCII: Record<string, string> = {
  à: "a", á: "a", ả: "a", ã: "a", ạ: "a", ă: "a", ằ: "a", ắ: "a", ẳ: "a", ẵ: "a", ặ: "a", â: "a", ầ: "a", ấ: "a", ẩ: "a", ẫ: "a", ậ: "a",
  è: "e", é: "e", ẻ: "e", ẽ: "e", ẹ: "e", ê: "e", ề: "e", ế: "e", ể: "e", ễ: "e", ệ: "e",
  ì: "i", í: "i", ỉ: "i", ĩ: "i", ị: "i",
  ò: "o", ó: "o", ỏ: "o", õ: "o", ọ: "o", ô: "o", ồ: "o", ố: "o", ổ: "o", ỗ: "o", ộ: "o", ơ: "o", ờ: "o", ớ: "o", ở: "o", ỡ: "o", ợ: "o",
  ù: "u", ú: "u", ủ: "u", ũ: "u", ụ: "u", ư: "u", ừ: "u", ứ: "u", ử: "u", ữ: "u", ự: "u",
  ỳ: "y", ý: "y", ỷ: "y", ỹ: "y", ỵ: "y", đ: "d",
};

/**
 * Create a valid username (3-20 chars, a-z 0-9 _) from full name.
 * Used when user signs up with "Họ" + "Tên" (e.g. Phát, Bành) so they don't see username rules.
 */
export function usernameFromFullName(fullName: string, emailFallback: string): string {
  if (!fullName || typeof fullName !== "string") {
    const local = (emailFallback || "").split("@")[0] || "";
    return local.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 20) || "user";
  }
  let slug = fullName
    .trim()
    .toLowerCase()
    .split("")
    .map((c) => VI_TO_ASCII[c] ?? c)
    .join("");
  slug = slug.replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
  if (slug.length < 3) {
    const local = (emailFallback || "").split("@")[0] || "";
    slug = local.replace(/[^a-z0-9_]/g, "_").slice(0, 20) || "user";
  }
  return slug.slice(0, 20);
}

/**
 * Validate room ID format
 */
export function isValidRoomId(roomId: string): boolean {
  if (!roomId || typeof roomId !== "string") {
    return false;
  }

  // Room ID should be alphanumeric with hyphens, 3-50 characters
  const roomIdRegex = /^[a-zA-Z0-9-]{3,50}$/;
  return roomIdRegex.test(roomId);
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj };

  for (const key in sanitized) {
    if (typeof sanitized[key] === "string") {
      sanitized[key] = sanitizeString(sanitized[key]);
    } else if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key]);
    }
  }

  return sanitized;
}
