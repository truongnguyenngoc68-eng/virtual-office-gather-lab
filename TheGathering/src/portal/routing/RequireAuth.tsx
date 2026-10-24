import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { getToken } from "../shared/storage";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const token = getToken();
  if (!token) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}

