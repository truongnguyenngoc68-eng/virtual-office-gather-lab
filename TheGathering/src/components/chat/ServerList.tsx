import { useState } from "react";
import { useNotifications } from "../../contexts/NotificationContext";

interface Server {
  id: string;
  name: string;
  icon?: string;
  unreadCount?: number;
  isOnline?: boolean;
}

interface ServerListProps {
  servers?: Server[];
  currentServerId: string;
  onServerSelect?: (id: string) => void;
  onAddServer?: () => void;
}

const ServerList = ({
  servers = [],
  currentServerId,
  onServerSelect,
  onAddServer,
}: ServerListProps) => {
  const [hoveredServerId, setHoveredServerId] = useState<string | null>(null);
  const { unreadCount } = useNotifications();

  // Default server if none provided
  const defaultServer: Server = {
    id: "default",
    name: "My Virtual Office",
    icon: "🏠",
    isOnline: true,
    unreadCount: unreadCount > 0 ? unreadCount : undefined,
  };

  const displayServers =
    servers.length > 0
      ? servers.map((server) => ({
          ...server,
          unreadCount:
            server.unreadCount ||
            (server.id === currentServerId && unreadCount > 0
              ? unreadCount
              : undefined),
        }))
      : [defaultServer];

  return (
    <div className="w-[72px] flex flex-col items-center py-3 gap-2 overflow-y-auto scrollbar-hide flex-shrink-0 bg-[#1E1F22]">
      {displayServers.map((server) => {
        const isActive = server.id === currentServerId;
        const isHovered = hoveredServerId === server.id;

        return (
          <div key={server.id} className="relative group flex items-center justify-center w-full">
            {/* Pill Indicator */}
             <div className={`absolute left-0 w-1 bg-white rounded-r transition-all duration-300 ${isActive ? 'h-10' : isHovered ? 'h-5' : 'h-2 opacity-0'}`} />
             
            <button
              className={`relative w-12 h-12 flex items-center justify-center rounded-[24px] cursor-pointer transition-all duration-300 group-hover:rounded-[16px] ${
                isActive 
                  ? "bg-violet-500 text-white rounded-[16px]" 
                  : "bg-[#313338] text-slate-400 hover:bg-violet-500 hover:text-white"
              }`}
              onClick={() => onServerSelect?.(server.id)}
              onMouseEnter={() => setHoveredServerId(server.id)}
              onMouseLeave={() => setHoveredServerId(null)}
              title={server.name}
            >
              <span className="text-xl transform outline-none transition-transform duration-200">
                 {server.icon || server.name.charAt(0).toUpperCase()}
              </span>

              {server.unreadCount && server.unreadCount > 0 && (
                <div className="absolute -bottom-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-[#1E1F22]">
                  {server.unreadCount > 99 ? "99+" : server.unreadCount}
                </div>
              )}
            </button>
          </div>
        );
      })}
      
      {onAddServer && (
        <div className="group relative flex items-center justify-center w-full mt-2">
           <button
             className="w-12 h-12 flex items-center justify-center rounded-[24px] bg-[#313338] text-emerald-500 cursor-pointer transition-all duration-300 hover:bg-emerald-500 hover:text-white hover:rounded-[16px] overflow-hidden group-hover:bg-emerald-500"
             onClick={onAddServer}
             title="Add Server"
           >
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
           </button>
        </div>
      )}
    </div>
  );
};

export default ServerList;
