import { useState, useEffect } from "react";
import { formatTime } from "../../utils/date";
import { getAvatarColor } from "../../utils/avatar";

interface Message {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: number;
  editedAt?: number;
  replyTo?: {
    id: string;
    username: string;
    message: string;
  };
  reactions?: Array<{
    emoji: string;
    users: string[];
  }>;
  attachments?: Array<{
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
  }>;
}

interface MessageItemProps {
  message: Message;
  isGrouped: boolean; // Nếu true, không hiển thị avatar và username
  isOwnMessage: boolean;
  currentUserId?: string;
  onReply?: (messageId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onDelete?: (messageId: string) => void;
}

const MessageItem = ({
  message,
  isGrouped,
  isOwnMessage,
  currentUserId,
  onReply,
  onReact,
  onEdit,
  onDelete,
}: MessageItemProps) => {
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.message);

  // Sync editContent when message changes
  useEffect(() => {
    if (!isEditing) {
      setEditContent(message.message);
    }
  }, [message.message, isEditing]);

  const formatMessage = (text: string): React.ReactNode => {
    // Simple formatting: **bold**, *italic*, `code`, @mentions
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    // Match patterns: **bold**, *italic*, `code`, @username
    const patterns = [
      { regex: /\*\*(.+?)\*\*/g, type: "bold" },
      { regex: /\*(.+?)\*/g, type: "italic" },
      { regex: /`(.+?)`/g, type: "code" },
      { regex: /@(\w+)/g, type: "mention" },
    ];

    const matches: Array<{
      index: number;
      length: number;
      type: string;
      content: string;
    }> = [];

    patterns.forEach(({ regex, type }) => {
      let match;
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          index: match.index,
          length: match[0].length,
          type,
          content: match[1],
        });
      }
    });

    matches.sort((a, b) => a.index - b.index);

    matches.forEach((match) => {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      if (match.type === "bold") {
        parts.push(
          <strong key={`${match.index}-bold`}>{match.content}</strong>
        );
      } else if (match.type === "italic") {
        parts.push(<em key={`${match.index}-italic`}>{match.content}</em>);
      } else if (match.type === "code") {
        parts.push(
          <code key={`${match.index}-code`} className="inline-code">
            {match.content}
          </code>
        );
      } else if (match.type === "mention") {
        parts.push(
          <span key={`${match.index}-mention`} className="mention">
            @{match.content}
          </span>
        );
      }

      lastIndex = match.index + match.length;
    });

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  const handleEdit = () => {
    if (editContent.trim() && editContent !== message.message) {
      onEdit?.(message.id, editContent);
    }
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEdit();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditContent(message.message);
    }
  };

  const commonReactions = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

  const avatarColor = getAvatarColor(message.userId);
  const avatarInitial = message.username.charAt(0).toUpperCase();

  return (
    <div
      className={`flex gap-4 px-5 py-2 rounded-xl transition-all duration-300 relative group ${
        isGrouped ? "py-1" : "py-3"
      } hover:bg-slate-800/30 hover:shadow-sm`}
      data-message-id={message.id}
      data-user-id={message.userId}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {!isGrouped && (
        <div className="relative shrink-0 w-11 h-11">
          <div
            className="w-11 h-11 rounded-full text-white flex items-center justify-center font-bold text-base cursor-pointer transition-all duration-300 border-2 border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.2)] relative hover:scale-110 hover:shadow-[0_6px_16px_rgba(0,0,0,0.3)] hover:ring-2 hover:ring-indigo-500/30 active:scale-95 after:content-[''] after:absolute after:-bottom-0.5 after:-right-0.5 after:w-4 after:h-4 after:rounded-full after:bg-gradient-to-br after:from-emerald-400 after:to-emerald-500 after:border-[3px] after:border-slate-950 after:shadow-[0_0_0_2px_rgba(0,0,0,0.1),0_0_8px_rgba(34,197,94,0.4)] after:z-10"
            style={{ backgroundColor: avatarColor }}
            title={message.username}
          >
            {avatarInitial}
          </div>
        </div>
      )}
      <div className={`flex-1 min-w-0 ${isGrouped ? "ml-14 relative" : ""}`}>
        {!isGrouped ? (
          <div className="flex items-baseline gap-2.5 mb-1.5">
            <span
              className="font-bold text-[15px] cursor-pointer inline-block px-1.5 py-0.5 rounded-lg transition-all duration-200 hover:underline hover:bg-black/5 dark:hover:bg-white/5 hover:scale-105"
              style={{ color: avatarColor }}
              title={`User ID: ${message.userId}`}
            >
              {message.username}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {formatTime(message.timestamp)}
              {message.editedAt && (
                <span
                  className="text-[11px] italic opacity-70 ml-1.5"
                  title="Đã chỉnh sửa"
                >
                  (đã chỉnh sửa)
                </span>
              )}
            </span>
          </div>
        ) : (
          // Show small timestamp for grouped messages (Discord-like)
          <span className="absolute -left-[60px] top-0 text-[11px] text-slate-500 opacity-0 transition-opacity duration-300 whitespace-nowrap w-[50px] text-right group-hover:opacity-100">
            {formatTime(message.timestamp)}
          </span>
        )}

        {message.replyTo && (
          <div className="flex items-center gap-2 px-3 py-2 mb-2 border-l-[3px] border-l-indigo-500 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 rounded-xl text-sm text-slate-400 shadow-sm">
            <svg
              className="w-4 h-4 text-indigo-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
              />
            </svg>
            <span className="font-semibold text-indigo-400">
              {message.replyTo.username}
            </span>
            <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-slate-500">
              {message.replyTo.message}
            </span>
          </div>
        )}

        {isEditing ? (
          <div className="flex flex-col gap-1">
            <input
              id={`edit-message-${message.id}`}
              type="text"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyPress}
              onBlur={handleEdit}
              className="w-full px-3 py-2.5 bg-slate-900/60 border border-indigo-500/40 rounded-xl text-sm text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Edit message..."
              aria-label="Edit message"
              autoFocus
            />
            <span className="text-[11px] text-slate-500 italic">
              Nhấn Enter để lưu, Esc để hủy
            </span>
          </div>
        ) : (
          <>
            <div className="text-[15px] leading-relaxed text-slate-200 wrap-break-word whitespace-pre-wrap tracking-normal font-medium [&_strong]:font-bold [&_em]:italic [&_.inline-code]:bg-slate-800/60 [&_.inline-code]:px-1.5 [&_.inline-code]:py-0.5 [&_.inline-code]:rounded-md [&_.inline-code]:font-mono [&_.inline-code]:text-sm [&_.inline-code]:text-indigo-300 [&_.mention]:bg-gradient-to-r [&_.mention]:from-indigo-600 [&_.mention]:to-violet-600 [&_.mention]:text-white [&_.mention]:px-2 [&_.mention]:py-0.5 [&_.mention]:rounded-md [&_.mention]:font-semibold [&_.mention]:cursor-pointer [&_.mention]:shadow-sm">
              {formatMessage(message.message)}
            </div>
            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="flex flex-col gap-2 mt-2">
                {message.attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="rounded overflow-hidden max-w-[400px]"
                  >
                    {att.mimeType.startsWith("image/") ? (
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block cursor-pointer"
                      >
                        <img
                          src={att.url}
                          alt={att.originalName}
                          className="max-w-full max-h-[300px] rounded object-contain block"
                        />
                      </a>
                    ) : (
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-3 py-3 bg-slate-900/50 border border-slate-800 rounded-xl no-underline text-slate-200 transition-colors duration-200 hover:bg-slate-800/50 hover:border-indigo-500/30"
                      >
                        <span className="text-2xl shrink-0">📎</span>
                        <div className="flex-1 flex flex-col gap-1 min-w-0">
                          <span className="font-medium text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                            {att.originalName}
                          </span>
                          <span className="text-xs text-slate-500">
                            {(att.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {message.reactions.map((reaction, idx) => (
              <button
                key={idx}
                className={`flex items-center gap-1 px-2.5 py-1 bg-slate-900/50 border border-slate-800 rounded-xl cursor-pointer transition-all duration-200 text-sm hover:bg-slate-800/50 hover:border-indigo-500/30 active:scale-95 ${
                  reaction.users.includes(currentUserId || "")
                    ? "bg-indigo-600/20 border-indigo-500/40 text-slate-100 shadow-sm"
                    : ""
                }`}
                onClick={() => onReact?.(message.id, reaction.emoji)}
                title={
                  reaction.users.length > 0
                    ? `${reaction.users.length} người`
                    : ""
                }
              >
                <span className="text-base">{reaction.emoji}</span>
                {reaction.users.length > 0 && (
                  <span className="text-xs font-semibold">
                    {reaction.users.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Action buttons (show on hover) */}
        {showActions && !isEditing && (
          <div className="flex items-center gap-1 mt-2 px-2 py-1.5 bg-slate-900/70 border border-slate-800 rounded-xl shadow-lg animate-[fadeIn_0.2s_ease-out]">
            {commonReactions.map((emoji) => (
              <button
                key={emoji}
                className="px-2.5 py-1.5 bg-transparent border-none rounded-lg cursor-pointer text-[13px] text-slate-300 transition-all duration-200 flex items-center gap-1.5 font-medium hover:bg-slate-800 hover:text-slate-100 active:scale-95"
                onClick={() => onReact?.(message.id, emoji)}
                title={`Thêm ${emoji}`}
              >
                {emoji}
              </button>
            ))}
            {onReply && (
              <button
                className="px-2.5 py-1.5 bg-transparent border-none rounded-lg cursor-pointer text-[13px] text-slate-300 transition-all duration-200 flex items-center gap-1.5 font-medium hover:bg-slate-800 hover:text-slate-100 active:scale-95"
                onClick={() => onReply(message.id)}
                title="Trả lời"
              >
                ↩ Trả lời
              </button>
            )}
            {isOwnMessage && onEdit && (
              <button
                className="px-2.5 py-1.5 bg-transparent border-none rounded-lg cursor-pointer text-[13px] text-slate-300 transition-all duration-200 flex items-center gap-1.5 font-medium hover:bg-slate-800 hover:text-slate-100 active:scale-95"
                onClick={() => setIsEditing(true)}
                title="Chỉnh sửa"
              >
                ✏️ Chỉnh sửa
              </button>
            )}
            {isOwnMessage && onDelete && (
              <button
                className="px-2.5 py-1.5 bg-transparent border-none rounded-lg cursor-pointer text-[13px] text-red-300 transition-all duration-200 flex items-center gap-1.5 font-medium hover:bg-red-500/15 hover:text-red-200 active:scale-95"
                onClick={() => onDelete(message.id)}
                title="Xóa"
              >
                🗑️ Xóa
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageItem;
