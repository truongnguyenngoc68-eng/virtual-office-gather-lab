export default function HUD({
  players, myId, connected,
  myConvId, nearbyConversations, pendingRequests, requestStatus,
  conversations,
  onRequestJoin, onRespondToRequest, onLeaveConversation,
}) {
  const playerCount = Object.keys(players).length;
  const me = players[myId];

  const box = {
    background: "rgba(20,25,35,0.9)",
    border: "1px solid rgba(100,150,200,0.3)",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    backdropFilter: "blur(8px)",
  };

  const myConv = myConvId && conversations?.[myConvId];

  return (
    <>
      {/* Top-left: Status */}
      <div style={{
        position: "fixed", top: 12, left: 12, zIndex: 50,
        display: "flex", alignItems: "center", gap: 8,
        ...box, borderRadius: 6, padding: "6px 14px",
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: "50%",
          background: connected ? "#4CAF50" : "#E53935",
          boxShadow: connected ? "0 0 6px #4CAF50" : "0 0 6px #E53935",
        }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: "#B0C4DE" }}>
          {playerCount} online
        </span>
      </div>

      {/* Bottom-left: Team list */}
      <div style={{
        position: "fixed", bottom: 12, left: 12, zIndex: 50,
        ...box, borderRadius: 6, padding: "10px 14px",
        maxHeight: 200, overflowY: "auto", minWidth: 150,
      }}>
        <div style={{
          fontSize: 10, fontWeight: 700, color: "#4A90D0",
          textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6,
          borderBottom: "1px solid rgba(74,144,208,0.3)", paddingBottom: 4,
        }}>
          Team
        </div>
        {Object.values(players).map((player) => {
          const isMe = player.id === myId;
          const shirt = player.style?.shirt || "#4A90D0";
          return (
            <div key={player.id} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "3px 0",
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: 2,
                background: shirt,
                border: isMe ? "1px solid #4A90D0" : "1px solid #444",
                flexShrink: 0,
              }} />
              <span style={{
                fontSize: 11,
                color: isMe ? "#4A90D0" : "#8898AA",
                fontWeight: isMe ? 700 : 400,
              }}>
                {player.name}{isMe ? " (you)" : ""}
              </span>
            </div>
          );
        })}
      </div>

      {/* Bottom-center: Controls + Conversation info */}
      <div style={{
        position: "fixed", bottom: 12, left: "50%",
        transform: "translateX(-50%)", zIndex: 50,
        ...box, borderRadius: 6, padding: "6px 14px",
        fontSize: 11, color: "#6B7B8D",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
      }}>
        {myConv ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "#4ECDC4",
              boxShadow: "0 0 6px #4ECDC4",
              animation: "pulse 1.5s infinite",
            }} />
            <span style={{ color: "#4ECDC4", fontWeight: 600 }}>
              In conversation with {Object.values(myConv.memberNames || {}).filter((n) => n !== players[myId]?.name).join(", ")}
            </span>
            <button
              onClick={onLeaveConversation}
              style={{
                background: "rgba(229,57,53,0.2)",
                border: "1px solid rgba(229,57,53,0.5)",
                color: "#E53935",
                borderRadius: 4,
                padding: "2px 8px",
                fontSize: 10,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Leave
            </button>
          </div>
        ) : (
          me && <span>Walk near colleagues for video chat</span>
        )}
      </div>

      {/* Nearby conversations — "Request to join" */}
      {!myConvId && nearbyConversations && nearbyConversations.length > 0 && (
        <div style={{
          position: "fixed", bottom: 60, left: "50%",
          transform: "translateX(-50%)", zIndex: 51,
          display: "flex", flexDirection: "column", gap: 6,
        }}>
          {nearbyConversations.map((conv) => (
            <div key={conv.convId} style={{
              ...box, borderRadius: 8, padding: "8px 14px",
              border: "1px solid rgba(78,205,196,0.4)",
              display: "flex", alignItems: "center", gap: 10,
              animation: "slideUp 0.3s ease-out",
            }}>
              <div style={{
                width: 10, height: 10, borderRadius: "50%",
                background: "#4ECDC4",
                boxShadow: "0 0 8px #4ECDC4",
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: "#B0C4DE", fontWeight: 600 }}>
                  {Object.values(conv.memberNames || {}).join(", ")} are talking
                </div>
              </div>
              <button
                onClick={() => onRequestJoin(conv.convId)}
                disabled={requestStatus === "pending"}
                style={{
                  background: requestStatus === "pending"
                    ? "rgba(78,205,196,0.1)"
                    : "rgba(78,205,196,0.2)",
                  border: "1px solid rgba(78,205,196,0.5)",
                  color: "#4ECDC4",
                  borderRadius: 4,
                  padding: "4px 12px",
                  fontSize: 11,
                  cursor: requestStatus === "pending" ? "default" : "pointer",
                  fontWeight: 600,
                  opacity: requestStatus === "pending" ? 0.6 : 1,
                }}
              >
                {requestStatus === "pending" ? "Waiting..." : "Request to join"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Request status feedback */}
      {requestStatus === "approved" && (
        <div style={{
          position: "fixed", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)", zIndex: 200,
          ...box, borderRadius: 12, padding: "16px 24px",
          border: "2px solid #4CAF50",
          color: "#4CAF50", fontSize: 16, fontWeight: 700,
          animation: "fadeIn 0.3s ease-out",
        }}>
          Approved! Joining conversation...
        </div>
      )}
      {requestStatus === "denied" && (
        <div style={{
          position: "fixed", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)", zIndex: 200,
          ...box, borderRadius: 12, padding: "16px 24px",
          border: "2px solid #E53935",
          color: "#E53935", fontSize: 16, fontWeight: 700,
          animation: "fadeIn 0.3s ease-out",
        }}>
          Request declined
        </div>
      )}

      {/* Incoming join requests */}
      {pendingRequests && pendingRequests.length > 0 && (
        <div style={{
          position: "fixed", top: 50, right: 16, zIndex: 150,
          display: "flex", flexDirection: "column", gap: 8,
        }}>
          {pendingRequests.map((req) => (
            <div key={req.requesterId} style={{
              ...box, borderRadius: 8, padding: "10px 14px",
              border: "1px solid rgba(255,193,7,0.5)",
              animation: "slideIn 0.3s ease-out",
              minWidth: 220,
            }}>
              <div style={{
                fontSize: 12, color: "#FFD54F", fontWeight: 600, marginBottom: 8,
              }}>
                {req.requesterName} wants to join
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => onRespondToRequest(req.requesterId, true, req.convId)}
                  style={{
                    flex: 1,
                    background: "rgba(76,175,80,0.2)",
                    border: "1px solid rgba(76,175,80,0.5)",
                    color: "#4CAF50",
                    borderRadius: 4,
                    padding: "4px 8px",
                    fontSize: 11,
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Approve
                </button>
                <button
                  onClick={() => onRespondToRequest(req.requesterId, false, req.convId)}
                  style={{
                    flex: 1,
                    background: "rgba(229,57,53,0.2)",
                    border: "1px solid rgba(229,57,53,0.5)",
                    color: "#E53935",
                    borderRadius: 4,
                    padding: "4px 8px",
                    fontSize: 11,
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CSS animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </>
  );
}
