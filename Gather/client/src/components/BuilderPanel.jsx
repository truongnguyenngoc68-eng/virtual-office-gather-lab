import { useState, useRef, useEffect } from "react";

// Furniture items available for placement
// type matches tile type numbers from server
const FURNITURE_ITEMS = [
  { type: 2, name: "Desk", icon: "desk" },
  { type: 3, name: "Chair", icon: "chair" },
  { type: 4, name: "Table", icon: "table" },
  { type: 5, name: "Plant", icon: "plant" },
  { type: 7, name: "Couch", icon: "couch" },
  { type: 8, name: "Whiteboard", icon: "board" },
  { type: 12, name: "Bookshelf", icon: "books" },
  { type: 13, name: "Coffee Table", icon: "ctable" },
  { type: 14, name: "Printer", icon: "printer" },
  { type: 15, name: "Water Cooler", icon: "water" },
  { type: 16, name: "Rug", icon: "rug" },
];

// Simple pixel-art icons rendered on small canvases
function drawMiniIcon(canvas, icon) {
  const ctx = canvas.getContext("2d");
  const s = 40;
  ctx.clearRect(0, 0, s, s);

  const f = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };

  switch (icon) {
    case "desk":
      f(4, 12, 32, 4, "#A0845C"); f(4, 16, 32, 12, "#8B7040");
      f(6, 2, 14, 10, "#3C3C50"); f(8, 4, 10, 6, "#3088B8"); // monitor
      f(10, 22, 10, 4, "#3C3C48"); // keyboard
      break;
    case "chair":
      f(12, 6, 16, 10, "#4A4A5C"); f(14, 16, 12, 14, "#4A4A5C");
      f(12, 32, 4, 4, "#333"); f(24, 32, 4, 4, "#333"); // wheels
      break;
    case "table":
      f(4, 10, 32, 6, "#C85050"); f(4, 16, 32, 14, "#A04040");
      f(6, 30, 4, 6, "#8B3030"); f(30, 30, 4, 6, "#8B3030"); // legs
      break;
    case "plant":
      f(14, 24, 12, 12, "#B87040"); // pot
      f(10, 8, 8, 16, "#38884C"); f(22, 8, 8, 16, "#38884C");
      f(14, 4, 12, 12, "#4CAF50");
      break;
    case "couch":
      f(2, 10, 36, 20, "#5B3A8C"); f(4, 6, 32, 8, "#7B4AB0");
      f(2, 10, 6, 20, "#4A2C78"); f(32, 10, 6, 20, "#4A2C78"); // arms
      break;
    case "board":
      f(6, 4, 28, 24, "#F0F0F0"); f(6, 4, 28, 2, "#AAA");
      f(10, 10, 16, 2, "#4A90D0"); f(10, 16, 12, 2, "#E85B5B");
      f(10, 22, 8, 2, "#4CAF50");
      break;
    case "books":
      f(4, 4, 32, 32, "#5C3A20"); // shelf
      f(6, 6, 6, 10, "#E85B5B"); f(14, 6, 6, 10, "#4A90D0");
      f(22, 6, 6, 10, "#4CAF50"); f(30, 6, 4, 10, "#FFD700");
      f(6, 20, 8, 10, "#8B44AD"); f(16, 20, 6, 10, "#E85B5B");
      f(24, 20, 8, 10, "#4A90D0");
      break;
    case "ctable":
      f(8, 14, 24, 4, "#8B7040"); f(8, 18, 24, 8, "#A0845C");
      f(10, 26, 4, 8, "#705830"); f(26, 26, 4, 8, "#705830");
      break;
    case "printer":
      f(6, 10, 28, 20, "#D0D0D0"); f(8, 6, 24, 8, "#E8E8E8");
      f(10, 22, 20, 4, "#AAA"); f(12, 14, 16, 4, "#4A90D0");
      break;
    case "water":
      f(12, 6, 16, 28, "#88D8F0"); f(12, 6, 16, 4, "#3088B8");
      f(10, 30, 20, 6, "#AAA"); f(18, 20, 4, 4, "#FFF");
      break;
    case "rug":
      f(4, 8, 32, 24, "#C04040"); f(6, 10, 28, 20, "#D05050");
      f(8, 12, 24, 16, "#C04040");
      f(10, 14, 20, 2, "#FFD700"); f(10, 24, 20, 2, "#FFD700");
      break;
    default:
      f(8, 8, 24, 24, "#666");
  }
}

function FurnitureIcon({ item, selected, onClick }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) drawMiniIcon(canvasRef.current, item.icon);
  }, [item.icon]);

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        padding: 4,
        borderRadius: 6,
        cursor: "pointer",
        border: selected ? "2px solid #4ECDC4" : "2px solid transparent",
        background: selected ? "rgba(78,205,196,0.15)" : "rgba(255,255,255,0.05)",
        transition: "all 0.15s",
      }}
    >
      <canvas ref={canvasRef} width={40} height={40} style={{ imageRendering: "pixelated" }} />
      <span style={{ fontSize: 9, color: selected ? "#4ECDC4" : "#8898AA", fontWeight: selected ? 700 : 400 }}>
        {item.name}
      </span>
    </div>
  );
}

export default function BuilderPanel({ open, onToggle, selectedItem, onSelectItem, onRemoveMode, removeMode }) {
  return (
    <>
      {/* Toggle button */}
      <button
        onClick={onToggle}
        style={{
          position: "fixed",
          top: 72,
          right: 12,
          zIndex: 60,
          background: open ? "rgba(78,205,196,0.3)" : "rgba(20,25,35,0.9)",
          border: open ? "1px solid #4ECDC4" : "1px solid rgba(100,150,200,0.3)",
          color: open ? "#4ECDC4" : "#B0C4DE",
          borderRadius: 6,
          padding: "6px 12px",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          backdropFilter: "blur(8px)",
        }}
      >
        {open ? "Close Builder" : "Builder"}
      </button>

      {/* Panel */}
      {open && (
        <div style={{
          position: "fixed",
          top: 102,
          right: 12,
          zIndex: 55,
          background: "rgba(20,25,35,0.95)",
          border: "1px solid rgba(100,150,200,0.3)",
          borderRadius: 8,
          padding: 12,
          width: 200,
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          backdropFilter: "blur(8px)",
          maxHeight: "calc(100vh - 80px)",
          overflowY: "auto",
        }}>
          <div style={{
            fontSize: 10,
            fontWeight: 700,
            color: "#4A90D0",
            textTransform: "uppercase",
            letterSpacing: 1.5,
            marginBottom: 8,
            borderBottom: "1px solid rgba(74,144,208,0.3)",
            paddingBottom: 4,
          }}>
            Place Furniture
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 4,
            marginBottom: 10,
          }}>
            {FURNITURE_ITEMS.map((item) => (
              <FurnitureIcon
                key={item.type}
                item={item}
                selected={selectedItem === item.type}
                onClick={() => onSelectItem(selectedItem === item.type ? null : item.type)}
              />
            ))}
          </div>

          {/* Remove mode toggle */}
          <button
            onClick={onRemoveMode}
            style={{
              width: "100%",
              padding: "6px 8px",
              borderRadius: 4,
              border: removeMode ? "1px solid #E53935" : "1px solid rgba(229,57,53,0.3)",
              background: removeMode ? "rgba(229,57,53,0.2)" : "rgba(229,57,53,0.05)",
              color: removeMode ? "#E53935" : "#8B6060",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              marginBottom: 8,
            }}
          >
            {removeMode ? "Click furniture to remove" : "Remove Mode"}
          </button>

          <div style={{ fontSize: 9, color: "#5A6A7A", lineHeight: 1.4 }}>
            {selectedItem
              ? "Click on a floor tile to place"
              : removeMode
                ? "Click placed furniture to remove"
                : "Select an item above"}
          </div>

          <div style={{
            fontSize: 9, color: "#4A5A6A", marginTop: 8,
            borderTop: "1px solid rgba(100,150,200,0.2)", paddingTop: 6,
          }}>
            Scroll wheel to zoom in/out
          </div>
        </div>
      )}
    </>
  );
}
