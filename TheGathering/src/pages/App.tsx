import { useEffect, useState, lazy, Suspense } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";

// Lazy load heavy components for better code splitting
// Lazy load heavy components for better code splitting
const GameScene = lazy(() => import("../components/game/GameScene"));
const Sidebar = lazy(() => import("../components/Sidebar"));
const ControlBar = lazy(() => import("../components/ControlBar"));
const VideoChat = lazy(() => import("../components/chat/VideoChat"));
const Chat = lazy(() => import("../components/chat/Chat"));
const MapLayers = lazy(() => import("../components/game/MapLayers"));
const ChatPage = lazy(() => import("./ChatPage"));
const EventsPage = lazy(() => import("./EventsPage"));
const LibraryApp = lazy(() => import("./LibraryApp"));
const ProfilePage = lazy(() => import("./ProfilePage"));
const AdminDashboard = lazy(() => import("../portal/admin/AdminDashboard"));

import {
  SocketProvider,
  WebRTCProvider,
  ChatProvider,
  ObjectProvider,
  MapProvider,
  EventProvider,
  ThemeProvider,
  NotificationProvider,
} from "../contexts";
import ErrorBoundary from "../components/ErrorBoundary";
import { SearchModal } from "../components/modals";
import { analytics } from "../utils/analytics";

const AppPage = () => {
  const { roomId: paramRoomId } = useParams();
  const [username, setUsername] = useState("");
  // Use paramRoomId if available, otherwise fallback to localStorage or default
  const [roomId, setRoomId] = useState(() => {
    const saved = localStorage.getItem("roomId");
    const isReserved = ["chat", "events", "profile", "admin", "library"].includes(paramRoomId || "");
    if (paramRoomId && !isReserved) return paramRoomId;
    if (saved && !["chat", "events", "profile", "admin", "library"].includes(saved)) return saved;
    return "default-room";
  });
  const [showSearchModal, setShowSearchModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // console.log("AppPage Mounted...");
  }, []);

  useEffect(() => {
    // Check authentication
    const savedName = localStorage.getItem("userName");
    if (savedName) {
      setUsername(savedName);
    } else {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");
      if (!token || !userStr) {
        navigate("/spaces");
        return;
      }
      try {
        const user = JSON.parse(userStr);
        setUsername(user.username || user.email);
      } catch (e) {
        navigate("/spaces");
      }
    }
  }, [navigate]);

  useEffect(() => {
    const isReserved = ["chat", "events", "profile", "admin", "library"].includes(paramRoomId || "");
    if (paramRoomId && !isReserved) {
      setRoomId(paramRoomId);
      localStorage.setItem("roomId", paramRoomId);
    }
  }, [paramRoomId]);

  // ... (rest of effects)

  // Track page views
  useEffect(() => {
    analytics.trackPageView(location.pathname);
  }, [location.pathname]);

  // Keyboard shortcut...
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setShowSearchModal(true);
      }
      if (e.key === "Escape" && showSearchModal) {
        setShowSearchModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showSearchModal]);

  const isChatPage = location.pathname.includes("/chat");
  const isProfilePage = location.pathname.includes("/profile");
  const isEventsPage = location.pathname.includes("/events");
  const isLibraryPage = location.pathname.includes("/library");
  const isAdminPage = location.pathname.includes("/admin");

  if (!username) {
    // Still need username/auth basically
    return (
      <div className="flex justify-center items-center w-screen h-screen bg-obsidian text-white">
        <div className="flex flex-col items-center p-8 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-2xl">
          <div className="w-12 h-12 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(139,92,246,0.5)]"></div>
          <h1 className="text-lg font-outfit tracking-wide font-medium text-slate-200">Authenticating...</h1>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <SocketProvider username={username} roomId={roomId}>
          <MapProvider>
            <WebRTCProvider>
              <ChatProvider roomId={roomId}>
                <ObjectProvider>
                  <EventProvider>
                    <NotificationProvider>
                      <div className="flex w-screen h-screen overflow-hidden bg-[#202124] text-slate-100 font-sans selection:bg-violet-500/30">
                        <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,0,255,0.1),rgba(0,0,0,0)_50%)] pointer-events-none" />

                        <Suspense fallback={<div className="flex items-center justify-center w-full h-full bg-obsidian">...</div>}>
                          <Sidebar />
                          {isChatPage ? (
                            <>
                              <ChatPage />
                              <VideoChat />
                            </>
                          ) : isEventsPage ? (
                            <>
                              <EventsPage />
                            </>
                          ) : isLibraryPage ? (
                            <>
                              <LibraryApp />
                            </>
                          ) : isProfilePage ? (
                            <>
                              <ProfilePage />
                            </>
                          ) : isAdminPage ? (
                            <AdminDashboard />
                          ) : (
                            <>
                              <div className="flex-1 relative flex flex-col overflow-hidden m-0 p-0">
                                <GameScene />
                                <ControlBar />
                              </div>
                              <VideoChat />
                              <Chat />
                              <MapLayers />
                            </>
                          )}
                        </Suspense>
                      </div>
                      {showSearchModal && (
                        <SearchModal
                          isOpen={showSearchModal}
                          onClose={() => setShowSearchModal(false)}
                          roomId={roomId}
                        />
                      )}
                    </NotificationProvider>
                  </EventProvider>
                </ObjectProvider>
              </ChatProvider>
            </WebRTCProvider>
          </MapProvider>
        </SocketProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default AppPage;
