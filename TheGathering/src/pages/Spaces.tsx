import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";

interface SavedRoom {
  id: string;
  name: string;
  lastJoined: number;
}

interface ServerRoom {
  roomId: string;
  name: string;
  description?: string;
  maxUsers?: number;
  isPrivate?: boolean;
  createdBy?: string | null;
}

const Spaces = () => {
  const [rooms, setRooms] = useState<SavedRoom[]>([]);
  const [serverRooms, setServerRooms] = useState<ServerRoom[]>([]);
  const [loadingServer, setLoadingServer] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newRoom, setNewRoom] = useState({ roomId: "", name: "", isPrivate: false });
  const navigate = useNavigate();
  const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:5001";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/", { replace: true });
      return;
    }
    const stored = localStorage.getItem("savedRooms");
    if (stored) {
      try {
        setRooms(JSON.parse(stored));
      } catch (error) {
        console.error("Failed to parse saved rooms", error);
      }
    }

    // Load rooms from server (mine)
    (async () => {
      setLoadingServer(true);
      try {
        const res = await fetch(`${serverUrl}/api/spaces?mine=1`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setServerRooms(data.rooms || []);
        } else {
          console.warn("Failed to load server rooms:", data.message || res.status);
          setServerRooms([]);
        }
      } catch (e) {
        console.warn("Failed to load server rooms:", e);
        setServerRooms([]);
      } finally {
        setLoadingServer(false);
      }
    })();
  }, [navigate, serverUrl]);

  const handleJoinRoom = (room: SavedRoom) => {
    localStorage.setItem("roomId", room.id);
    localStorage.setItem("roomName", room.name);
    navigate(`/setup/${encodeURIComponent(room.id)}`);
  };

  const handleJoinServerRoom = (room: ServerRoom) => {
    localStorage.setItem("roomId", room.roomId);
    localStorage.setItem("roomName", room.name);
    navigate(`/setup/${encodeURIComponent(room.roomId)}`);
  };

  const handleCreateNew = () => {
    navigate("/lobby");
  };

  const refreshServerRooms = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoadingServer(true);
    try {
      const res = await fetch(`${serverUrl}/api/spaces?mine=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setServerRooms(data.rooms || []);
    } finally {
      setLoadingServer(false);
    }
  };

  const handleCreateServerRoom = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    if (!newRoom.name.trim()) {
      alert("Vui lòng nhập tên phòng");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(`${serverUrl}/api/spaces`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          roomId: newRoom.roomId.trim() || undefined,
          name: newRoom.name.trim(),
          isPrivate: newRoom.isPrivate,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Không thể tạo phòng");
      setNewRoom({ roomId: "", name: "", isPrivate: false });
      await refreshServerRooms();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteServerRoom = async (roomId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    if (!confirm(`Xóa room "${roomId}"? Hành động này không thể hoàn tác.`)) return;
    try {
      const res = await fetch(`${serverUrl}/api/spaces/${encodeURIComponent(roomId)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Không thể xóa room");
      // Also remove from recent list
      setRooms((prev) => {
        const next = prev.filter((r) => r.id !== roomId);
        localStorage.setItem("savedRooms", JSON.stringify(next));
        return next;
      });
      await refreshServerRooms();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userName");
    localStorage.removeItem("userAvatar");
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen py-12 px-16 bg-gradient-to-br from-indigo-50 to-pink-50 font-['Inter',sans-serif] max-md:px-6 max-md:py-8">
      <header className="flex justify-between items-start gap-8 mb-8 max-md:flex-col">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors font-medium text-sm"
          >
            <Home size={18} />
            Trở về Trang chủ
          </button>
          <div>
            <p className="uppercase tracking-wider text-indigo-600 font-semibold mb-2">Your spaces</p>
            <h1 className="text-4xl font-extrabold m-0 mb-2 text-gray-900">Chọn một không gian để tiếp tục</h1>
            <p className="m-0 text-gray-600">Quản lý phòng trên server và danh sách phòng gần đây trên máy bạn.</p>
          </div>
        </div>
        <div className="flex gap-3 max-md:w-full max-md:flex-col">
          <button className="px-6 py-3 border-none rounded-[10px] bg-gray-900 text-white font-semibold cursor-pointer transition-opacity hover:opacity-90" onClick={handleCreateNew}>
            + Tạo / Tham gia phòng mới
          </button>
          <button className="px-6 py-3 rounded-[10px] border border-gray-300 bg-white font-semibold cursor-pointer transition-colors hover:border-red-500 hover:text-red-500" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </header>

      {/* Server rooms management */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_20px_40px_rgba(15,23,42,0.08)] p-8 mb-10">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <h2 className="m-0 text-2xl font-extrabold text-gray-900">Rooms trên server</h2>
            <p className="m-0 mt-2 text-gray-600 text-sm">
              Tạo / xóa room (cần đăng nhập). Danh sách này đồng bộ theo tài khoản.
            </p>
          </div>
          <button
            className="px-4 py-2 rounded-xl border border-gray-200 bg-white font-semibold cursor-pointer hover:border-indigo-400 hover:text-indigo-600 transition-colors"
            onClick={refreshServerRooms}
            disabled={loadingServer}
          >
            {loadingServer ? "Đang tải..." : "Làm mới"}
          </button>
        </div>

        <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
          <div className="p-5 rounded-2xl border border-dashed border-gray-200 bg-gradient-to-br from-indigo-50 to-pink-50">
            <h3 className="m-0 text-lg font-bold text-gray-900">Tạo room mới</h3>
            <p className="m-0 mt-1 text-xs text-gray-600">Room ID để trống sẽ tự sinh.</p>
            <div className="mt-4 flex flex-col gap-3">
              <input
                value={newRoom.name}
                onChange={(e) => setNewRoom((p) => ({ ...p, name: e.target.value }))}
                placeholder="Tên room (vd: Team Daily)"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none"
              />
              <input
                value={newRoom.roomId}
                onChange={(e) => setNewRoom((p) => ({ ...p, roomId: e.target.value }))}
                placeholder="Room ID (optional, vd: team-daily)"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none"
              />
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={newRoom.isPrivate}
                  onChange={(e) => setNewRoom((p) => ({ ...p, isPrivate: e.target.checked }))}
                />
                Private
              </label>
              <button
                className="px-5 py-3 rounded-xl border-none bg-indigo-600 text-white font-bold cursor-pointer hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={handleCreateServerRoom}
                disabled={creating}
              >
                {creating ? "Đang tạo..." : "Tạo room"}
              </button>
            </div>
          </div>

          {loadingServer ? (
            <div className="p-6 rounded-2xl border border-gray-100 text-gray-600">
              Đang tải rooms...
            </div>
          ) : serverRooms.length === 0 ? (
            <div className="p-6 rounded-2xl border border-gray-100 text-gray-600">
              Chưa có room nào trên server (hoặc bạn chưa tham gia/tạo room).
            </div>
          ) : (
            serverRooms.map((r) => (
              <div
                key={r.roomId}
                className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-[0_15px_30px_rgba(15,23,42,0.06)] flex flex-col justify-between gap-4"
              >
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl font-bold">
                    {r.name?.charAt(0) || "R"}
                  </div>
                  <div className="min-w-0">
                    <h3 className="m-0 text-xl text-gray-900 truncate">{r.name}</h3>
                    <p className="m-0 mt-1 text-gray-600 text-sm truncate">{r.roomId}</p>
                    <p className="m-0 mt-1 text-gray-500 text-xs truncate">
                      {r.isPrivate ? "Private" : "Public"} • max {r.maxUsers || 20}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center gap-3">
                  <button
                    className="border-none bg-emerald-600 text-white px-4 py-2 rounded-lg cursor-pointer font-semibold transition-opacity hover:opacity-85"
                    onClick={() => handleJoinServerRoom(r)}
                  >
                    Vào room
                  </button>
                  <button
                    className="border border-red-200 bg-red-50 text-red-700 px-4 py-2 rounded-lg cursor-pointer font-semibold hover:bg-red-100 transition-colors"
                    onClick={() => handleDeleteServerRoom(r.roomId)}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {rooms.length === 0 ? (
        <div className="mt-16 text-center bg-white p-12 rounded-3xl border border-dashed border-gray-300 max-md:mt-8 max-md:p-8">
          <h3 className="text-xl font-semibold mb-2 text-gray-900">Chưa có phòng nào</h3>
          <p className="text-gray-600 mb-4">Bắt đầu bằng cách tạo hoặc tham gia một phòng mới.</p>
          <button className="px-6 py-3 border-none rounded-[10px] bg-gray-900 text-white font-semibold cursor-pointer transition-opacity hover:opacity-90" onClick={handleCreateNew}>
            Tạo phòng đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
          {rooms.map((room) => (
            <div key={room.id} className="bg-white rounded-[20px] p-6 shadow-[0_20px_40px_rgba(15,23,42,0.1)] flex flex-col justify-between gap-4">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl font-bold">
                  {room.name.charAt(0)}
                </div>
                <div>
                  <h3 className="m-0 text-xl text-gray-900">{room.name}</h3>
                  <p className="m-0 mt-1 text-gray-600 text-sm">{room.id}</p>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>
                  Lần cuối: {new Date(room.lastJoined).toLocaleString()}
                </span>
                <button className="border-none bg-indigo-600 text-white px-4 py-2 rounded-lg cursor-pointer font-semibold transition-opacity hover:opacity-85" onClick={() => handleJoinRoom(room)}>Vào phòng</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Spaces;

