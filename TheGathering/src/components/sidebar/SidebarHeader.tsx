import React from "react";
import { useNavigate } from "react-router-dom";
import NotificationCenter from "../NotificationCenter";

interface SidebarHeaderProps {
  projectName: string;
  onSettingsClick: () => void;
}

/**
 * Sidebar header component with avatar and settings buttons
 * Extracted from Sidebar.tsx for better code organization
 */
export const SidebarHeader: React.FC<SidebarHeaderProps> = React.memo(
  ({ projectName, onSettingsClick }) => {
    const navigate = useNavigate();

    return (
      <div className="h-16 px-5 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
        <h2 className="m-0 text-lg font-display font-semibold text-white tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
          {projectName}
        </h2>
        <div className="flex items-center gap-2">
          <button
            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:bg-white/10 hover:border-white/30 hover:text-white text-xs font-semibold transition-colors"
            onClick={() => navigate("/avatar")}
            title="Đổi avatar pixel"
          >
            AV
          </button>
          <button
            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:bg-white/10 hover:border-white/30 hover:text-white transition-colors"
            onClick={onSettingsClick}
            title="Settings"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M10.325 4.317a1 1 0 011.35-.447l.447.224a1 1 0 00.894 0l.447-.224a1 1 0 011.35.447l.224.447a1 1 0 00.553.553l.447.224a1 1 0 01.447 1.35l-.224.447a1 1 0 000 .894l.224.447a1 1 0 01-.447 1.35l-.447.224a1 1 0 00-.553.553l-.224.447a1 1 0 01-1.35.447l-.447-.224a1 1 0 00-.894 0l-.447.224a1 1 0 01-1.35-.447l-.224-.447a1 1 0 00-.553-.553l-.447-.224a1 1 0 01-.447-1.35l.224-.447a1 1 0 000-.894l-.224-.447a1 1 0 01.447-1.35l.447-.224a1 1 0 00.553-.553l.224-.447z"
              />
              <circle cx="12" cy="12" r="2.5" />
            </svg>
          </button>
          <div className="transform scale-90">
            <NotificationCenter />
          </div>
        </div>
      </div>
    );
  }
);

SidebarHeader.displayName = "SidebarHeader";
