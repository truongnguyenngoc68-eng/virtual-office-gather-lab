export type PortalUserRole = "admin" | "moderator" | "member" | "guest" | string;

export interface PortalUser {
  id?: string;
  username?: string;
  email?: string;
  role?: PortalUserRole;
  displayName?: string;
}

export function getServerUrl(): string {
  return import.meta.env.VITE_SERVER_URL || "http://localhost:5001";
}

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function getStoredUser(): PortalUser | null {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PortalUser;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function clearAuthStorage(): void {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("userName");
  localStorage.removeItem("userAvatar");
  localStorage.removeItem("authToken");
}

