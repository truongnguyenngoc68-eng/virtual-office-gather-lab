import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, LayoutDashboard, Map, Shield } from "lucide-react";
import { clearAuthStorage, getStoredUser } from "../shared/storage";

export default function PortalDashboard() {
  const navigate = useNavigate();
  const user = useMemo(() => getStoredUser(), []);

  const logout = () => {
    clearAuthStorage();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-white/60">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
              <LayoutDashboard size={20} />
            </div>
            <div>
              <div className="font-black tracking-tight text-slate-900">
                Dashboard
              </div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Gather Portal
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {String(user?.role || "").toLowerCase() === "admin" && (
              <button
                type="button"
                onClick={() => navigate("/admin")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900 text-white font-black text-sm hover:bg-slate-800 transition"
              >
                <Shield size={16} />
                Admin
              </button>
            )}
            <button
              type="button"
              onClick={logout}
              className="px-4 py-2 rounded-2xl border border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            Welcome, {user?.displayName || user?.username || "there"}!
          </h1>
          <p className="text-slate-500 font-medium mt-2">
            Mình đã gộp “dashboard/admin/admin dashboard” từ `the-gathering` vào
            `Gather/` theo kiểu portal: dashboard điều hướng nhanh sang Rooms &
            Game; admin có trang quản trị riêng.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <Map size={22} />
              </div>
              <div>
                <div className="text-lg font-black text-slate-900">Rooms</div>
                <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                  Create / Join / Delete
                </div>
              </div>
            </div>
            <p className="text-slate-600 font-medium">
              Quản lý room trên server (tạo/xóa) và vào game theo room.
            </p>
            <button
              type="button"
              onClick={() => navigate("/app/chat")}
              className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-teal-700 text-white font-black hover:bg-teal-800 transition"
            >
              Go to Forum (Rooms)
              <ArrowRight size={18} />
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <ArrowRight size={22} />
              </div>
              <div>
                <div className="text-lg font-black text-slate-900">
                  Enter Game
                </div>
                <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                  Lobby
                </div>
              </div>
            </div>
            <p className="text-slate-600 font-medium">
              Vào Lobby để chọn/nhập room và bật chat/call/video.
            </p>
            <button
              type="button"
              onClick={() => navigate("/lobby")}
              className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-700 transition"
            >
              Go to Lobby
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

