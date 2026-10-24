export default function ZenMode({ onToggle, zenMode, nearbyPlayers = {}, players = {} }) {
    const nearbyPeerIds = Object.keys(nearbyPlayers);

    return (
        <>
            {/* Nearby users panel — only visible in zen mode */}
            {zenMode && nearbyPeerIds.length > 0 && (
                <div style={{
                    position: "fixed",
                    bottom: 76,
                    right: 16,
                    zIndex: 56,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    fontFamily: "'Segoe UI', system-ui, sans-serif",
                }}>
                    {nearbyPeerIds.map((peerId) => (
                        <div key={peerId} style={{
                            background: "rgba(20,25,35,0.95)",
                            border: "1px solid rgba(78,205,196,0.4)",
                            borderRadius: 8,
                            padding: "8px 14px",
                            backdropFilter: "blur(8px)",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            animation: "zenSlideIn 0.25s ease-out",
                        }}>
                            <div style={{
                                width: 7, height: 7, borderRadius: "50%",
                                background: "#4ECDC4", boxShadow: "0 0 5px #4ECDC4", flexShrink: 0,
                            }} />
                            <span style={{ fontSize: 12, color: "#B0C4DE", fontWeight: 600 }}>
                                {players[peerId]?.name || "Someone"} is nearby
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Toggle button */}
            <div style={{
                position: "fixed",
                bottom: 16,
                right: 16,
                zIndex: 56,
            }}>
                <button
                    onClick={onToggle}
                    title={zenMode ? "Zen Mode: ON — click to disable" : "Zen Mode: OFF — click to enable"}
                    style={{
                        background: zenMode ? "rgba(78,205,196,0.15)" : "rgba(20,25,35,0.9)",
                        border: `2px solid ${zenMode ? "rgba(78,205,196,0.9)" : "rgba(100,150,200,0.4)"}`,
                        borderRadius: "50%",
                        width: 48,
                        height: 48,
                        fontSize: 22,
                        cursor: "pointer",
                        backdropFilter: "blur(8px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s",
                        boxShadow: zenMode ? "0 0 14px rgba(78,205,196,0.4)" : "0 2px 8px rgba(0,0,0,0.3)",
                    }}
                >
                    🧘
                </button>
            </div>

            <style>{`
                @keyframes zenSlideIn {
                    from { opacity: 0; transform: translateX(12px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
            `}</style>
        </>
    );
}

