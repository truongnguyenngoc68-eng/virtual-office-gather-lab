import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar, { type AdminView } from "../components/AdminSidebar";
import PortalSettingsModal from "../components/PortalSettingsModal";
import AdminRooms from "./AdminRooms";
import AdminUsers from "./AdminUsers";
import AdminLibrary from "./AdminLibrary";
import { clearAuthStorage, getServerUrl, getStoredUser, getToken } from "../shared/storage";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = useMemo(() => getStoredUser(), []);

  const [activeView, setActiveView] = useState<AdminView>("overview");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [analyticsSummary, setAnalyticsSummary] = useState<{
    eventTypeCounts: { _id: string; count: number }[];
    uniqueUsers: number;
    uniqueSessions: number;
    topEvents: { _id: string; count: number }[];
  } | null>(null);

  const handleLogout = () => {
    clearAuthStorage();
    navigate("/", { replace: true });
  };

  const serverUrl = getServerUrl();
  const token = getToken();

  const loadAnalytics = async () => {
    if (analyticsLoading) return;
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const res = await fetch(`${serverUrl}/api/analytics/summary`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load analytics");
      setAnalyticsSummary({
        eventTypeCounts: data.eventTypeCounts || [],
        uniqueUsers: data.uniqueUsers || 0,
        uniqueSessions: data.uniqueSessions || 0,
        topEvents: data.topEvents || [],
      });
    } catch (e) {
      setAnalyticsError((e as Error).message);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-[#020617] flex overflow-hidden relative">
      {/* Background */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#6366f1 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

      <AdminSidebar
        user={user}
        activeView={activeView}
        setActiveView={setActiveView}
        onLogout={handleLogout}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <PortalSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onLogout={handleLogout}
      />

      <main className="flex-1 p-10 overflow-y-auto z-10">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight uppercase">
              {activeView === "overview"
                ? "System Analytics"
                : activeView === "rooms"
                  ? "Rooms Moderation"
                  : activeView === "users"
                    ? "User Management"
                    : "Library Management"}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                System Online
              </span>
            </div>
          </div>
        </header>

        {activeView === "rooms" ? (
          <AdminRooms />
        ) : activeView === "users" ? (
          <AdminUsers />
        ) : activeView === "library" ? (
          <AdminLibrary />
        ) : activeView === "overview" ? (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1 bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">
                      Traffic Overview (last 90 days)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Tổng quan sự kiện được track qua `/api/analytics`.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={loadAnalytics}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-black uppercase tracking-widest text-white disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={analyticsLoading}
                  >
                    {analyticsLoading ? "Loading..." : "Refresh"}
                  </button>
                </div>

                {analyticsError && (
                  <div className="mb-4 text-xs text-rose-400 bg-rose-950/40 border border-rose-800 rounded-xl px-3 py-2 text-left">
                    {analyticsError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-950/40 rounded-3xl border border-slate-800 p-5">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                      Unique Users
                    </p>
                    <p className="text-3xl font-black text-white">
                      {analyticsSummary?.uniqueUsers ?? "—"}
                    </p>
                  </div>
                  <div className="bg-slate-950/40 rounded-3xl border border-slate-800 p-5">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                      Sessions
                    </p>
                    <p className="text-3xl font-black text-white">
                      {analyticsSummary?.uniqueSessions ?? "—"}
                    </p>
                  </div>
                  <div className="bg-slate-950/40 rounded-3xl border border-slate-800 p-5">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                      Total Events
                    </p>
                    <p className="text-3xl font-black text-white">
                      {analyticsSummary
                        ? analyticsSummary.eventTypeCounts.reduce(
                            (sum, e) => sum + (e.count || 0),
                            0,
                          )
                        : "—"}
                    </p>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                      Events by type
                    </p>
                    <div className="space-y-2">
                      {(analyticsSummary?.eventTypeCounts || []).map((t) => {
                        const total =
                          analyticsSummary?.eventTypeCounts.reduce(
                            (sum, e) => sum + (e.count || 0),
                            0,
                          ) || 0;
                        const pct = total ? Math.round((t.count / total) * 100) : 0;
                        return (
                          <div
                            key={t._id}
                            className="flex items-center gap-3 text-xs text-slate-300"
                          >
                            <span className="w-24 font-mono text-[11px] uppercase tracking-widest text-slate-400">
                              {t._id || "unknown"}
                            </span>
                            <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className="h-full bg-indigo-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-10 text-right text-[11px] text-slate-400">
                              {t.count}
                            </span>
                          </div>
                        );
                      })}
                      {(!analyticsSummary ||
                        (analyticsSummary.eventTypeCounts || []).length === 0) &&
                        !analyticsLoading && (
                          <p className="text-xs text-slate-500">
                            Chưa có dữ liệu analytics đủ để hiển thị.
                          </p>
                        )}
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                      Top events
                    </p>
                    <div className="space-y-2">
                      {(analyticsSummary?.topEvents || []).map((e) => (
                        <div
                          key={e._id}
                          className="flex items-center justify-between text-xs text-slate-300 bg-slate-950/40 border border-slate-800 rounded-2xl px-3 py-2"
                        >
                          <span className="truncate max-w-[180px] font-mono">
                            {e._id}
                          </span>
                          <span className="text-[11px] text-slate-400 font-bold">
                            {e.count}
                          </span>
                        </div>
                      ))}
                      {(!analyticsSummary ||
                        (analyticsSummary.topEvents || []).length === 0) &&
                        !analyticsLoading && (
                          <p className="text-xs text-slate-500">
                            Chưa có event nào được track đủ nổi bật.
                          </p>
                        )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full lg:w-[320px] bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white mb-2">
                    Moderation Shortcuts
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Truy cập nhanh các khu vực moderation đang dùng dữ liệu thật.
                  </p>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setActiveView("rooms")}
                      className="w-full text-left px-4 py-2.5 rounded-2xl bg-slate-950/60 hover:bg-slate-950 text-xs text-slate-200 font-semibold flex items-center justify-between"
                    >
                      <span>Rooms Management</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        /admin → Rooms
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveView("users")}
                      className="w-full text-left px-4 py-2.5 rounded-2xl bg-slate-950/40 hover:bg-slate-950 text-xs text-slate-200 font-semibold flex items-center justify-between"
                    >
                      <span>User Management</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        /admin → Users
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveView("library")}
                      className="w-full text-left px-4 py-2.5 rounded-2xl bg-slate-950/40 hover:bg-slate-950 text-xs text-slate-200 font-semibold flex items-center justify-between"
                    >
                      <span>Library Management</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        /admin → Library
                      </span>
                    </button>
                  </div>
                </div>
                <div className="mt-6 text-[11px] text-slate-500 border-t border-slate-800 pt-4">
                  Analytics đang lấy dữ liệu từ collection `Analytics` (TTL 90 ngày).
                  Các sự kiện page view / user action đã được track sẵn từ frontend.
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

