// Lazy load framer-motion để giảm initial bundle size
import { motion } from "framer-motion";
import {
  BarChart3,
  Users,
  MessageSquare,
  ShieldCheck,
  LogOut,
  ChevronRight,
  BookOpen,
  Settings,
  type LucideIcon,
} from "lucide-react";

import type { PortalUser } from "../shared/storage";

export type AdminView = "overview" | "rooms" | "users" | "library";

interface AdminSidebarProps {
  activeView: AdminView;
  setActiveView: (view: AdminView) => void;
  onLogout: () => void;
  onOpenSettings: () => void;
  user: PortalUser | null;
}

export default function AdminSidebar({
  activeView,
  setActiveView,
  onLogout,
  onOpenSettings,
  user,
}: AdminSidebarProps) {
  const menuItems: Array<{
    id: AdminView;
    icon: LucideIcon;
    label: string;
  }> = [
    { id: "overview", icon: BarChart3, label: "Analytics" },
    { id: "rooms", icon: MessageSquare, label: "Rooms Management" },
    { id: "library", icon: BookOpen, label: "Library Management" },
    { id: "users", icon: Users, label: "User Management" },
  ];

  return (
    <aside className="w-72 h-screen flex-none bg-slate-950 border-r border-slate-800 hidden md:flex flex-col sticky top-0 z-30">
      {/* Branding */}
      <div className="p-8">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-900/20">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-white font-black tracking-tight leading-none">
              GATHER
            </h1>
            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.2em]">
              Command Center
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
              activeView === item.id
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <div className="flex items-center gap-3">
              <item.icon
                size={20}
                className={
                  activeView === item.id
                    ? "text-white"
                    : "text-slate-500 group-hover:text-indigo-400 transition-colors"
                }
              />
              <span className="text-sm font-bold tracking-wide">
                {item.label}
              </span>
            </div>
            {activeView === item.id && (
              <motion.div layoutId="admin-active-pill">
                <ChevronRight size={16} className="text-indigo-300" />
              </motion.div>
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-900 bg-slate-950/50">
        <div className="bg-slate-900/50 p-4 rounded-4xl border border-slate-800/50 flex items-center gap-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center text-indigo-400 font-black text-xs">
            AD
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black text-white truncate">
              {user?.username || "Admin"}
            </p>
            <p className="text-[10px] text-slate-500 font-bold truncate">
              {user?.email || "—"}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-6 py-4 text-slate-400 hover:text-white hover:bg-slate-900/60 rounded-2xl transition-colors group mb-2"
        >
          <Settings
            size={20}
            className="group-hover:rotate-12 transition-transform"
          />
          <span className="text-sm font-bold tracking-wide">Settings</span>
        </button>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-6 py-4 text-slate-400 hover:text-rose-400 transition-colors group"
        >
          <LogOut
            size={20}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span className="text-sm font-bold tracking-wide">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

