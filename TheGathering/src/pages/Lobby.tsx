import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";

interface SavedRoom {
  id: string;
  name: string;
  lastJoined: number;
}

const Lobby = () => {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [roomId, setRoomId] = useState("");
  const [roomName, setRoomName] = useState("");
  const [savedRooms, setSavedRooms] = useState<SavedRoom[]>([]);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for room parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get("room");
    
    // Prefill user info from login data
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const email = user.email || "";
        const derivedName = email ? email.split("@")[0] : "guest";
        setUserEmail(email);
        setUserName(derivedName);
      } catch (error) {
        console.error("Failed to parse user info", error);
        setUserName("guest");
      }
    } else {
      setUserName("guest");
    }

    const storedRoomId = localStorage.getItem("roomId");
    const storedRoomName = localStorage.getItem("roomName");
    setRoomId(
      roomParam || storedRoomId || `space-${Math.random().toString(36).substring(2, 8)}`
    );
    setRoomName(storedRoomName || "Không gian của tôi");

    try {
      const storedRooms = localStorage.getItem("savedRooms");
      if (storedRooms) {
        setSavedRooms(JSON.parse(storedRooms));
      }
    } catch (error) {
      console.error("Failed to read saved rooms", error);
    }

    requestMediaPermissions();
  }, []);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const requestMediaPermissions = async () => {
    // Check if mediaDevices API is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn("Media devices API not available");
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setStream(mediaStream);
      setCameraEnabled(true);
      setMicEnabled(true);
    } catch (error: any) {
      // Only log error, don't show alert - allow user to continue without media
      if (error.name === "NotFoundError") {
        console.warn(
          "No media devices found. You can continue without camera/microphone."
        );
      } else if (
        error.name === "NotAllowedError" ||
        error.name === "PermissionDeniedError"
      ) {
        console.warn(
          "Media permissions denied. You can continue without camera/microphone."
        );
      } else {
        console.warn("Error accessing media devices:", error.message || error);
      }
      // Set defaults to allow user to continue
      setCameraEnabled(false);
      setMicEnabled(false);
    }
  };

  const toggleCamera = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !cameraEnabled;
        setCameraEnabled(!cameraEnabled);
      }
    } else {
      // Allow toggling state even without stream
      setCameraEnabled(!cameraEnabled);
    }
  };

  const toggleMic = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !micEnabled;
        setMicEnabled(!micEnabled);
      }
    } else {
      // Allow toggling state even without stream
      setMicEnabled(!micEnabled);
    }
  };

  const handleCreateRoom = () => {
    const newRoomId = `space-${Date.now().toString(36)}`;
    setRoomId(newRoomId);
    setRoomName(`Phòng mới ${savedRooms.length + 1}`);
  };

  const handleSelectRoom = (room: SavedRoom) => {
    setRoomId(room.id);
    setRoomName(room.name);
  };

  const updateSavedRooms = (room: SavedRoom) => {
    const updated = [
      { ...room, lastJoined: Date.now() },
      ...savedRooms.filter((r) => r.id !== room.id),
    ]
      .sort((a, b) => b.lastJoined - a.lastJoined)
      .slice(0, 6);

    setSavedRooms(updated);
    localStorage.setItem("savedRooms", JSON.stringify(updated));
  };

  const handleJoin = () => {
    if (!roomId.trim()) {
      alert("Vui lòng nhập Room ID");
      return;
    }

    // Stop media stream if user wants to join without camera/mic
    if (stream && (!cameraEnabled || !micEnabled)) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    const finalName = userName || "guest";
    const avatar = finalName.charAt(0).toUpperCase();
    const finalRoomName = roomName || roomId;

    localStorage.setItem("userName", finalName);
    localStorage.setItem("userAvatar", avatar);
    localStorage.setItem("roomId", roomId);
    localStorage.setItem("roomName", finalRoomName);
    // Store media preferences
    localStorage.setItem("cameraEnabled", String(cameraEnabled));
    localStorage.setItem("micEnabled", String(micEnabled));

    updateSavedRooms({
      id: roomId,
      name: finalRoomName,
      lastJoined: Date.now(),
    });

    navigate("/app");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 p-8 overflow-y-auto">
      <div className="w-full max-w-[780px] bg-white rounded-3xl p-12 shadow-[0_25px_60px_rgba(15,23,42,0.25)] max-md:p-7">
        <div className="flex justify-between items-center gap-8 mb-8 max-md:flex-col max-md:items-start">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <p className="uppercase tracking-wider text-indigo-600 font-semibold text-sm">Join your gathering</p>
              <Link to="/spaces" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">Spaces</Link>
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Chuẩn bị trước khi vào phòng</h1>
            <p className="text-gray-600 text-base">Kiểm tra thiết bị và chọn không gian làm việc của bạn.</p>
          </div>
          <div className="flex items-center gap-4 p-6 bg-gray-100 rounded-2xl">
            <div className="w-16 h-16 rounded-[14px] bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 className="m-0 text-lg font-bold text-gray-900">{userName}</h4>
              <p className="m-0 text-gray-600">{userEmail}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-7">
          <div className="flex flex-col gap-3">
            <label className="text-sm font-semibold text-gray-700">Thông tin của bạn</label>
            <div className="p-6 border border-gray-200 rounded-[14px] bg-gray-50 flex flex-col gap-4">
              <div className="flex justify-between text-[0.95rem] text-gray-600">
                <span>Tên hiển thị</span>
                <strong className="text-gray-900">{userName}</strong>
              </div>
              <div className="flex justify-between text-[0.95rem] text-gray-600">
                <span>Email</span>
                <strong className="text-gray-900">{userEmail || "Chưa có email"}</strong>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-sm font-semibold text-gray-700">Chọn hoặc tạo phòng</label>
            <div className="flex gap-3 max-md:flex-col">
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Nhập Room ID"
                className="flex-1 px-4 py-[0.85rem] border-2 border-gray-200 rounded-[10px] text-base transition-all focus:outline-none focus:border-indigo-600 focus:shadow-[0_0_0_4px_rgba(99,102,241,0.15)]"
              />
              <button
                type="button"
                className="px-4 py-[0.85rem] bg-gray-900 text-white border-none rounded-[10px] font-semibold cursor-pointer transition-opacity hover:opacity-90"
                onClick={handleCreateRoom}
              >
                Tạo phòng mới
              </button>
            </div>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Tên phòng hiển thị"
              className="mt-3 px-4 py-[0.85rem] border-2 border-gray-200 rounded-[10px] text-base transition-all focus:outline-none focus:border-purple-600 focus:shadow-[0_0_0_4px_rgba(168,85,247,0.15)]"
            />
            {savedRooms.length > 0 && (
              <div className="flex flex-col gap-3 text-gray-600 text-sm mt-3">
                <span>Phòng đã tạo:</span>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
                  {savedRooms.map((room) => (
                    <button
                      key={room.id}
                      className={`border rounded-[14px] p-4 bg-white text-left cursor-pointer flex flex-col gap-1 transition-all ${
                        room.id === roomId
                          ? "border-indigo-600 shadow-[0_15px_30px_rgba(99,102,241,0.2)]"
                          : "border-gray-200 hover:border-indigo-600 hover:shadow-[0_10px_20px_rgba(15,23,42,0.1)] hover:-translate-y-0.5"
                      }`}
                      onClick={() => handleSelectRoom(room)}
                    >
                      <div className="font-semibold text-gray-900">{room.name}</div>
                      <div className="text-sm text-gray-600">{room.id}</div>
                      <div className="text-xs text-gray-400">
                        {new Date(room.lastJoined).toLocaleString()}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-sm font-semibold text-gray-700">Camera & Microphone</label>
            <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
                <button
                  className={`flex flex-col items-center gap-1 px-4 py-3 bg-black/70 border-none rounded-lg text-white cursor-pointer transition-colors text-2xl ${
                    cameraEnabled ? "bg-green-600/80" : "bg-red-600/80"
                  }`}
                  onClick={toggleCamera}
                >
                  {cameraEnabled ? "📹" : "📷"}
                  <span className="text-xs">{cameraEnabled ? "Camera Bật" : "Camera Tắt"}</span>
                </button>
                <button
                  className={`flex flex-col items-center gap-1 px-4 py-3 bg-black/70 border-none rounded-lg text-white cursor-pointer transition-colors text-2xl ${
                    micEnabled ? "bg-green-600/80" : "bg-red-600/80"
                  }`}
                  onClick={toggleMic}
                >
                  {micEnabled ? "🎤" : "🔇"}
                  <span className="text-xs">{micEnabled ? "Micro Bật" : "Micro Tắt"}</span>
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Camera và microphone là tùy chọn. Bạn có thể tắt chúng và vẫn vào
              phòng được.
            </p>
          </div>

          <button
            className="px-8 py-4 bg-gradient-to-br from-indigo-600 to-purple-600 text-white border-none rounded-xl text-lg font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_25px_rgba(99,102,241,0.35)] disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleJoin}
            disabled={!roomId.trim()}
          >
            Join the Gathering
          </button>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
