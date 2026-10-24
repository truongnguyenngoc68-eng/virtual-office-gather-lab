import { useRef, useEffect } from "react";

function VideoTile({ stream, name, color, isSelf }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div style={{
      position: "relative",
      width: 200,
      height: 150,
      borderRadius: 12,
      overflow: "hidden",
      border: `2px solid ${color || "#4ECDC4"}`,
      background: "#1A1A2E",
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isSelf}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: isSelf ? "scaleX(-1)" : "none",
        }}
      />
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: "4px 8px",
        background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
        color: "#fff",
        fontSize: 12,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        fontWeight: 600,
      }}>
        {isSelf ? "You" : name}
      </div>
      {isSelf && (
        <div style={{
          position: "absolute",
          top: 6,
          right: 6,
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "#4ECDC4",
          boxShadow: "0 0 6px #4ECDC4",
        }} />
      )}
    </div>
  );
}

export default function VideoOverlay({
  remoteStreams,
  localStream,
  players,
  activePeers,
}) {
  const activeIds = Object.keys(activePeers);
  const hasActive = activeIds.length > 0;

  if (!hasActive && !localStream) return null;

  return (
    <div style={{
      position: "fixed",
      top: 16,
      right: 16,
      display: "flex",
      flexDirection: "column",
      gap: 8,
      zIndex: 100,
      maxHeight: "calc(100vh - 32px)",
      overflowY: "auto",
    }}>
      {/* Local video (only show when in a call) */}
      {hasActive && localStream && (
        <VideoTile
          stream={localStream}
          name="You"
          color="#4ECDC4"
          isSelf
        />
      )}

      {/* Remote videos */}
      {activeIds.map((peerId) => {
        const stream = remoteStreams[peerId];
        const player = players[peerId];
        if (!stream) return null;
        return (
          <VideoTile
            key={peerId}
            stream={stream}
            name={player?.name || "Unknown"}
            color={player?.color}
            isSelf={false}
          />
        );
      })}
    </div>
  );
}
