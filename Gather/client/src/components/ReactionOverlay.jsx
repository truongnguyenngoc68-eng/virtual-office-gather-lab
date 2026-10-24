import socket from "../utils/socket";

const EMOJIS = ["👋", "✋", "😄", "👍", "❓", "🎉"];

export default function ReactionOverlay({ reactions, open, onToggle }) {
  const sendReaction = (emoji) => {
    socket.emit("player:reaction", { emoji });
    onToggle(); // close tray after sending
  };

  return (
    <>
      <div style={{
        position: "fixed",
        bottom: 72,
        right: 66,
        zIndex: 55,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        alignItems: "flex-end",
        pointerEvents: "none",
      }}>
        {reactions.map((r) => (
          <div
            key={r.key}
            style={{
              background: "rgba(20,25,35,0.9)",
              border: "1px solid rgba(100,150,200,0.3)",
              borderRadius: 20,
              padding: "4px 12px",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              color: "#B0C4DE",
              fontFamily: "'Segoe UI', system-ui, sans-serif",
              backdropFilter: "blur(8px)",
              animation: "reactionSlideIn 0.25s ease-out, reactionFadeOut 0.4s ease-in 2.6s forwards",
            }}
          >
            <span style={{ fontSize: 20 }}>{r.emoji}</span>
            <span style={{ fontWeight: 600 }}>{r.playerName}</span>
          </div>
        ))}
      </div>

      <div style={{
        position: "fixed",
        bottom: 12,
        right: 72,
        zIndex: 56,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 8,
      }}>
        {open && (
          <div style={{
            display: "flex",
            gap: 4,
            background: "rgba(20,25,35,0.95)",
            border: "1px solid rgba(100,150,200,0.3)",
            borderRadius: 30,
            padding: "6px 10px",
            backdropFilter: "blur(8px)",
            animation: "reactionSlideIn 0.2s ease-out",
          }}>
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => sendReaction(emoji)}
                title={emoji}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 22,
                  cursor: "pointer",
                  padding: "2px 4px",
                  borderRadius: 8,
                  lineHeight: 1,
                  transition: "transform 0.1s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.35)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={onToggle}
          title="React"
          style={{
            background: open ? "rgba(78,205,196,0.25)" : "rgba(20,25,35,0.9)",
            border: `1px solid ${open ? "rgba(78,205,196,0.6)" : "rgba(100,150,200,0.3)"}`,
            borderRadius: "50%",
            width: 40,
            height: 40,
            fontSize: 20,
            cursor: "pointer",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
          }}
        >
          😊
        </button>
      </div>
    </>
  );
}