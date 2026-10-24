import { useState } from "react";
import { useSocket } from "../contexts/SocketContext";

interface ReactionPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const REACTIONS = [
  "👍",
  "❤️",
  "😂",
  "😮",
  "😢",
  "😡",
  "👏",
  "🎉",
  "🔥",
  "💯",
  "👋",
  "🙏",
  "😊",
  "😎",
  "🤔",
  "😴",
  "🤗",
  "😱",
  "🎵",
  "☕",
  "🍕",
  "🎮",
  "💡",
  "✨",
];

const ReactionPanel = ({ isOpen, onClose }: ReactionPanelProps) => {
  const { socket } = useSocket();
  const [selectedCategory, setSelectedCategory] = useState<
    "all" | "people" | "objects"
  >("all");

  const handleReactionClick = (reaction: string) => {
    if (!socket) return;

    socket.emit("reaction", {
      reaction,
      timestamp: Date.now(),
    });

    console.log(`📣 Sent reaction: ${reaction}`);
    onClose();
  };

  const filteredReactions = () => {
    if (selectedCategory === "all") return REACTIONS;
    if (selectedCategory === "people") {
      return REACTIONS.filter((r, i) => i < 18); // First 18 are people-related
    }
    return REACTIONS.filter((r, i) => i >= 18); // Last 6 are objects
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-[999] animate-[fadeIn_0.2s_ease]"
        onClick={onClose}
      />
      <div className="fixed bottom-[100px] right-5 w-[340px] max-h-[480px] bg-white/98 dark:bg-[rgba(30,30,30,0.98)] backdrop-blur-[20px] rounded-2xl border border-black/10 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.3)] z-[1000] flex flex-col overflow-hidden animate-[slideUp_0.3s_cubic-bezier(0.4,0,0.2,1)] max-md:bottom-20 max-md:right-2.5 max-md:left-2.5 max-md:w-auto">
        <div className="flex items-center justify-between px-[18px] py-3.5 border-b border-black/10 dark:border-white/10">
          <h3 className="m-0 text-[15px] font-semibold text-black/90 dark:text-white/95 tracking-tight">
            Send Reaction
          </h3>
          <button
            className="bg-none border-none text-2xl text-black/50 dark:text-white/60 cursor-pointer p-0 w-7 h-7 flex items-center justify-center rounded-md transition-all leading-none hover:bg-black/10 dark:hover:bg-white/10 hover:text-black/90 dark:hover:text-white/95"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="flex gap-1.5 px-[18px] py-2.5 border-b border-black/10 dark:border-white/10">
          <button
            className={`flex-1 px-2.5 py-1.5 bg-black/5 dark:bg-white/5 border-none rounded-lg text-black/60 dark:text-white/70 text-xs font-medium cursor-pointer transition-all ${
              selectedCategory === "all"
                ? "bg-indigo-600 text-white shadow-[0_2px_4px_rgba(88,101,242,0.3)]"
                : "hover:bg-black/10 dark:hover:bg-white/10 hover:text-black/90 dark:hover:text-white/95"
            }`}
            onClick={() => setSelectedCategory("all")}
          >
            All
          </button>
          <button
            className={`flex-1 px-2.5 py-1.5 bg-black/5 dark:bg-white/5 border-none rounded-lg text-black/60 dark:text-white/70 text-xs font-medium cursor-pointer transition-all ${
              selectedCategory === "people"
                ? "bg-indigo-600 text-white shadow-[0_2px_4px_rgba(88,101,242,0.3)]"
                : "hover:bg-black/10 dark:hover:bg-white/10 hover:text-black/90 dark:hover:text-white/95"
            }`}
            onClick={() => setSelectedCategory("people")}
          >
            🏢 Office
          </button>
          <button
            className={`flex-1 px-2.5 py-1.5 bg-black/5 dark:bg-white/5 border-none rounded-lg text-black/60 dark:text-white/70 text-xs font-medium cursor-pointer transition-all ${
              selectedCategory === "objects"
                ? "bg-indigo-600 text-white shadow-[0_2px_4px_rgba(88,101,242,0.3)]"
                : "hover:bg-black/10 dark:hover:bg-white/10 hover:text-black/90 dark:hover:text-white/95"
            }`}
            onClick={() => setSelectedCategory("objects")}
          >
            ✨ Objects
          </button>
        </div>

        <div className="grid grid-cols-6 gap-1.5 px-[18px] py-3.5 overflow-y-auto max-h-[300px] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-800 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb:hover]:bg-gray-900 dark:[&::-webkit-scrollbar-thumb:hover]:bg-gray-600 max-md:grid-cols-8">
          {filteredReactions().map((reaction, index) => (
            <button
              key={index}
              className="aspect-square bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-[10px] text-2xl cursor-pointer flex items-center justify-center transition-all hover:bg-indigo-600/10 dark:hover:bg-indigo-600/20 hover:border-indigo-600/30 hover:scale-[1.08] hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(88,101,242,0.15)] active:scale-[0.96] active:translate-y-0"
              onClick={() => handleReactionClick(reaction)}
              title={`Send ${reaction}`}
            >
              {reaction}
            </button>
          ))}
        </div>

        <div className="px-[18px] py-2.5 border-t border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 rounded-b-2xl">
          <p className="m-0 text-[11px] text-black/50 dark:text-white/60 text-center leading-tight">
            💡 Reactions will appear above your character for 3 seconds
          </p>
        </div>
      </div>
    </>
  );
};

export default ReactionPanel;
