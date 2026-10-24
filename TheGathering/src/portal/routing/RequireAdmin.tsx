import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { getStoredUser } from "../shared/storage";

export default function RequireAdmin({ children }: { children: ReactNode }) {
  const user = getStoredUser();
  if (!user) return <Navigate to="/" replace />;
  if (String(user.role || "").toLowerCase() !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

