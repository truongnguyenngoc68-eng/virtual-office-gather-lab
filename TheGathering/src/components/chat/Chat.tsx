import { useMemo, useState } from "react";
import { useSocket } from "../../contexts/SocketContext";
import { useChat } from "../../contexts/ChatContext";
import { useWebRTC } from "../../contexts/WebRTCContext";
import { getNearbyUsers } from "../../utils";
import { useAutoScroll } from "../../hooks/useAutoScroll";

const Chat = () => {
  const { users, currentUser } = useSocket();
  const {
    isOpen,
    toggleChat,
    activeTab,
    setActiveTab,
    messages,
    sendMessage,
    dmTarget,
    setDmTarget,
    groupChats,
    selectedGroupId,
    setSelectedGroupId,
    createGroupChat,
    isHistoryLoading,
  } = useChat();
  const [inputMessage, setInputMessage] = useState("");
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const messagesEndRef = useAutoScroll(messages);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const nearbyUsers = useMemo(() => {
    return getNearbyUsers(users, currentUser, 200);
  }, [users, currentUser]);

  const handleSend = () => {
    if (!inputMessage.trim()) return;
    if (activeTab === "dm" && !dmTarget) return;
    sendMessage(inputMessage);
    setInputMessage("");
  };

  // Check if video chat is visible
  const { localStream, peers } = useWebRTC();
  const hasVideoChat = localStream || peers.size > 0;

  // Check if there are nearby users for video (reuse nearbyUsers calculation)
  const isVideoChatVisible = hasVideoChat || nearbyUsers.length > 0;

  return (
    <>
      {!isOpen && (
        <button
          className={`fixed bottom-[100px] w-[50px] h-[50px] rounded-full bg-blue-600 text-white border-none text-2xl cursor-pointer shadow-lg z-[100] transition-all duration-200 hover:scale-110 ${
            !isVideoChatVisible ? "right-[480px]" : "right-[440px]"
          }`}
          onClick={toggleChat}
        >
          💬
        </button>
      )}

      {isOpen && (
        <div
          className={`fixed bottom-[100px] ${
            !isVideoChatVisible ? "right-5" : "right-[360px]"
          } w-[400px] h-[500px] bg-white rounded-xl shadow-2xl flex flex-col z-[100] transition-all duration-300`}
        >
          <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
            <div className="flex gap-2">
              <button
                className={`px-4 py-2 border-none rounded-md cursor-pointer text-sm font-medium transition-all duration-200 ${
                  activeTab === "nearby"
                    ? "bg-blue-600 text-white"
                    : "bg-transparent text-gray-500 hover:bg-gray-200"
                }`}
                onClick={() => setActiveTab("nearby")}
              >
                Nearby ({nearbyUsers.length})
              </button>
              <button
                className={`px-4 py-2 border-none rounded-md cursor-pointer text-sm font-medium transition-all duration-200 ${
                  activeTab === "global"
                    ? "bg-blue-600 text-white"
                    : "bg-transparent text-gray-500 hover:bg-gray-200"
                }`}
                onClick={() => setActiveTab("global")}
              >
                Global
              </button>
              <button
                className={`px-4 py-2 border-none rounded-md cursor-pointer text-sm font-medium transition-all duration-200 ${
                  activeTab === "dm"
                    ? "bg-blue-600 text-white"
                    : "bg-transparent text-gray-500 hover:bg-gray-200"
                }`}
                onClick={() => setActiveTab("dm")}
              >
                DM
              </button>
              <button
                className={`px-4 py-2 border-none rounded-md cursor-pointer text-sm font-medium transition-all duration-200 ${
                  activeTab === "group"
                    ? "bg-blue-600 text-white"
                    : "bg-transparent text-gray-500 hover:bg-gray-200"
                }`}
                onClick={() => {
                  setActiveTab("group");
                  if (groupChats.length > 0 && !selectedGroupId) {
                    setSelectedGroupId(groupChats[0].id);
                  }
                }}
              >
                Group ({groupChats.length})
              </button>
            </div>
            <button
              className="w-6 h-6 border-none bg-transparent cursor-pointer text-xl text-gray-500 hover:text-gray-800"
              onClick={toggleChat}
            >
              ✕
            </button>
          </div>

          {/* Show group members when in global chat */}
          {activeTab === "global" && (
            <div className="border-b border-gray-200 bg-gray-50 max-h-[150px] overflow-y-auto">
              <div className="px-4 py-3 border-b border-gray-200 bg-white">
                <span className="text-sm font-semibold text-gray-700">
                  👥 Thành viên trong phòng ({users.length})
                </span>
              </div>
              <div className="p-2 flex flex-col gap-1">
                {users.map((user) => (
                  <div
                    key={user.userId}
                    className={`flex items-center gap-2 px-2 py-2 rounded-md transition-colors duration-200 ${
                      user.userId === currentUser?.userId
                        ? "bg-blue-50"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-xs shrink-0">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-700 flex-1">
                      {user.username}
                      {user.userId === currentUser?.userId && " (Bạn)"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "group" && (
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
              <div className="flex gap-2 items-center">
                <select
                  value={selectedGroupId || ""}
                  onChange={(e) => setSelectedGroupId(e.target.value || null)}
                  className="flex-1 px-2 py-2 border border-gray-300 rounded-md text-sm"
                  title="Chọn group chat"
                  aria-label="Chọn group chat"
                >
                  <option value="">Chọn group chat</option>
                  {groupChats.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name} ({group.members.length} thành viên)
                    </option>
                  ))}
                </select>
                <button
                  className="w-8 h-8 border-none bg-blue-600 text-white rounded-md text-xl cursor-pointer flex items-center justify-center transition-colors duration-200 hover:bg-blue-700"
                  onClick={() => setShowCreateGroupModal(true)}
                  title="Tạo group chat mới"
                >
                  +
                </button>
              </div>
              {selectedGroupId && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {groupChats
                    .find((g) => g.id === selectedGroupId)
                    ?.members.map((memberId) => {
                      const member = users.find((u) => u.userId === memberId);
                      if (!member) return null;
                      return (
                        <div
                          key={memberId}
                          className="flex items-center gap-1 px-2 py-1 bg-gray-200 rounded-xl text-xs"
                        >
                          <div className="w-[18px] h-[18px] rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-[10px]">
                            {member.username.charAt(0).toUpperCase()}
                          </div>
                          <span>{member.username}</span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {activeTab === "dm" && (
            <div className="px-4 py-3 border-b border-gray-200">
              <select
                value={dmTarget || ""}
                onChange={(e) => setDmTarget(e.target.value)}
                className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm"
                title="Chọn người nhận tin nhắn"
                aria-label="Chọn người nhận tin nhắn"
              >
                <option value="">Chọn người nhận</option>
                {users
                  .filter((u) => u.userId !== currentUser?.userId)
                  .map((user) => (
                    <option key={user.userId} value={user.userId}>
                      {user.username}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 bg-gray-100">
            {isHistoryLoading && messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-500">
                <div className="w-10 h-10 border-[3px] border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                <p>Đang tải lịch sử...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 px-8 text-center text-gray-500">
                <div
                  className="text-[3.5rem] mb-4 opacity-60"
                  style={{ animation: "float 3s ease-in-out infinite" }}
                >
                  💬
                </div>
                <h3 className="text-lg font-semibold text-gray-800 m-0 mb-2">
                  {activeTab === "dm" && !dmTarget
                    ? "Chọn người nhận để bắt đầu chat"
                    : activeTab === "dm"
                    ? "Chưa có tin nhắn nào"
                    : "Chưa có tin nhắn nào"}
                </h3>
                <p className="text-sm text-gray-400 m-0 mb-6 max-w-[350px]">
                  {activeTab === "dm" && dmTarget
                    ? "Bắt đầu cuộc trò chuyện với người này!"
                    : activeTab === "dm"
                    ? "Chọn một người từ danh sách để bắt đầu chat"
                    : "Gửi tin nhắn đầu tiên để bắt đầu cuộc trò chuyện"}
                </p>
                {activeTab === "dm" && !dmTarget && (
                  <button
                    className="px-5 py-2.5 bg-[#5865f2] text-white border-none rounded text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-[#4752c4] hover:-translate-y-px"
                    onClick={() => setActiveTab("users")}
                  >
                    Chọn người nhận
                  </button>
                )}
              </div>
            ) : (
              <>
                {messages.map((msg) => {
                  const isOwnMessage = msg.userId === currentUser?.userId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2 mb-2 ${
                        isOwnMessage ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      {!isOwnMessage && (
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm shrink-0">
                          {msg.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div
                        className={`flex flex-col gap-1 max-w-[70%] min-w-[100px] ${
                          isOwnMessage ? "items-end" : "items-start"
                        }`}
                      >
                        {!isOwnMessage && (
                          <div className="text-xs font-semibold text-gray-500 px-2 mb-1">
                            {msg.username}
                          </div>
                        )}
                        <div
                          className={`px-3 py-2 rounded-xl relative break-words flex flex-col gap-1 ${
                            isOwnMessage
                              ? "bg-blue-600 text-white rounded-br-sm"
                              : "bg-gray-200 text-gray-900 rounded-bl-sm"
                          }`}
                        >
                          <div className="break-words leading-relaxed text-[15px]">
                            {msg.message}
                          </div>
                          <div
                            className={`text-[11px] opacity-70 self-end mt-0.5 ${
                              isOwnMessage ? "text-white/80" : "text-gray-500"
                            }`}
                          >
                            {new Date(msg.timestamp).toLocaleTimeString(
                              "vi-VN",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          <div className="flex gap-2 p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                activeTab === "dm" && !dmTarget
                  ? "Chọn người nhận trước"
                  : activeTab === "group" && !selectedGroupId
                  ? "Chọn hoặc tạo group chat"
                  : "Nhập tin nhắn..."
              }
              className="flex-1 px-3 py-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-600"
              disabled={
                (activeTab === "dm" && !dmTarget) ||
                (activeTab === "group" && !selectedGroupId)
              }
            />
            <button
              onClick={handleSend}
              className="px-6 py-3 bg-blue-600 text-white border-none rounded-md font-semibold cursor-pointer transition-colors duration-200 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={
                !inputMessage.trim() ||
                (activeTab === "dm" && !dmTarget) ||
                (activeTab === "group" && !selectedGroupId)
              }
            >
              Gửi
            </button>
          </div>

          {/* Create Group Modal */}
          {showCreateGroupModal && (
            <div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
              onClick={() => setShowCreateGroupModal(false)}
            >
              <div
                className="bg-white rounded-xl w-[90%] max-w-[500px] max-h-[80vh] flex flex-col shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                  <h3 className="m-0 text-xl font-semibold">Tạo Group Chat</h3>
                  <button
                    className="w-8 h-8 border-none bg-transparent cursor-pointer text-2xl text-gray-500 flex items-center justify-center hover:text-gray-800"
                    onClick={() => setShowCreateGroupModal(false)}
                  >
                    ✕
                  </button>
                </div>
                <div className="p-6 overflow-y-auto flex-1">
                  <div className="mb-6">
                    <label className="block mb-2 font-medium text-gray-700">
                      Tên group:
                    </label>
                    <input
                      type="text"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="Nhập tên group..."
                      className="w-full px-3 py-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div className="mb-6">
                    <label className="block mb-2 font-medium text-gray-700">
                      Chọn thành viên:
                    </label>
                    <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto">
                      {users
                        .filter((u) => u.userId !== currentUser?.userId)
                        .map((user) => (
                          <label
                            key={user.userId}
                            className="flex items-center gap-3 px-2 py-2 rounded-md cursor-pointer transition-colors duration-200 hover:bg-gray-100"
                          >
                            <input
                              type="checkbox"
                              checked={selectedMembers.includes(user.userId)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedMembers([
                                    ...selectedMembers,
                                    user.userId,
                                  ]);
                                } else {
                                  setSelectedMembers(
                                    selectedMembers.filter(
                                      (id) => id !== user.userId
                                    )
                                  );
                                }
                              }}
                              className="cursor-pointer"
                            />
                            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-xs shrink-0">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                            <span>{user.username}</span>
                          </label>
                        ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                  <button
                    className="px-6 py-3 bg-gray-100 text-gray-700 border-none rounded-md font-semibold cursor-pointer transition-all duration-200 hover:bg-gray-200"
                    onClick={() => {
                      setShowCreateGroupModal(false);
                      setNewGroupName("");
                      setSelectedMembers([]);
                    }}
                  >
                    Hủy
                  </button>
                  <button
                    className="px-6 py-3 bg-blue-600 text-white border-none rounded-md font-semibold cursor-pointer transition-all duration-200 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => {
                      if (newGroupName.trim() && selectedMembers.length > 0) {
                        createGroupChat(newGroupName.trim(), selectedMembers);
                        setShowCreateGroupModal(false);
                        setNewGroupName("");
                        setSelectedMembers([]);
                      }
                    }}
                    disabled={
                      !newGroupName.trim() || selectedMembers.length === 0
                    }
                  >
                    Tạo Group
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Chat;
