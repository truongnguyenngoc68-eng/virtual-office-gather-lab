import { useEffect, useState, useRef } from "react";
import { useSocket } from "../../contexts/SocketContext";
import { calculateDistance } from "../../utils/distance";
import Whiteboard from "../editor/Whiteboard";

interface ObjectInteractionProps {
  object: {
    objectId: string;
    type: string;
    name: string;
    position: { x: number; y: number };
    properties: {
      url?: string;
      content?: string;
      imageUrl?: string;
      documentUrl?: string;
      width?: number;
      height?: number;
      allowFullscreen?: boolean;
    };
  };
}

/**
 * ObjectInteraction - Combines InteractiveObject and ObjectFrame
 * Handles object interaction and rendering
 */
const ObjectInteraction = ({ object }: ObjectInteractionProps) => {
  const { currentUser } = useSocket();
  const [isNearby, setIsNearby] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Check distance from currentUser to object
  useEffect(() => {
    if (!currentUser) {
      setIsNearby(false);
      return;
    }

    const checkDistance = () => {
      const distance = calculateDistance(currentUser.position, object.position);
      const nearby = distance < 50; // 50 pixels threshold
      setIsNearby(nearby);
      setShowPrompt(nearby && !isOpen);
    };

    checkDistance();
    const interval = setInterval(checkDistance, 100); // Check every 100ms
    return () => clearInterval(interval);
  }, [currentUser, object.position, isOpen]);

  // Handle keyboard interaction
  useEffect(() => {
    if (!isNearby || isOpen) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "x") {
        setIsOpen(true);
        setShowPrompt(false);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isNearby, isOpen]);

  // Handle Escape key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isOpen]);

  // Get object icon based on type
  const getObjectIcon = () => {
    switch (object.type) {
      case "whiteboard":
        return "📋";
      case "video":
        return "🎥";
      case "website":
        return "🌐";
      case "image":
        return "🖼️";
      case "document":
        return "📄";
      case "game":
        return "🎮";
      default:
        return "📦";
    }
  };

  // Render content based on object type
  const renderContent = () => {
    switch (object.type) {
      case "website":
        return (
          <iframe
            ref={iframeRef}
            src={object.properties.url || "about:blank"}
            title={object.name}
            className="w-full h-full border-none"
            allowFullScreen={object.properties.allowFullscreen}
          />
        );

      case "video": {
        // Extract video ID from YouTube/Vimeo URL
        const videoUrl = object.properties.url || "";
        let embedUrl = videoUrl;

        if (videoUrl.includes("youtube.com/watch")) {
          const videoId = videoUrl.split("v=")[1]?.split("&")[0];
          embedUrl = `https://www.youtube.com/embed/${videoId}`;
        } else if (videoUrl.includes("youtu.be/")) {
          const videoId = videoUrl.split("youtu.be/")[1]?.split("?")[0];
          embedUrl = `https://www.youtube.com/embed/${videoId}`;
        } else if (videoUrl.includes("vimeo.com")) {
          const videoId = videoUrl.split("vimeo.com/")[1]?.split("?")[0];
          embedUrl = `https://player.vimeo.com/video/${videoId}`;
        }

        return (
          <iframe
            ref={iframeRef}
            src={embedUrl}
            title={object.name}
            className="w-full h-full border-none"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        );
      }

      case "image":
        return (
          <div className="w-full h-full flex items-center justify-center p-5">
            <img
              src={object.properties.imageUrl || object.properties.url}
              alt={object.name}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        );

      case "whiteboard":
        return (
          <Whiteboard
            objectId={object.objectId}
            initialContent={object.properties.content}
            onSave={async (content) => {
              try {
                const response = await fetch(
                  `${
                    import.meta.env.VITE_SERVER_URL || "http://localhost:5001"
                  }/api/objects/${object.objectId}/whiteboard`,
                  {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ content }),
                  }
                );
                if (!response.ok) {
                  console.error("Failed to save whiteboard");
                }
              } catch (error) {
                console.error("Error saving whiteboard:", error);
              }
            }}
          />
        );

      case "document":
        return (
          <iframe
            ref={iframeRef}
            src={object.properties.documentUrl || object.properties.url}
            title={object.name}
            className="w-full h-full border-none"
          />
        );

      case "game":
        return (
          <iframe
            ref={iframeRef}
            src={object.properties.url || "about:blank"}
            title={object.name}
            className="w-full h-full border-none"
            allowFullScreen
          />
        );

      default:
        return (
          <div className="p-10 text-center text-gray-500">
            <p>Unknown object type: {object.type}</p>
          </div>
        );
    }
  };

  return (
    <>
      {/* Interaction prompt when nearby */}
      {isNearby && showPrompt && (
        <div className="fixed bottom-[100px] left-1/2 -translate-x-1/2 bg-black/90 text-white px-5 py-3 rounded-lg flex items-center gap-3 z-[2000] shadow-[0_4px_12px_rgba(0,0,0,0.3)] animate-[slideUp_0.3s_ease-out]">
          <div className="text-2xl">{getObjectIcon()}</div>
          <div className="flex items-center gap-2 text-sm">
            <span className="bg-indigo-600 text-white px-2 py-1 rounded font-bold text-xs min-w-[24px] text-center">X</span>
            để mở {object.name}
          </div>
        </div>
      )}

      {/* Object frame when opened */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 z-[3000] flex items-center justify-center p-5" onClick={() => setIsOpen(false)}>
          <div
            className="bg-white rounded-xl w-[90%] max-w-[1200px] h-[90%] max-h-[800px] flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="m-0 text-lg font-semibold text-gray-900">{object.name}</h3>
              <button
                className="bg-none border-none text-2xl text-gray-500 cursor-pointer p-1 rounded transition-colors hover:bg-gray-200 hover:text-gray-900"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-auto p-0">{renderContent()}</div>
          </div>
        </div>
      )}
    </>
  );
};

export default ObjectInteraction;
