import { useEffect, useState, useMemo } from "react";
import MessageItem from "./MessageItem";
import DateSeparator from "./DateSeparator";
import SearchModal from "../modals/SearchModal";
import FileUpload from "./FileUpload";
import { useAutoScroll } from "../../hooks/useAutoScroll";

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

interface ChatAreaProps {
  channelName: string;
  channelType?: "text" | "dm";
  messages: Message[];
  currentUserId?: string;
  onSendMessage: (
    content: string,
    attachments?: Array<{
      filename: string;
      originalName: string;
      mimeType: string;
      size: number;
      url: string;
    }>
  ) => void;
  onReply?: (messageId: string, content: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onDelete?: (messageId: string) => void;
  inputPlaceholder?: string;
  typingUsers?: string[];
}

const ChatArea = ({
  channelName,
  channelType = "text",
  messages,
  currentUserId,
  onSendMessage,
  onReply,
  onReact,
  onEdit,
  onDelete,
  inputPlaceholder,
  typingUsers = [],
}: ChatAreaProps) => {
  const messagesEndRef = useAutoScroll(messages);
  const [inputValue, setInputValue] = useState("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [attachments, setAttachments] = useState<
    Array<{
      filename: string;
      originalName: string;
      mimeType: string;
      size: number;
      url: string;
    }>
  >([]);

  const handleSend = () => {
    if (!inputValue.trim() && attachments.length === 0) return;

    if (replyingTo) {
      onReply?.(replyingTo.id, inputValue);
      setReplyingTo(null);
    } else {
      onSendMessage(
        inputValue,
        attachments.length > 0 ? attachments : undefined
      );
    }
    setInputValue("");
    setAttachments([]);
  };

  const handleFileUpload = () => {
    // File is being uploaded, FileUpload component will handle it
  };

  interface FileData {
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
  }

  const handleUploadComplete = (fileUrl: string, fileData: FileData) => {
    setAttachments((prev) => [
      ...prev,
      {
        filename: fileData.filename,
        originalName: fileData.originalName,
        mimeType: fileData.mimeType,
        size: fileData.size,
        url: fileUrl,
      },
    ]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K: Open search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch(true);
      }
      // Ctrl/Cmd + F: Open search (alternative)
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key === "f" &&
        !(e.target instanceof HTMLInputElement)
      ) {
        e.preventDefault();
        setShowSearch(true);
      }
      // Escape: Close search
      if (e.key === "Escape" && showSearch) {
        setShowSearch(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showSearch]);

  // Group messages and add date separators
  const groupedMessages = useMemo(() => {
    if (messages.length === 0) return [];

    const grouped: Array<Message | { type: "date"; date: Date }> = [];
    let currentGroup: Message[] = [];
    let lastDate: Date | null = null;
    const GROUP_TIME_THRESHOLD = 5 * 60 * 1000; // 5 minutes

    messages.forEach((msg) => {
      const msgDate = new Date(msg.timestamp);
      const msgDateOnly = new Date(
        msgDate.getFullYear(),
        msgDate.getMonth(),
        msgDate.getDate()
      );

      // Add date separator if date changed
      if (!lastDate || msgDateOnly.getTime() !== lastDate.getTime()) {
        if (currentGroup.length > 0) {
          grouped.push(...currentGroup);
          currentGroup = [];
        }
        grouped.push({ type: "date", date: msgDateOnly });
        lastDate = msgDateOnly;
      }

      // Check if should group with previous message in current group
      const shouldGroup =
        currentGroup.length > 0 &&
        currentGroup[currentGroup.length - 1].userId === msg.userId &&
        msg.timestamp - currentGroup[currentGroup.length - 1].timestamp <
          GROUP_TIME_THRESHOLD;

      if (shouldGroup) {
        currentGroup.push(msg);
      } else {
        if (currentGroup.length > 0) {
          grouped.push(...currentGroup);
          currentGroup = [];
        }
        currentGroup.push(msg);
      }
    });

    if (currentGroup.length > 0) {
      grouped.push(...currentGroup);
    }

    return grouped;
  }, [messages]);

  const handleReply = (messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (message) {
      setReplyingTo(message);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#313338] overflow-hidden h-full">
      {/* Header */}
      <div className="px-4 h-12 border-b border-[#26272D] flex items-center justify-between bg-[#313338] sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2 px-2 py-1 rounded transition-colors hover:bg-[#3F4147] cursor-pointer">
          <span className="text-slate-400 text-xl font-light">#</span>
          <span className="text-white font-bold text-[15px]">{channelName}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
              <button
                className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
                title="Notifications"
                onClick={() => setShowSearch(true)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              </button>
              <button
                className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
                title="Pinned Messages"
                onClick={() => setShowSearch(true)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
              </button>
          </div>
          
          <div className="relative group">
            <input
              type="text"
              placeholder="Search"
              className="w-36 bg-[#1E1F22] rounded py-1 pl-2 pr-2 text-xs text-slate-200 transition-all focus:w-48 focus:outline-none placeholder:text-slate-400"
              onFocus={() => setShowSearch(true)}
            />
             <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
             </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-start justify-end h-full py-6 px-4 max-w-4xl mx-auto">
            <div className="w-16 h-16 rounded-full bg-[#41434A] flex items-center justify-center mb-4">
               <span className="text-4xl text-slate-200">#</span>
            </div>
            
            <h3 className="text-3xl font-bold text-white mb-2">
              Welcome to #{channelName}!
            </h3>
            <p className="text-slate-400 mb-4 text-sm">
              This is the start of the <span className="font-semibold text-slate-300">#{channelName}</span> channel.
            </p>
            
            <button
               className="text-violet-400 hover:underline text-sm font-medium"
               onClick={() => {
                 // Open channel settings
               }}
            >
              Edit Channel
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5 pb-4 mt-auto">
            {groupedMessages.map((item, index) => {
              if ("type" in item && item.type === "date") {
                return (
                  <DateSeparator
                    key={`date-${item.date.getTime()}`}
                    date={item.date}
                  />
                );
              }

              const msg = item as Message;
              const isOwnMessage = msg.userId === currentUserId;

              // Check if previous item is a message from the same user
              const prevItem = index > 0 ? groupedMessages[index - 1] : null;
              const isGrouped =
                prevItem &&
                !("type" in prevItem) &&
                (prevItem as Message).userId === msg.userId &&
                msg.timestamp - (prevItem as Message).timestamp < 5 * 60 * 1000;

              return (
                <MessageItem
                  key={msg.id}
                  message={msg}
                  isGrouped={isGrouped || false}
                  isOwnMessage={isOwnMessage}
                  currentUserId={currentUserId}
                  onReply={handleReply}
                  onReact={onReact}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              );
            })}
            
             {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-1 text-xs text-slate-400 font-bold">
                 <div className="animate-pulse">...</div>
                 <span className="text-slate-400">
                  {typingUsers.length === 1
                    ? `${typingUsers[0]} is typing...`
                    : `${typingUsers.length} people are typing...`}
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Reply Preview */}
      {replyingTo && (
        <div className="px-4 py-2 bg-[#2B2D31] border-t border-[#26272D] flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
             <div className="h-4 w-1 bg-slate-400 rounded-full shrink-0" />
             <div className="flex flex-col overflow-hidden">
                <span className="text-slate-300 text-xs font-bold">Replying to {replyingTo.username}</span>
             </div>
          </div>
          <button
            className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-black/20 text-slate-400 transition-colors"
            onClick={() => setReplyingTo(null)}
            aria-label="Cancel reply"
            title="Cancel reply"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="px-4 pb-6 pt-2 bg-[#313338]">
        {/* Attachments Preview */}
        {attachments.length > 0 && (
            <div className="flex gap-2 mb-2 overflow-x-auto pb-2 scrollbar-hide bg-[#313338]">
            {attachments.map((att, index) => (
                <div
                key={index}
                className="relative group w-32 h-32 rounded bg-[#2B2D31] overflow-hidden flex-shrink-0"
                >
                {att.mimeType.startsWith("image/") ? (
                    <img
                    src={att.url}
                    alt={att.originalName}
                    className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                    <span className="text-2xl mb-1">📄</span>
                    <span className="text-[10px] text-slate-300 line-clamp-2 break-all">
                        {att.originalName}
                    </span>
                    </div>
                )}
                <div className="absolute top-1 right-1">
                    <button
                        className="w-6 h-6 rounded bg-[#2B2D31] text-red-400 flex items-center justify-center hover:bg-[#1E1F22]"
                        onClick={() => removeAttachment(index)}
                        aria-label={`Remove attachment ${att.originalName}`}
                        title={`Remove ${att.originalName}`}
                    >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                </div>
            ))}
            </div>
        )}

        <div className="relative bg-[#383A40] rounded-lg items-center px-4 py-2.5">
           <FileUpload
            onFileSelect={handleFileUpload}
            onUploadComplete={handleUploadComplete}
            maxSize={10 * 1024 * 1024}
            acceptedTypes={["image/*", "application/pdf", "text/*"]}
          />
           
           <div className="flex items-center">
               <button 
                 className="mr-3 text-slate-400 hover:text-slate-200 transition-colors"
                 aria-label="Add attachment"
                 title="Add attachment"
               >
                   <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>
               </button>

               <input
                 type="text"
                 value={inputValue}
                 onChange={(e) => setInputValue(e.target.value)}
                 onKeyPress={handleKeyPress}
                 placeholder={
                   replyingTo
                     ? `Reply to @${replyingTo.username}...`
                     : inputPlaceholder || `Message #${channelName}`
                 }
                 className="flex-1 bg-transparent border-none outline-none text-slate-200 text-[15px] placeholder:text-slate-500 h-[24px]"
               />
               
               <div className="flex items-center gap-3 ml-3">
                   <button 
                     className="text-slate-400 hover:text-slate-200 transition-colors"
                     aria-label="Add GIF"
                     title="Add GIF"
                   >
                     <span className="font-bold text-[10px] border-2 border-current rounded px-1 py-0.5">GIF</span>
                   </button>
                   
                   <button 
                     className="text-slate-400 hover:text-slate-200 transition-colors"
                     aria-label="Add emoji"
                     title="Add emoji"
                   >
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   </button>
               </div>
           </div>
        </div>
        <div className="mt-1">
             {/* Optional typing tips or just nothing for cleaner look */}
        </div>
      </div>

      <SearchModal
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        roomId={localStorage.getItem("roomId") || "default-room"}
        channelId={channelType === "text" ? channelName : undefined}
        onMessageClick={() => {
          // TODO: scroll to message in current view
        }}
      />
    </div>
  );
};

export default ChatArea;
