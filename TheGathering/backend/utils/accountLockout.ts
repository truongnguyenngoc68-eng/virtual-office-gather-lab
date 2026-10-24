/**
 * Account lockout utility to prevent brute force attacks
 */

interface LockoutEntry {
  attempts: number;
  lockoutUntil: number | null;
}

const lockoutStore = new Map<string, LockoutEntry>();

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Check if account is locked out
 */
export function isAccountLocked(email: string): boolean {
  const entry = lockoutStore.get(email.toLowerCase());
  if (!entry) {
    return false;
  }

  if (entry.lockoutUntil && Date.now() < entry.lockoutUntil) {
    return true;
  }

  // Clear lockout if expired
  if (entry.lockoutUntil && Date.now() >= entry.lockoutUntil) {
    lockoutStore.delete(email.toLowerCase());
    return false;
  }

  return false;
}

/**
 * Record failed login attempt
 */
export function recordFailedAttempt(email: string): { isLocked: boolean; remainingAttempts: number } {
  const key = email.toLowerCase();
  const entry = lockoutStore.get(key) || { attempts: 0, lockoutUntil: null };

  entry.attempts++;

  if (entry.attempts >= MAX_ATTEMPTS) {
    entry.lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
    lockoutStore.set(key, entry);
    return { isLocked: true, remainingAttempts: 0 };
  }

  lockoutStore.set(key, entry);
  return { isLocked: false, remainingAttempts: MAX_ATTEMPTS - entry.attempts };
}

/**
 * Clear failed attempts on successful login
 */
export function clearFailedAttempts(email: string): void {
  lockoutStore.delete(email.toLowerCase());
}

/**
 * Get lockout time remaining in seconds
 */
export function getLockoutTimeRemaining(email: string): number | null {
  const entry = lockoutStore.get(email.toLowerCase());
  if (!entry || !entry.lockoutUntil) {
    return null;
  }

  const remaining = entry.lockoutUntil - Date.now();
  return remaining > 0 ? Math.ceil(remaining / 1000) : null;
}

/**
 * Clean up expired entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of lockoutStore.entries()) {
    // Remove if lockout expired and no recent attempts
    if (entry.lockoutUntil && entry.lockoutUntil < now) {
      const timeSinceLockout = now - entry.lockoutUntil;
      if (timeSinceLockout > ATTEMPT_WINDOW_MS) {
        lockoutStore.delete(key);
      }
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes
