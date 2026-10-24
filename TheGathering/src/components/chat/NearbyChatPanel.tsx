import { useState, useEffect } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { getNearbyUsers, calculateDistanceInMeters, getAvatarColor } from '../../utils';
import { formatTime } from '../../utils/date';
import { useAutoScroll } from '../../hooks/useAutoScroll';

interface NearbyChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NearbyMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: number;
  type: 'nearby';
}

const NearbyChatPanel = ({ isOpen, onClose }: NearbyChatPanelProps) => {
  const { socket, currentUser, users } = useSocket();
  const [messages, setMessages] = useState<NearbyMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useAutoScroll(messages);

  interface UserWithPosition {
    userId: string;
    position: { x: number; y: number };
  }

  function calculateDistance(user: UserWithPosition): number {
    if (!currentUser) return 0;
    return calculateDistanceInMeters(user.position, currentUser.position);
  }

  // Calculate nearby users (within 200 pixels)
  const nearbyUsers = getNearbyUsers(users, currentUser, 200);

  // Listen for nearby chat messages
  useEffect(() => {
    if (!socket) return;

    const handleChatMessage = (data: NearbyMessage) => {
      if (data.type === 'nearby') {
        setMessages((prev) => {
          // Deduplicate by id (server authoritative)
          if (prev.some((m) => m.id === data.id)) return prev;
          return [...prev, data];
        });
      }
    };

    socket.on('chat-message', handleChatMessage);

    return () => {
      socket.off('chat-message', handleChatMessage);
    };
  }, [socket]);

  const handleSendMessage = () => {
    if (!socket || !currentUser || !inputMessage.trim()) return;

    const message: NearbyMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId: currentUser.userId,
      username: currentUser.username,
      message: inputMessage.trim(),
      timestamp: Date.now(),
      type: 'nearby',
    };

    socket.emit('chat-message', message);
    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[999]" style={{ animation: 'fadeIn 0.2s ease' }} onClick={onClose} />
      <div className="fixed bottom-[100px] left-1/2 -translate-x-1/2 w-[420px] max-w-[90vw] h-[580px] max-h-[80vh] bg-white/98 dark:bg-[rgba(30,30,30,0.98)] backdrop-blur-[20px] rounded-2xl border border-black/8 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.3)] z-[1000] flex flex-col overflow-hidden" style={{ animation: 'slideUp 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
        <div className="flex items-center justify-between px-[18px] py-3.5 border-b border-black/6 dark:border-white/10 shrink-0">
          <div className="flex flex-col gap-1">
            <h3 className="m-0 text-[15px] font-semibold text-black/90 dark:text-white/95 tracking-tight">💬 Nearby Chat</h3>
            <span className="text-[11px] text-black/50 dark:text-white/60 font-medium">
              {nearbyUsers.length} {nearbyUsers.length === 1 ? 'person' : 'people'} nearby
            </span>
          </div>
          <button className="bg-transparent border-none text-[28px] text-[#72767d] cursor-pointer p-0 w-8 h-8 flex items-center justify-center rounded transition-all duration-200 shrink-0 hover:bg-[#40444b] hover:text-[#dcddde]" onClick={onClose}>×</button>
        </div>

        <div className="px-[18px] py-2.5 border-b border-black/6 dark:border-white/10 max-h-[150px] overflow-y-auto shrink-0 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#202225] [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb:hover]:bg-[#1a1c1f]">
          {nearbyUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-5 text-center">
              <span className="text-[32px] mb-2">👥</span>
              <p className="m-0 mb-1 text-sm text-[#dcddde]">No one nearby</p>
              <small className="text-xs text-[#72767d]">Move closer to other users to chat</small>
            </div>
          ) : (
            nearbyUsers.map((user) => (
              <div key={user.userId} className="flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] transition-all duration-200 mb-1 hover:bg-black/4 dark:hover:bg-white/8">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0" style={{ backgroundColor: getAvatarColor(user.userId) }}>
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span className="flex-1 text-sm text-[#dcddde] font-medium">{user.username}</span>
                <span className="text-[11px] text-black/50 dark:text-white/60 bg-black/4 dark:bg-white/8 px-2 py-0.5 rounded-[10px] font-medium">{calculateDistance(user)}m</span>
              </div>
            ))
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-[18px] py-3.5 flex flex-col gap-2.5 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#202225] [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb:hover]:bg-[#1a1c1f]">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <span className="text-[48px] mb-3 opacity-50">💭</span>
              <p className="m-0 mb-1 text-sm text-[#dcddde]">No messages yet</p>
              <small className="text-xs text-[#72767d]">Start a conversation with nearby users</small>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.userId === currentUser?.userId ? 'flex-row-reverse' : 'flex-row'}`}
                style={{ animation: 'messageSlideIn 0.2s ease' }}
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0" style={{ backgroundColor: getAvatarColor(msg.userId) }}>
                  {msg.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-[#dcddde]">{msg.username}</span>
                    <span className="text-[11px] text-[#72767d]">{formatTime(msg.timestamp)}</span>
                  </div>
                  <div className={`text-sm text-black/90 dark:text-white/95 leading-relaxed break-words bg-black/4 dark:bg-white/8 px-3 py-2 rounded-xl ${msg.userId === currentUser?.userId ? 'bg-[#5865f2] text-white shadow-[0_2px_4px_rgba(88,101,242,0.2)]' : ''}`}>{msg.message}</div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex gap-2 px-[18px] py-3.5 border-t border-black/6 dark:border-white/10 shrink-0 bg-black/2 dark:bg-white/2">
          <input
            type="text"
            placeholder={nearbyUsers.length > 0 ? "Message nearby users..." : "No one nearby to chat with"}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={nearbyUsers.length === 0}
            className="flex-1 px-3.5 py-2.5 bg-white/80 dark:bg-white/5 border border-black/8 dark:border-white/10 rounded-xl text-sm text-black/90 dark:text-white/95 outline-none transition-all duration-200 focus:bg-white/95 dark:focus:bg-white/8 focus:border-[#5865f2] focus:shadow-[0_0_0_3px_rgba(88,101,242,0.1)] disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-[#72767d]"
          />
          <button
            className="w-10 h-10 bg-[#5865f2] border-none rounded-xl text-white cursor-pointer flex items-center justify-center transition-all duration-200 shrink-0 shadow-[0_2px_4px_rgba(88,101,242,0.3)] hover:bg-[#4752c4] hover:-translate-y-px hover:shadow-[0_4px_8px_rgba(88,101,242,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || nearbyUsers.length === 0}
            aria-label="Send message"
            title="Send message"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );

};

export default NearbyChatPanel;
