import { useState, useRef, useEffect, useCallback } from "react";

// ── Media Test Component ─────────────────────────────────────
function MediaTest({ onDone }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const analyserRef = useRef(null);
  const animRef = useRef(null);
  const [camOk, setCamOk] = useState(null);
  const [micOk, setMicOk] = useState(null);
  const [micLevel, setMicLevel] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;

        // Video
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCamOk(stream.getVideoTracks().length > 0 && stream.getVideoTracks()[0].enabled);

        // Audio analyser
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;
        setMicOk(stream.getAudioTracks().length > 0);

        // Animate mic level
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          if (cancelled) return;
          analyser.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          setMicLevel(Math.min(100, Math.round(avg * 1.5)));
          animRef.current = requestAnimationFrame(tick);
        };
        tick();
      } catch (err) {
        if (!cancelled) {
          setError(err.name === "NotAllowedError" ? "Permission denied" : err.message);
          setCamOk(false);
          setMicOk(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  const stopAndContinue = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    onDone();
  }, [onDone]);

  const statusDot = (ok) => ({
    display: "inline-block",
    width: 8, height: 8,
    borderRadius: "50%",
    marginRight: 8,
    background: ok === null ? "#888" : ok ? "#4ECDC4" : "#E05050",
    boxShadow: ok ? "0 0 6px rgba(78,205,196,0.5)" : "none",
  });

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Video preview */}
      <div style={{
        position: "relative",
        width: "100%",
        height: 180,
        borderRadius: 12,
        overflow: "hidden",
        background: "#000",
        border: "1px solid rgba(255,255,255,0.1)",
        marginBottom: 16,
      }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: "scaleX(-1)",
          }}
        />
        {camOk === false && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "rgba(255,255,255,0.4)", fontSize: 14,
          }}>
            Camera unavailable
          </div>
        )}
      </div>

      {/* Status indicators */}
      <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
        <div style={{ flex: 1, padding: "10px 12px", background: "rgba(255,255,255,0.04)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>
            <span style={statusDot(camOk)} />Camera
          </div>
          <div style={{ fontSize: 13, color: camOk ? "#4ECDC4" : camOk === false ? "#E05050" : "#888", fontWeight: 600 }}>
            {camOk === null ? "Checking..." : camOk ? "Working" : "Not available"}
          </div>
        </div>
        <div style={{ flex: 1, padding: "10px 12px", background: "rgba(255,255,255,0.04)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>
            <span style={statusDot(micOk)} />Microphone
          </div>
          <div style={{ fontSize: 13, color: micOk ? "#4ECDC4" : micOk === false ? "#E05050" : "#888", fontWeight: 600 }}>
            {micOk === null ? "Checking..." : micOk ? "Working" : "Not available"}
          </div>
        </div>
      </div>

      {/* Mic level bar */}
      {micOk && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>Mic level</div>
          <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${micLevel}%`,
              borderRadius: 3,
              background: micLevel > 60 ? "#4ECDC4" : micLevel > 20 ? "#44B09E" : "rgba(78,205,196,0.4)",
              transition: "width 0.1s",
            }} />
          </div>
        </div>
      )}

      {error && (
        <div style={{ fontSize: 12, color: "#E05050", marginBottom: 8, textAlign: "center" }}>
          {error}
        </div>
      )}

      <button
        onClick={stopAndContinue}
        style={{
          width: "100%",
          padding: "10px",
          fontSize: 13,
          fontWeight: 600,
          color: "rgba(255,255,255,0.7)",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8,
          cursor: "pointer",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => e.target.style.background = "rgba(255,255,255,0.1)"}
        onMouseLeave={(e) => e.target.style.background = "rgba(255,255,255,0.06)"}
      >
        Looks good, continue
      </button>
    </div>
  );
}

// ── Login Screen ─────────────────────────────────────────────
export default function LoginScreen({ onJoin }) {
  const [name, setName] = useState("");
  const [mediaTested, setMediaTested] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) onJoin(trimmed);
  };

  return (
    <div style={{
      position: "fixed", inset: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "#0F0F1A",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(rgba(78,205,196,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(78,205,196,0.05) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
        animation: "gridMove 20s linear infinite",
      }} />

      <div style={{
        position: "relative",
        background: "rgba(26,26,46,0.9)",
        border: "1px solid rgba(78,205,196,0.2)",
        borderRadius: 20,
        padding: "40px 36px",
        width: 420,
        maxWidth: "90vw",
        backdropFilter: "blur(20px)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.5), 0 0 120px rgba(78,205,196,0.08)",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <span style={{
            display: "inline-block", width: 48, height: 48,
            borderRadius: 14,
            background: "linear-gradient(135deg, #4ECDC4, #44B09E)",
            lineHeight: "48px", fontSize: 24, fontWeight: 800,
            color: "#fff",
            boxShadow: "0 4px 20px rgba(78,205,196,0.3)",
          }}>G</span>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#FFF", margin: "10px 0 4px", letterSpacing: "-0.5px" }}>
            Gather Clone
          </h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0 }}>
            Virtual office with proximity video chat
          </p>
        </div>

        {/* Media test - shown first, then hidden */}
        {!mediaTested && (
          <MediaTest onDone={() => setMediaTested(true)} />
        )}

        {/* Name input + join - shown after media test */}
        {mediaTested && (
          <form onSubmit={handleSubmit}>
            <label style={{
              display: "block", fontSize: 12, fontWeight: 600,
              color: "rgba(255,255,255,0.5)", marginBottom: 8,
              textTransform: "uppercase", letterSpacing: "0.5px",
            }}>
              Your name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name..."
              maxLength={20}
              autoFocus
              style={{
                width: "100%", padding: "14px 16px", fontSize: 16,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10, color: "#FFF", outline: "none",
                transition: "border-color 0.2s, box-shadow 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "rgba(78,205,196,0.5)";
                e.target.style.boxShadow = "0 0 0 3px rgba(78,205,196,0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(255,255,255,0.1)";
                e.target.style.boxShadow = "none";
              }}
            />
            <button
              type="submit"
              disabled={!name.trim()}
              style={{
                width: "100%", marginTop: 16, padding: "14px",
                fontSize: 16, fontWeight: 700, color: "#FFF",
                background: name.trim() ? "linear-gradient(135deg, #4ECDC4, #44B09E)" : "rgba(255,255,255,0.06)",
                border: "none", borderRadius: 10,
                cursor: name.trim() ? "pointer" : "not-allowed",
                transition: "transform 0.15s, box-shadow 0.15s, opacity 0.15s",
                opacity: name.trim() ? 1 : 0.4,
                boxShadow: name.trim() ? "0 4px 20px rgba(78,205,196,0.3)" : "none",
              }}
              onMouseDown={(e) => { if (name.trim()) e.target.style.transform = "scale(0.97)"; }}
              onMouseUp={(e) => { e.target.style.transform = "scale(1)"; }}
            >
              Enter Space
            </button>
          </form>
        )}

        {/* Controls hint */}
        <div style={{
          marginTop: 20, padding: "10px 14px",
          background: "rgba(255,255,255,0.03)", borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.06)",
        }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0, textAlign: "center", lineHeight: 1.5 }}>
            Move with <kbd style={kbdStyle}>W</kbd><kbd style={kbdStyle}>A</kbd><kbd style={kbdStyle}>S</kbd><kbd style={kbdStyle}>D</kbd> or arrow keys. Walk near others for video chat.
          </p>
        </div>
      </div>

      <style>{`@keyframes gridMove { 0% { transform: translate(0,0); } 100% { transform: translate(48px,48px); } }`}</style>
    </div>
  );
}

const kbdStyle = {
  display: "inline-block", padding: "2px 6px", margin: "0 2px",
  fontSize: 10, fontFamily: "monospace",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 4, color: "rgba(255,255,255,0.5)",
};
