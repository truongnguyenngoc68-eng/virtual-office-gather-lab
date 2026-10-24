import { useState, useEffect } from "react";
import { useSocket } from "../../contexts/SocketContext";
import { useWebRTC } from "../../contexts/WebRTCContext";
import { useDeviceSettings } from "../../hooks/useDeviceSettings";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = "profile" | "audio" | "controls";

const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const { currentUser } = useSocket();
  const {
    isVideoEnabled,
    isAudioEnabled,
    toggleVideo,
    toggleAudio,
    localStream,
  } = useWebRTC();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [username, setUsername] = useState("");
  const [avatarColor, setAvatarColor] = useState("#4f46e5");
  const [status, setStatus] = useState("Available");
  
  const {
    devices,
    selectedCamera,
    selectedMicrophone,
    selectedSpeaker,
    setSelectedCamera,
    setSelectedMicrophone,
    setSelectedSpeaker,
  } = useDeviceSettings(isOpen, activeTab);

  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.username);
      // Get avatar color from localStorage or default
      const savedColor = localStorage.getItem("avatarColor");
      if (savedColor) {
        setAvatarColor(savedColor);
      }
    }
  }, [currentUser]);

  const handleSaveProfile = () => {
    if (!username.trim()) {
      alert("Username cannot be empty");
      return;
    }

    // Update localStorage
    localStorage.setItem("userName", username);
    localStorage.setItem("avatarColor", avatarColor);
    localStorage.setItem("userStatus", status);

    // Update avatar in localStorage
    const avatar = username.charAt(0).toUpperCase();
    localStorage.setItem("userAvatar", avatar);

    alert("Profile saved! Changes will apply after refresh.");
  };

  const handleChangeDevice = async (
    type: "camera" | "microphone" | "speaker"
  ) => {
    if (!localStream) return;

    try {
      if (type === "camera" && selectedCamera) {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: selectedCamera } },
          audio: isAudioEnabled,
        });

        // Replace video track
        const videoTrack = newStream.getVideoTracks()[0];
        const oldVideoTrack = localStream.getVideoTracks()[0];
        if (oldVideoTrack && videoTrack) {
          localStream.removeTrack(oldVideoTrack);
          oldVideoTrack.stop();
          localStream.addTrack(videoTrack);
        }
        newStream.getAudioTracks().forEach((track) => track.stop());
      } else if (type === "microphone" && selectedMicrophone) {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: isVideoEnabled,
          audio: { deviceId: { exact: selectedMicrophone } },
        });

        // Replace audio track
        const audioTrack = newStream.getAudioTracks()[0];
        const oldAudioTrack = localStream.getAudioTracks()[0];
        if (oldAudioTrack && audioTrack) {
          localStream.removeTrack(oldAudioTrack);
          oldAudioTrack.stop();
          localStream.addTrack(audioTrack);
        }
        newStream.getVideoTracks().forEach((track) => track.stop());
      }

      alert(`${type} changed successfully!`);
    } catch (error) {
      console.error(`Error changing ${type}:`, error);
      alert(`Failed to change ${type}`);
    }
  };

  const testAudio = () => {
    // Simple audio test - play a beep
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 440;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.5
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[10004] animate-[fadeIn_0.2s_ease-in]" onClick={onClose}>
      <div className="bg-gray-800 rounded-xl w-[90%] max-w-[600px] max-h-[90vh] flex flex-col shadow-2xl animate-[slideUp_0.3s_ease-out]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <h2 className="m-0 text-xl font-semibold text-gray-50">Settings</h2>
          <button className="bg-transparent border-none text-gray-400 text-[32px] leading-none cursor-pointer p-0 w-8 h-8 flex items-center justify-center rounded transition-all hover:bg-gray-700 hover:text-gray-50" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="flex border-b border-gray-700 px-6">
          <button
            className={`flex-1 px-4 py-3 bg-transparent border-none border-b-2 transition-all text-sm font-medium cursor-pointer ${
              activeTab === "profile"
                ? "text-indigo-600 border-b-indigo-600"
                : "text-gray-400 border-b-transparent hover:text-gray-300 hover:bg-white/5"
            }`}
            onClick={() => setActiveTab("profile")}
          >
            👤 Profile
          </button>
          <button
            className={`flex-1 px-4 py-3 bg-transparent border-none border-b-2 transition-all text-sm font-medium cursor-pointer ${
              activeTab === "audio"
                ? "text-indigo-600 border-b-indigo-600"
                : "text-gray-400 border-b-transparent hover:text-gray-300 hover:bg-white/5"
            }`}
            onClick={() => setActiveTab("audio")}
          >
            🎤 Audio/Video
          </button>
          <button
            className={`flex-1 px-4 py-3 bg-transparent border-none border-b-2 transition-all text-sm font-medium cursor-pointer ${
              activeTab === "controls"
                ? "text-indigo-600 border-b-indigo-600"
                : "text-gray-400 border-b-transparent hover:text-gray-300 hover:bg-white/5"
            }`}
            onClick={() => setActiveTab("controls")}
          >
            ⌨️ Controls
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "profile" && (
            <div>
              <h3 className="m-0 mb-5 text-lg font-semibold text-gray-50">Profile Settings</h3>

              <div className="mb-5">
                <label className="block mb-2 text-sm font-medium text-gray-300">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your username"
                  className="w-full px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-md text-gray-50 text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="mb-5">
                <label
                  htmlFor="settings-avatar-color"
                  className="block mb-2 text-sm font-medium text-gray-300"
                >
                  Avatar Color
                </label>
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-semibold text-white border-[3px] border-gray-700"
                    style={{ backgroundColor: avatarColor }}
                  >
                    {username.charAt(0).toUpperCase() || "U"}
                  </div>
                  <input
                    id="settings-avatar-color"
                    type="color"
                    value={avatarColor}
                    onChange={(e) => setAvatarColor(e.target.value)}
                    className="w-[60px] h-10 border border-gray-700 rounded-md cursor-pointer"
                  />
                </div>
              </div>

              <div className="mb-5">
                <label
                  htmlFor="settings-status"
                  className="block mb-2 text-sm font-medium text-gray-300"
                >
                  Status
                </label>
                <select
                  id="settings-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-md text-gray-50 text-sm focus:outline-none focus:border-indigo-600"
                >
                  <option value="Available">Available</option>
                  <option value="Busy">Busy</option>
                  <option value="Away">Away</option>
                  <option value="Do Not Disturb">Do Not Disturb</option>
                </select>
              </div>

              <button className="w-full px-5 py-2.5 rounded-md border-none text-sm font-medium cursor-pointer transition-all bg-indigo-600 text-white hover:bg-indigo-700 mt-2" onClick={handleSaveProfile}>
                Save Profile
              </button>
            </div>
          )}

          {activeTab === "audio" && (
            <div>
              <h3 className="m-0 mb-5 text-lg font-semibold text-gray-50">Audio/Video Settings</h3>

              <div className="flex gap-6 mb-6 p-4 bg-gray-900 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-gray-300 text-sm">Video:</span>
                  <button
                    className={`px-4 py-1.5 rounded-md border-none text-xs font-medium cursor-pointer transition-all ${
                      isVideoEnabled ? "bg-green-500 text-white" : "bg-red-500 text-white"
                    }`}
                    onClick={toggleVideo}
                  >
                    {isVideoEnabled ? "On" : "Off"}
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-300 text-sm">Audio:</span>
                  <button
                    className={`px-4 py-1.5 rounded-md border-none text-xs font-medium cursor-pointer transition-all ${
                      isAudioEnabled ? "bg-green-500 text-white" : "bg-red-500 text-white"
                    }`}
                    onClick={toggleAudio}
                  >
                    {isAudioEnabled ? "On" : "Off"}
                  </button>
                </div>
              </div>

              <div className="mb-5">
                <label
                  htmlFor="settings-camera"
                  className="block mb-2 text-sm font-medium text-gray-300"
                >
                  Camera
                </label>
                <select
                  id="settings-camera"
                  value={selectedCamera}
                  onChange={(e) => setSelectedCamera(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-md text-gray-50 text-sm focus:outline-none focus:border-indigo-600 mb-2"
                >
                  {devices.cameras.map((camera) => (
                    <option key={camera.deviceId} value={camera.deviceId}>
                      {camera.label || `Camera ${devices.cameras.indexOf(camera) + 1}`}
                    </option>
                  ))}
                </select>
                <button
                  className="px-5 py-2.5 rounded-md border-none text-sm font-medium cursor-pointer transition-all bg-gray-700 text-gray-50 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed ml-2"
                  onClick={() => handleChangeDevice("camera")}
                  disabled={!selectedCamera}
                >
                  Apply Camera
                </button>
              </div>

              <div className="mb-5">
                <label
                  htmlFor="settings-microphone"
                  className="block mb-2 text-sm font-medium text-gray-300"
                >
                  Microphone
                </label>
                <select
                  id="settings-microphone"
                  value={selectedMicrophone}
                  onChange={(e) => setSelectedMicrophone(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-md text-gray-50 text-sm focus:outline-none focus:border-indigo-600 mb-2"
                >
                  {devices.microphones.map((mic) => (
                    <option key={mic.deviceId} value={mic.deviceId}>
                      {mic.label || `Microphone ${devices.microphones.indexOf(mic) + 1}`}
                    </option>
                  ))}
                </select>
                <button
                  className="px-5 py-2.5 rounded-md border-none text-sm font-medium cursor-pointer transition-all bg-gray-700 text-gray-50 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed ml-2"
                  onClick={() => handleChangeDevice("microphone")}
                  disabled={!selectedMicrophone}
                >
                  Apply Microphone
                </button>
              </div>

              <div className="mb-5">
                <label
                  htmlFor="settings-speaker"
                  className="block mb-2 text-sm font-medium text-gray-300"
                >
                  Speaker
                </label>
                <select
                  id="settings-speaker"
                  value={selectedSpeaker}
                  onChange={(e) => setSelectedSpeaker(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-md text-gray-50 text-sm focus:outline-none focus:border-indigo-600 mb-2"
                >
                  {devices.speakers.map((speaker) => (
                    <option key={speaker.deviceId} value={speaker.deviceId}>
                      {speaker.label || `Speaker ${devices.speakers.indexOf(speaker) + 1}`}
                    </option>
                  ))}
                </select>
                <button className="px-5 py-2.5 rounded-md border-none text-sm font-medium cursor-pointer transition-all bg-gray-700 text-gray-50 hover:bg-gray-600 ml-2" onClick={testAudio}>
                  Test Audio
                </button>
              </div>
            </div>
          )}

          {activeTab === "controls" && (
            <div>
              <h3 className="m-0 mb-5 text-lg font-semibold text-gray-50">Keyboard Shortcuts</h3>

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between p-3 bg-gray-900 rounded-md border border-gray-700">
                  <kbd className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs font-mono text-gray-50 shadow">W</kbd> / <kbd className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs font-mono text-gray-50 shadow">↑</kbd>
                  <span className="text-gray-300 text-sm">Move Up</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-900 rounded-md border border-gray-700">
                  <kbd className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs font-mono text-gray-50 shadow">S</kbd> / <kbd className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs font-mono text-gray-50 shadow">↓</kbd>
                  <span className="text-gray-300 text-sm">Move Down</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-900 rounded-md border border-gray-700">
                  <kbd className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs font-mono text-gray-50 shadow">A</kbd> / <kbd className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs font-mono text-gray-50 shadow">←</kbd>
                  <span className="text-gray-300 text-sm">Move Left</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-900 rounded-md border border-gray-700">
                  <kbd className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs font-mono text-gray-50 shadow">D</kbd> / <kbd className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs font-mono text-gray-50 shadow">→</kbd>
                  <span className="text-gray-300 text-sm">Move Right</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-900 rounded-md border border-gray-700">
                  <kbd className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs font-mono text-gray-50 shadow">X</kbd>
                  <span className="text-gray-300 text-sm">Interact with Object</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-900 rounded-md border border-gray-700">
                  <kbd className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs font-mono text-gray-50 shadow">ESC</kbd>
                  <span className="text-gray-300 text-sm">Close Modal/Object</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-900 rounded-md border border-gray-700">
                  <kbd className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs font-mono text-gray-50 shadow">1</kbd> - <kbd className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs font-mono text-gray-50 shadow">4</kbd>
                  <span className="text-gray-300 text-sm">Quick Reactions</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-900 rounded-md border border-gray-700">
                  <kbd className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs font-mono text-gray-50 shadow">Ctrl</kbd> + <kbd className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs font-mono text-gray-50 shadow">F</kbd>
                  <span className="text-gray-300 text-sm">Search Office</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-900 rounded-lg text-blue-200 text-[13px]">
                <p className="m-0">
                  <strong className="text-blue-100">Note:</strong> Keyboard shortcuts are active when the
                  game window is focused.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;

