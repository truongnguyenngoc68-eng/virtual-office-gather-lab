import { useState, useEffect } from "react";

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChannel: (name: string, type: "text" | "voice", description?: string, isPrivate?: boolean) => void;
  defaultType?: "text" | "voice";
}

const CreateChannelModal = ({
  isOpen,
  onClose,
  onCreateChannel,
  defaultType = "text",
}: CreateChannelModalProps) => {
  const [channelName, setChannelName] = useState("");
  const [channelType, setChannelType] = useState<"text" | "voice">(defaultType || "text");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  // Reset form when modal opens/closes or defaultType changes
  useEffect(() => {
    if (isOpen) {
      setChannelType(defaultType);
      setChannelName("");
      setDescription("");
      setIsPrivate(false);
    }
  }, [isOpen, defaultType]);

  // ESC to close modal
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCancel();
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelName.trim()) return;

    onCreateChannel(channelName.trim(), channelType, description.trim() || undefined, isPrivate);
    setChannelName("");
    setDescription("");
    setChannelType("text");
    setIsPrivate(false);
    onClose();
  };

  const handleCancel = () => {
    setChannelName("");
    setDescription("");
    setChannelType("text");
    setIsPrivate(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-[1000]" onClick={handleCancel}>
      <div className="bg-[#2f3136] rounded-lg w-[90%] max-w-[440px] shadow-[0_8px_32px_rgba(0,0,0,0.4)]" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-[#202225] flex items-center justify-between">
          <div>
            <h2 className="m-0 text-xl font-semibold text-[#dcddde]">Tạo kênh</h2>
            <p className="mt-1 mb-0 text-sm text-[#72767d] font-normal">trong {channelType === "text" ? "Kênh Chat" : channelType === "voice" ? "Kênh đàm thoại" : "Diễn Đàn"}</p>
          </div>
          <button className="bg-transparent border-none text-[#96989d] text-2xl cursor-pointer p-0 w-8 h-8 flex items-center justify-center rounded transition-all duration-200 hover:bg-[#3c3f44] hover:text-[#dcddde]" onClick={handleCancel}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          <div className="mb-5">
            <label htmlFor="channel-type" className="block mb-2 text-xs font-bold text-[#96989d] uppercase tracking-wider">Loại kênh</label>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                className={`px-4 py-4 bg-[#202225] border border-[#202225] rounded text-[#dcddde] cursor-pointer flex items-start gap-3 transition-all duration-200 text-left relative hover:bg-[#3c3f44] hover:border-[#5865f2] ${channelType === "text" ? "bg-[#3c3f44] border-[#5865f2]" : ""}`}
                onClick={() => setChannelType("text")}
              >
                <div className={`w-5 h-5 border-2 border-[#72767d] rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200 ${channelType === "text" ? "border-[#5865f2]" : ""}`}>
                  <div className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${channelType === "text" ? "bg-[#5865f2]" : "bg-transparent"}`}></div>
                </div>
                <span className="text-2xl shrink-0">#</span>
                <div className="flex flex-col gap-1 flex-1">
                  <span className="text-base font-semibold text-[#dcddde]">Văn bản</span>
                  <span className="text-[13px] text-[#72767d] leading-relaxed">Gửi tin nhắn, hình ảnh, ảnh GIF, emoji, ý kiến, và chơi chữ</span>
                </div>
              </button>
              <button
                type="button"
                className={`px-4 py-4 bg-[#202225] border border-[#202225] rounded text-[#dcddde] cursor-pointer flex items-start gap-3 transition-all duration-200 text-left relative hover:bg-[#3c3f44] hover:border-[#5865f2] ${channelType === "voice" ? "bg-[#3c3f44] border-[#5865f2]" : ""}`}
                onClick={() => setChannelType("voice")}
              >
                <div className={`w-5 h-5 border-2 border-[#72767d] rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200 ${channelType === "voice" ? "border-[#5865f2]" : ""}`}>
                  <div className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${channelType === "voice" ? "bg-[#5865f2]" : "bg-transparent"}`}></div>
                </div>
                <span className="text-2xl shrink-0">🔊</span>
                <div className="flex flex-col gap-1 flex-1">
                  <span className="text-base font-semibold text-[#dcddde]">Giọng nói</span>
                  <span className="text-[13px] text-[#72767d] leading-relaxed">Cùng gặp mặt bằng gọi thoại, video, và chia sẻ màn hình</span>
                </div>
              </button>
            </div>
          </div>

          <div className="mb-5">
            <label htmlFor="channel-name" className="block mb-2 text-xs font-bold text-[#96989d] uppercase tracking-wider">Tên kênh</label>
            <div className="relative flex items-center">
              <span className="absolute left-2.5 text-[#72767d] text-base font-medium pointer-events-none z-10">#</span>
            <input
              id="channel-name"
              type="text"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
                placeholder="kênh-mới"
                className="w-full px-2.5 pl-8 pr-10 py-2.5 bg-[#202225] border border-[#202225] rounded text-base text-[#dcddde] font-inherit transition-all duration-200 box-border focus:outline-none focus:border-[#5865f2] placeholder:text-[#72767d]"
              required
              maxLength={100}
            />
              <button type="button" className="absolute right-2 bg-transparent border-none text-[#72767d] text-lg cursor-pointer p-1 rounded transition-all duration-200 z-10 hover:bg-[#3c3f44] hover:text-[#dcddde]" title="Add emoji">😀</button>
            </div>
          </div>

          <div className="mb-5">
            <div className="flex gap-3 px-3 py-3 bg-[#202225] rounded border border-[#202225]">
              <div className="text-xl shrink-0">🔒</div>
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-[#dcddde]">Kênh Riêng</span>
                  <label className="relative inline-block w-11 h-6">
                    <input
                      type="checkbox"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      className="opacity-0 w-0 h-0"
                    />
                    <span className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-all duration-300 ${isPrivate ? "bg-[#5865f2]" : "bg-[#202225]"} border border-[#202225]`}>
                      <span className={`absolute content-[''] h-[18px] w-[18px] left-0.5 bottom-0.5 bg-[#72767d] rounded-full transition-all duration-300 flex items-center justify-center text-[10px] text-white ${isPrivate ? "translate-x-5 bg-white text-[#5865f2]" : ""}`}>{isPrivate ? "✓" : "✕"}</span>
                    </span>
                  </label>
                </div>
                <p className="text-[13px] text-[#72767d] leading-relaxed m-0">
                  Chỉ có thành viên và vai trò được chọn mới có thể nhìn thấy kênh này.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button type="button" className="px-4 py-2.5 bg-transparent text-[#96989d] border-none rounded text-sm font-medium cursor-pointer transition-all duration-200 hover:text-[#dcddde] hover:bg-[#3c3f44]" onClick={handleCancel}>
              Hủy bỏ
            </button>
            <button type="submit" className="px-4 py-2.5 bg-[#5865f2] text-white border-none rounded text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-[#4752c4] disabled:opacity-50 disabled:cursor-not-allowed" disabled={!channelName.trim()}>
              Tạo kênh
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateChannelModal;

