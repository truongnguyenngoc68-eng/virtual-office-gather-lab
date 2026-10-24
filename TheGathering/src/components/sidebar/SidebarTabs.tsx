import React from "react";

interface SidebarTabsProps {
  activeTab: "users" | "chat" | "events" | "admin" | "game";
  onTabClick: (tab: "users" | "chat" | "events" | "admin" | "game") => void;
}

/**
 * Sidebar navigation tabs component
 * Extracted from Sidebar.tsx for better code organization
 */
export const SidebarTabs: React.FC<SidebarTabsProps> = React.memo(({ activeTab, onTabClick }) => {
  const tabs = [
    {
      id: "events" as const,
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      ),
      title: "Events",
      gradient: "from-pink-500 to-rose-500",
      shadowColor: "rgba(244,63,94,0.5)",
    },
    {
      id: "chat" as const,
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      ),
      title: "Chat",
      gradient: "from-emerald-500 to-teal-500",
      shadowColor: "rgba(16,185,129,0.5)",
    },
    {
      id: "users" as const,
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
        />
      ),
      title: "Office",
      gradient: "from-blue-500 to-cyan-500",
      shadowColor: "rgba(59,130,246,0.5)",
    },
    {
      id: "game" as const,
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      ),
      title: "Library",
      gradient: "from-purple-500 to-indigo-500",
      shadowColor: "rgba(139,92,246,0.5)",
    },
    {
      id: "admin" as const,
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      ),
      title: "Admin Dashboard",
      gradient: "from-amber-500 to-orange-500",
      shadowColor: "rgba(245,158,11,0.5)",
    },
  ];

  return (
    <div className="flex flex-col items-center py-4 px-2">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-300 group relative mb-2 ${
              isActive
                ? `bg-gradient-to-br ${tab.gradient} text-white shadow-[0_0_15px_${tab.shadowColor}]`
                : "text-slate-400 hover:bg-white/10 hover:text-white"
            }`}
            onClick={() => onTabClick(tab.id)}
            title={tab.title}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {tab.icon}
            </svg>
            <span className="absolute left-16 bg-black/80 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10 z-50">
              {tab.title}
            </span>
            {isActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-white shadow-[0_0_8px_white]" />
            )}
          </button>
        );
      })}
    </div>
  );
});

SidebarTabs.displayName = "SidebarTabs";
