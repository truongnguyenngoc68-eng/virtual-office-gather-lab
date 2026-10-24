import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MessageCircle,
  Users,
  Hash,
  Eye,
  ToggleLeft,
  ToggleRight,
  Activity,
  ArrowLeft,
  Search,
} from "lucide-react";
import { getServerUrl, getToken } from "../shared/storage";

interface AdminRoom {
  roomId: string;
  name: string;
  createdBy?: string | null;
  member_count: number;
  message_count: number;
  isActive: boolean;
  isPrivate: boolean;
  createdAt?: string;
}

interface AdminRoomMember {
  userId: string;
  username: string;
  avatar?: string;
  role: "admin" | "member";
  lastSeen?: string;
  joinedAt?: string;
  isOnline?: boolean;
}

interface AdminMessage {
  id: string;
  content: string;
  username: string;
  created_at: string;
}

export default function AdminRooms() {
  const serverUrl = getServerUrl();
  const token = getToken();

  const [rooms, setRooms] = useState<AdminRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [monitoringRoom, setMonitoringRoom] = useState<AdminRoom | null>(null);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [members, setMembers] = useState<AdminRoomMember[]>([]);
  const [addingUserId, setAddingUserId] = useState("");
  const [addingRole, setAddingRole] = useState<"member" | "admin">("member");
  const [creating, setCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomDescription, setNewRoomDescription] = useState("");
  const [newRoomPrivate, setNewRoomPrivate] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const loadAdminRooms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${serverUrl}/api/admin/rooms`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) setRooms(data.rooms || []);
    } catch (error) {
      console.error("Error loading admin rooms:", error);
    } finally {
      setLoading(false);
    }
  }, [serverUrl, token]);

  useEffect(() => {
    loadAdminRooms();
  }, [loadAdminRooms]);

  const loadRoomDetails = useCallback(async () => {
    if (!monitoringRoom) return;
    try {
      // Load messages
      const res = await fetch(
        `${serverUrl}/api/chat/history/${encodeURIComponent(monitoringRoom.roomId)}?limit=200&type=global`,
      );
      const data = await res.json();
      const mapped: AdminMessage[] = (data.messages || []).map((m: any) => ({
        id: String(m.id),
        username: String(m.username || "Unknown"),
        content: String(m.message || ""),
        created_at: new Date(Number(m.timestamp || Date.now())).toISOString(),
      }));
      setMessages(mapped);

      // Load members via admin endpoint
      const memRes = await fetch(
        `${serverUrl}/api/admin/rooms/${encodeURIComponent(monitoringRoom.roomId)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (memRes.ok) {
        const memData = await memRes.json();
        const mappedMembers: AdminRoomMember[] = (memData.members || []).map(
          (m: any) => ({
            userId: String(m.userId),
            username: String(m.username || "Unknown"),
            avatar: m.avatar || "",
            role: (m.role === "admin" ? "admin" : "member") as "admin" | "member",
            lastSeen: m.lastSeen,
            joinedAt: m.joinedAt,
            isOnline: !!m.isOnline,
          }),
        );
        setMembers(mappedMembers);
      }
    } catch {
      console.error("Error loading room details");
    }
  }, [monitoringRoom, serverUrl, token]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (monitoringRoom) {
      loadRoomDetails();
      interval = setInterval(loadRoomDetails, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [monitoringRoom, loadRoomDetails]);

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) {
      alert("Room name is required");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(`${serverUrl}/api/admin/rooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newRoomName,
          description: newRoomDescription,
          isPrivate: newRoomPrivate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create room");
      setRooms((prev) => [
        {
          roomId: data.room.roomId,
          name: data.room.name,
          createdBy: data.room.createdBy,
          member_count: 0,
          message_count: 0,
          isActive: data.room.isActive,
          isPrivate: data.room.isPrivate,
          createdAt: data.room.createdAt,
        },
        ...prev,
      ]);
      setNewRoomName("");
      setNewRoomDescription("");
      setNewRoomPrivate(false);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteRoom = async (room: AdminRoom) => {
    if (!window.confirm(`Delete room "${room.name}"? This will remove all messages.`)) {
      return;
    }
    try {
      const res = await fetch(
        `${serverUrl}/api/admin/rooms/${encodeURIComponent(room.roomId)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete room");
      setRooms((prev) => prev.filter((r) => r.roomId !== room.roomId));
      if (monitoringRoom?.roomId === room.roomId) {
        setMonitoringRoom(null);
        setMessages([]);
        setMembers([]);
      }
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleAddMember = async () => {
    const trimmed = addingUserId.trim();
    if (!monitoringRoom || !trimmed) return;
    try {
      const res = await fetch(
        `${serverUrl}/api/admin/rooms/${encodeURIComponent(
          monitoringRoom.roomId,
        )}/members`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId: trimmed, role: addingRole }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add member");
      const m = data.member;
      setMembers((prev) => [
        ...prev,
        {
          userId: String(m.userId),
          username: String(m.username || "Unknown"),
          avatar: m.avatar || "",
          role: (m.role === "admin" ? "admin" : "member") as "admin" | "member",
          lastSeen: m.lastSeen,
          joinedAt: m.joinedAt,
          isOnline: !!m.isOnline,
        },
      ]);
      setAddingUserId("");
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleRemoveMember = async (member: AdminRoomMember) => {
    if (!monitoringRoom) return;
    if (
      !window.confirm(
        `Remove ${member.username} (${member.userId}) from room "${monitoringRoom.name}"?`,
      )
    ) {
      return;
    }
    try {
      const res = await fetch(
        `${serverUrl}/api/admin/rooms/${encodeURIComponent(
          monitoringRoom.roomId,
        )}/members/${encodeURIComponent(member.userId)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to remove member");
      setMembers((prev) => prev.filter((m) => m.userId !== member.userId));
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleToggleStatus = async (room: AdminRoom) => {
    try {
      const newStatus = !room.isActive;
      const res = await fetch(
        `${serverUrl}/api/spaces/${encodeURIComponent(room.roomId)}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isActive: newStatus }),
        },
      );
      if (!res.ok) throw new Error("Failed");
      setRooms((prev) =>
        prev.map((r) => (r.roomId === room.roomId ? { ...r, isActive: newStatus } : r)),
      );
    } catch {
      alert("Failed to update room status");
    }
  };

  const filteredRooms = useMemo(() => {
    const t = searchTerm.trim().toLowerCase();
    if (!t) return rooms;
    return rooms.filter(
      (r) =>
        r.name.toLowerCase().includes(t) || r.roomId.toLowerCase().includes(t),
    );
  }, [rooms, searchTerm]);

  const stats = useMemo(() => {
    return {
      totalRooms: rooms.length,
      activeRooms: rooms.filter((r) => r.isActive).length,
      totalMessages: rooms.reduce((acc, r) => acc + Number(r.message_count || 0), 0),
    };
  }, [rooms]);

  if (monitoringRoom) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <button
          onClick={() => setMonitoringRoom(null)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          Back to Management
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr,minmax(260px,1fr)] gap-6">
          {/* Messages */}
          <div className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm flex flex-col h-[600px]">
            <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Hash size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 leading-none mb-1">
                    Monitoring: {monitoringRoom.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium font-mono">
                    #{monitoringRoom.roomId}
                  </p>
                </div>
              </div>
              <div className="px-4 py-2 bg-amber-50 text-amber-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-amber-100">
                Live Chat Stream
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                  <MessageCircle size={48} className="mb-4" />
                  <p className="font-bold">No activity in this room</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="flex gap-4">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs shrink-0">
                      {msg.username[0]?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-bold text-slate-900">
                          {msg.username}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Members panel */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col h-[600px]">
            <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-teal-50 text-teal-600 rounded-2xl">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 leading-none mb-1">
                    Room members
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {members.length} thành viên
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-b border-slate-50 space-y-3">
              <div className="flex gap-2">
                <input
                  value={addingUserId}
                  onChange={(e) => setAddingUserId(e.target.value)}
                  placeholder="User ID..."
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-teal-500"
                />
                <select
                  value={addingRole}
                  onChange={(e) =>
                    setAddingRole(e.target.value === "admin" ? "admin" : "member")
                  }
                  className="px-2 py-2 rounded-xl bg-slate-50 text-xs font-bold uppercase tracking-widest text-slate-600 outline-none"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button
                onClick={handleAddMember}
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black uppercase tracking-widest transition-colors"
              >
                Add to room
              </button>
              <p className="text-[11px] text-slate-400">
                Dán <span className="font-mono font-semibold">userId</span> từ trang Users
                vào đây để thêm nhanh vào phòng.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {members.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-300 text-xs font-bold uppercase tracking-widest">
                  No members
                </div>
              ) : (
                members.map((m) => (
                  <div
                    key={m.userId}
                    className="flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-slate-50"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 overflow-hidden">
                      {m.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={m.avatar}
                          alt={m.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        (m.username[0] || "U").toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900 truncate">
                          {m.username}
                        </span>
                        <span
                          className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                            m.role === "admin"
                              ? "bg-purple-50 text-purple-600"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {m.role}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 ${
                            m.isOnline ? "text-emerald-500" : "text-slate-400"
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {m.isOnline ? "Online" : "Offline"}
                        </span>
                        {m.lastSeen && (
                          <span>
                            Last seen:{" "}
                            {new Date(m.lastSeen).toLocaleTimeString(undefined, {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">
                        {m.userId}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveMember(m)}
                      className="text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl px-2 py-1 font-bold uppercase tracking-widest"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-4xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Hash size={24} />
            </div>
            <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">
              Total Rooms
            </span>
          </div>
          <p className="text-4xl font-black text-slate-900">{stats.totalRooms}</p>
        </div>

        <div className="bg-white p-6 rounded-4xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl">
              <Activity size={24} />
            </div>
            <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">
              Active Rooms
            </span>
          </div>
          <p className="text-4xl font-black text-slate-900">{stats.activeRooms}</p>
        </div>

        <div className="bg-white p-6 rounded-4xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
              <MessageCircle size={24} />
            </div>
            <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">
              Total Messages
            </span>
          </div>
          <p className="text-4xl font-black text-slate-900">
            {stats.totalMessages}
          </p>
        </div>
      </div>

      {/* Management Section */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-xl font-black text-slate-900">Room Management</h3>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name or id..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-50 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 transition-all w-full sm:w-64"
              />
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            </div>
          </div>

          {/* Quick create room */}
          <div className="grid grid-cols-1 md:grid-cols-[2fr,auto] gap-3 items-center">
            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                placeholder="New room name..."
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-teal-500"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newRoomDescription}
                onChange={(e) => setNewRoomDescription(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-teal-500"
              />
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
                <input
                  type="checkbox"
                  checked={newRoomPrivate}
                  onChange={(e) => setNewRoomPrivate(e.target.checked)}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                Private
              </label>
            </div>
            <button
              onClick={handleCreateRoom}
              disabled={creating}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-widest"
            >
              {creating ? "Creating..." : "Create room"}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Room
                </th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Creator
                </th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                  Stats
                </th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Status
                </th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-8 py-4">
                      <div className="h-12 bg-slate-50 rounded-xl" />
                    </td>
                  </tr>
                ))
              ) : filteredRooms.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-8 py-12 text-center text-slate-400 font-bold"
                  >
                    No rooms found
                  </td>
                </tr>
              ) : (
                filteredRooms.map((room) => (
                  <tr
                    key={room.roomId}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                          {room.name?.[0] || "R"}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">
                            {room.name}
                          </div>
                          <div className="text-xs text-indigo-500 font-mono">
                            #{room.roomId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-sm font-medium text-slate-600 font-mono">
                        {room.createdBy ? room.createdBy.slice(0, 10) : "—"}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-center gap-4 text-slate-400">
                        <div className="flex items-center gap-1.5" title="Members">
                          <Users size={14} />
                          <span className="text-xs font-bold">
                            {room.member_count}
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-1.5"
                          title="Messages"
                        >
                          <MessageCircle size={14} />
                          <span className="text-xs font-bold">
                            {room.message_count}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                          room.isActive
                            ? "bg-teal-50 text-teal-600 border-teal-100"
                            : "bg-rose-50 text-rose-600 border-rose-100"
                        }`}
                      >
                        {room.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleStatus(room)}
                          className={`p-2 rounded-xl transition-all ${
                            room.isActive
                              ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              : "text-slate-400 hover:text-teal-600 hover:bg-teal-50"
                          }`}
                          title={room.isActive ? "Disable Room" : "Enable Room"}
                        >
                          {room.isActive ? (
                            <ToggleRight size={24} />
                          ) : (
                            <ToggleLeft size={24} />
                          )}
                        </button>
                        <button
                          onClick={() => setMonitoringRoom(room)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                          title="Monitor Room Activity"
                        >
                          <Eye size={20} />
                        </button>
                        <button
                          onClick={() => handleDeleteRoom(room)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                          title="Delete Room"
                        >
                          ×
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

