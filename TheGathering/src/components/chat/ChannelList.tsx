import { useState } from "react";
import { useWebRTC } from "../../contexts/WebRTCContext";

// (hover hook removed - inline state used)

export interface Channel {
  id: string;
  name: string;
  type: "text" | "voice";
  category?: string;
  unreadCount?: number;
  description?: string;
}

export interface VoiceChannel {
  id: string;
  name: string;
  users: string[]; // userIds
  isActive: boolean;
  duration?: number; // in seconds
}

interface ChannelListProps {
  serverName: string;
  channels: Channel[];
  voiceChannels?: VoiceChannel[];
  selectedChannelId: string | null;
  currentVoiceChannelId?: string | null;
  onChannelSelect: (id: string) => void;
  onVoiceChannelJoin?: (id: string) => void;
  onCreateChannel?: (type: "text" | "voice") => void;
  currentUser?: { userId: string; username: string; avatar?: string };
  className?: string;
}

const ChannelList = ({
  serverName,
  channels,
  voiceChannels = [],
  selectedChannelId,
  currentVoiceChannelId,
  onChannelSelect,
  onVoiceChannelJoin,
  onCreateChannel,
  currentUser,
  className = "",
}: ChannelListProps) => {
  useWebRTC(); // keep provider initialized for voice/video state
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set()
  );
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  const toggleAudio = () => {
    setIsAudioEnabled((v) => !v);
  };
  // hover state not currently used (kept UI simple)

  const toggleSection = (section: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const textChannels = channels.filter((ch) => ch.type === "text");
  const filteredTextChannels = textChannels.filter((ch) =>
    ch.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredVoiceChannels = voiceChannels.filter((vc) =>
    vc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className={`w-60 flex flex-col overflow-hidden bg-[#2B2D31] ${className}`}
    >
      {/* Header */}
      <div className="px-4 h-12 flex items-center justify-between shadow-sm bg-[#2B2D31] hover:bg-[#35373C] transition-colors cursor-pointer border-b border-[#1F2023]">
        <h2 className="m-0 text-[15px] font-bold text-slate-200 tracking-tight flex items-center gap-2">
          {serverName}
        </h2>
        <svg className="w-4 h-4 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </div>

      {/* Search */}
      <div className="px-2 py-2 relative">
        <div className="relative group">
            <input
            type="text"
            placeholder="Find channel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-1 px-2 text-xs bg-[#1E1F22] rounded text-slate-200 placeholder:text-slate-400 focus:outline-none transition-all"
            />
            {/* Search Icon if needed, or keeping it clean like Discord's quick switcher which is usually Ctrl+K modal */}
        </div>
      </div>

      {/* Text Channels Section */}
      <div className="mt-2 px-2">
        <div
          className="flex items-center gap-0.5 px-1 py-1 cursor-pointer select-none group hover:text-slate-300 text-slate-500"
          onClick={() => toggleSection("text")}
        >
          <svg className={`w-3 h-3 transition-transform duration-200 ${collapsedSections.has("text") ? "-rotate-90" : "rotate-0"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
          </svg>
          <h3 className="text-[12px] font-bold uppercase tracking-wide">
            Text Channels
          </h3>
          {onCreateChannel && (
              <button 
                className="ml-auto opacity-0 group-hover:opacity-100 transition-all hover:text-white"
                onClick={(e) => {
                    e.stopPropagation();
                    onCreateChannel("text");
                }}
              >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </button>
          )}
        </div>
        {!collapsedSections.has("text") && (
          <div className="mt-0.5 flex flex-col gap-[2px]">
            {filteredTextChannels.map((channel) => (
                <div
                key={channel.id}
                className={`px-2 py-[5px] rounded mx-1 cursor-pointer transition-all duration-100 flex items-center gap-1.5 group relative ${
                    selectedChannelId === channel.id
                    ? "bg-[#404249] text-white"
                    : "text-slate-400 hover:bg-[#35373C] hover:text-slate-200"
                }`}
                onClick={() => onChannelSelect(channel.id)}
                >
                <span className={`text-lg leading-none ${selectedChannelId === channel.id ? "text-slate-300" : "text-slate-500"}`}>#</span>
                <span className={`flex-1 font-medium truncate text-[14px] ${selectedChannelId === channel.id ? "text-white" : "group-hover:text-slate-200"}`}>
                    {channel.name}
                </span>
                {channel.unreadCount && channel.unreadCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 rounded-full">
                    {channel.unreadCount}
                    </span>
                )}
                </div>
            ))}
          </div>
        )}
      </div>

      {/* Voice Channels Section */}
      <div className="mt-4 px-2">
        <div
          className="flex items-center gap-0.5 px-1 py-1 cursor-pointer select-none group hover:text-slate-300 text-slate-500"
          onClick={() => toggleSection("voice")}
        >
          <svg className={`w-3 h-3 transition-transform duration-200 ${collapsedSections.has("voice") ? "-rotate-90" : "rotate-0"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
          </svg>
          <h3 className="text-[12px] font-bold uppercase tracking-wide">
            Voice Channels
          </h3>
           {onCreateChannel && (
              <button 
                className="ml-auto opacity-0 group-hover:opacity-100 transition-all hover:text-white"
                onClick={(e) => {
                    e.stopPropagation();
                    onCreateChannel("voice");
                }}
              >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </button>
          )}
        </div>
        {!collapsedSections.has("voice") && (
          <div className="mt-0.5 flex flex-col gap-[2px]">
             {filteredVoiceChannels.map((voiceChannel) => {
                  const isCurrentChannel = currentVoiceChannelId === voiceChannel.id;
                  return (
                    <div
                      key={voiceChannel.id}
                      className={`px-2 py-[5px] rounded mx-1 cursor-pointer transition-all duration-100 flex flex-col gap-1 group ${
                        voiceChannel.isActive || isCurrentChannel
                          ? "bg-[#404249] text-white"
                          : "text-slate-400 hover:bg-[#35373C] hover:text-slate-200"
                      }`}
                      onClick={() => onVoiceChannelJoin?.(voiceChannel.id)}
                    >
                      <div className="flex items-center gap-1.5">
                            <svg className={`w-4 h-4 ${isCurrentChannel ? "text-slate-200" : "text-slate-500 group-hover:text-slate-300"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            </svg>
                            <span className={`flex-1 font-medium truncate text-[14px] ${isCurrentChannel ? "text-white" : ""}`}>
                                {voiceChannel.name}
                            </span>
                      </div>
                      
                       {/* Compact UserAvatars in Voice Channel */}
                      {voiceChannel.users.length > 0 && (
                          <div className="pl-6 flex flex-wrap gap-1">
                              {voiceChannel.users.map((userId) => (
                                  <div key={userId} className="w-5 h-5 rounded-full bg-slate-700 border border-[#2B2D31] overflow-hidden">
                                      {/* Placeholder for user avatar */}
                                      <div className="w-full h-full bg-[#5865F2] flex items-center justify-center text-[8px] text-white">
                                          {userId.charAt(0).toUpperCase()}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                    </div>
                  );
                })}
          </div>
        )}
      </div>

      {/* Footer User Control */}
      {currentUser && (
        <div className="mt-auto bg-[#232428] p-2 flex items-center gap-2">
          <div className="relative group cursor-pointer hover:opacity-80">
                <div className="w-8 h-8 rounded-full bg-[#313338] flex items-center justify-center overflow-hidden">
                        {currentUser.avatar ? (
                        <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                            <span className="text-white text-xs font-bold">{currentUser.username.charAt(0).toUpperCase()}</span>
                    )}
                </div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-[2px] border-[#232428]" />
          </div>
            
            <div className="flex-1 min-w-0">
               <div className="text-[13px] font-bold text-white truncate">{currentUser.username}</div>
               <div className="text-[11px] text-slate-400 truncate">Online</div>
            </div>

            <button
                className={`p-1.5 rounded hover:bg-[#3F4147] transition-colors ${!isAudioEnabled ? "text-red-400" : "text-slate-200"}`}
                onClick={toggleAudio}
            >
                {isAudioEnabled ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                )}
            </button>
            <button
                className="p-1.5 rounded hover:bg-[#3F4147] text-slate-200 transition-colors"
                // Settings handler
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
        </div>
      )}
    </div>
  );
};

export default ChannelList;
