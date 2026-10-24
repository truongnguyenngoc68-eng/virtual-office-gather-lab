import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LegacyAuthFlow from "./LegacyAuthFlow";
import RequireAuth from "./portal/routing/RequireAuth";
import RequireAdmin from "./portal/routing/RequireAdmin";

// Lazy load các pages để tối ưu initial bundle
const Lobby = lazy(() => import("./pages/Lobby"));
const AppPage = lazy(() => import("./pages/App"));
const AvatarPage = lazy(() => import("./pages/AvatarPage"));
const Spaces = lazy(() => import("./pages/Spaces"));
const SetupPage = lazy(() => import("./pages/SetupPage"));
const PortalDashboard = lazy(() => import("./portal/dashboard/PortalDashboard"));
const AdminDashboard = lazy(() => import("./portal/admin/AdminDashboard"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-900">
    <div className="text-white text-lg">Loading...</div>
  </div>
);

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/spaces" element={<Spaces />} />
        <Route path="/setup/:roomId" element={<SetupPage />} />
        <Route path="/app/chat" element={<AppPage />} />
        {/* Updated app route to accept roomId */}
        <Route path="/app/:roomId" element={<AppPage />} />
        <Route path="/app" element={<Navigate to="/spaces" replace />} />

        <Route path="/avatar" element={<AvatarPage />} />

        {/* Legacy standalone library page - redirect into new flow */}
        <Route
          path="/library"
          element={
            <RequireAuth>
              <Navigate to="/spaces" replace />
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <PortalDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <RequireAdmin>
                <AdminDashboard />
              </RequireAdmin>
            </RequireAuth>
          }
        />

        {/* Back-compat: old flow lives at "/" */}
        <Route path="/" element={<LegacyAuthFlow />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
