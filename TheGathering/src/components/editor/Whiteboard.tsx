import { useEffect, useRef, useState } from "react";
import { useSocket } from "../../contexts/SocketContext";

interface WhiteboardProps {
  objectId: string;
  initialContent?: string;
  onSave?: (content: string) => void;
}

const Whiteboard = ({ objectId, initialContent, onSave }: WhiteboardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { socket, currentUser } = useSocket();
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(3);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [usersDrawing, setUsersDrawing] = useState<
    Map<string, { color: string; username: string }>
  >(new Map());

  // User colors for multi-user support
  const userColors = [
    "#FF0000", // Red
    "#0000FF", // Blue
    "#00FF00", // Green
    "#FF00FF", // Magenta
    "#00FFFF", // Cyan
    "#FFA500", // Orange
    "#800080", // Purple
    "#FFC0CB", // Pink
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = 1200;
    canvas.height = 800;

    // Set default styles
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;

    // Load initial content
    if (initialContent) {
      try {
        const image = new Image();
        image.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(image, 0, 0);
        };
        image.src = initialContent;
      } catch (error) {
        console.error("Error loading whiteboard content:", error);
      }
    } else {
      // Clear canvas with white background
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [initialContent]);

  // Socket.IO handlers for real-time collaboration
  useEffect(() => {
    if (!socket || !currentUser) return;

    const handleWhiteboardDraw = (data: {
      objectId: string;
      userId: string;
      username: string;
      type: "start" | "draw" | "end";
      x: number;
      y: number;
      color: string;
      brushSize: number;
    }) => {
      if (data.objectId !== objectId || data.userId === currentUser.userId)
        return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Get user color
      let userColor = userColors[parseInt(data.userId) % userColors.length];
      if (data.color) {
        userColor = data.color;
      }

      ctx.strokeStyle = userColor;
      ctx.lineWidth = data.brushSize || brushSize;

      if (data.type === "start") {
        ctx.beginPath();
        ctx.moveTo(data.x, data.y);
        setUsersDrawing((prev) => {
          const newMap = new Map(prev);
          newMap.set(data.userId, {
            color: userColor,
            username: data.username,
          });
          return newMap;
        });
      } else if (data.type === "draw") {
        ctx.lineTo(data.x, data.y);
        ctx.stroke();
      } else if (data.type === "end") {
        ctx.stroke();
        setUsersDrawing((prev) => {
          const newMap = new Map(prev);
          newMap.delete(data.userId);
          return newMap;
        });
      }
    };

    socket.on("whiteboard-draw", handleWhiteboardDraw);

    return () => {
      socket.off("whiteboard-draw", handleWhiteboardDraw);
    };
  }, [socket, currentUser, objectId, brushSize]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !socket || !currentUser) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);

    // Emit start event
    socket.emit("whiteboard-draw", {
      objectId,
      userId: currentUser.userId,
      username: currentUser.username,
      type: "start",
      x,
      y,
      color: tool === "eraser" ? "#FFFFFF" : color,
      brushSize: tool === "eraser" ? brushSize * 2 : brushSize,
    });
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current || !socket || !currentUser) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = tool === "eraser" ? "#FFFFFF" : color;
    ctx.lineWidth = tool === "eraser" ? brushSize * 2 : brushSize;
    ctx.lineTo(x, y);
    ctx.stroke();

    // Emit draw event
    socket.emit("whiteboard-draw", {
      objectId,
      userId: currentUser.userId,
      username: currentUser.username,
      type: "draw",
      x,
      y,
      color: tool === "eraser" ? "#FFFFFF" : color,
      brushSize: tool === "eraser" ? brushSize * 2 : brushSize,
    });
  };

  const stopDrawing = () => {
    if (!isDrawing || !socket || !currentUser) return;

    setIsDrawing(false);

    // Emit end event
    socket.emit("whiteboard-draw", {
      objectId,
      userId: currentUser.userId,
      username: currentUser.username,
      type: "end",
      x: 0,
      y: 0,
      color,
      brushSize,
    });

    // Save to database
    saveCanvas();
  };

  const saveCanvas = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !onSave) return;

    try {
      const dataURL = canvas.toDataURL("image/png");
      onSave(dataURL);
    } catch (error) {
      console.error("Error saving canvas:", error);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Save after clear
    saveCanvas();
  };

  return (
    <div className="flex flex-col w-full h-full bg-gray-100">
      <div className="flex items-center gap-4 px-4 py-3 bg-white border-b border-gray-200 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            className={`bg-white border rounded-md px-3 py-2 cursor-pointer text-base transition-all flex items-center gap-1 ${
              tool === "pen"
                ? "bg-indigo-600 text-white border-indigo-600"
                : "border-gray-300 hover:bg-gray-50 hover:border-gray-400"
            }`}
            onClick={() => setTool("pen")}
            title="Pen"
          >
            ✏️
          </button>
          <button
            className={`bg-white border rounded-md px-3 py-2 cursor-pointer text-base transition-all flex items-center gap-1 ${
              tool === "eraser"
                ? "bg-indigo-600 text-white border-indigo-600"
                : "border-gray-300 hover:bg-gray-50 hover:border-gray-400"
            }`}
            onClick={() => setTool("eraser")}
            title="Eraser"
          >
            🧹
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            Color:
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              disabled={tool === "eraser"}
              className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
            />
          </label>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            Size:
            <input
              type="range"
              min="1"
              max="20"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-[100px]"
            />
            <span className="min-w-[40px] font-medium">{brushSize}px</span>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <button className="bg-white border border-gray-300 rounded-md px-3 py-2 cursor-pointer text-base transition-all flex items-center gap-1 hover:bg-gray-50 hover:border-gray-400" onClick={clearCanvas} title="Clear">
            🗑️ Clear
          </button>
          <button className="bg-white border border-gray-300 rounded-md px-3 py-2 cursor-pointer text-base transition-all flex items-center gap-1 hover:bg-gray-50 hover:border-gray-400" onClick={saveCanvas} title="Save">
            💾 Save
          </button>
        </div>

        {usersDrawing.size > 0 && (
          <div className="flex items-center gap-2 ml-auto text-xs text-gray-600">
            <span>Drawing:</span>
            {Array.from(usersDrawing.values()).map((user, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-black/5 rounded font-medium"
                style={{ color: user.color }}
              >
                {user.username}
              </span>
            ))}
          </div>
        )}
      </div>

      <canvas
        ref={canvasRef}
        className="flex-1 cursor-crosshair bg-white touch-none active:cursor-crosshair"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
    </div>
  );
};

export default Whiteboard;
