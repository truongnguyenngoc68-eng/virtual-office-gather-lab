import { useEffect, useRef } from "react";

interface VideoPlayerProps {
  stream: MediaStream | undefined | null;
  isLocal?: boolean;
  isVideoEnabled?: boolean;
  username?: string;
  className?: string;
}

/**
 * Shared VideoPlayer component for handling MediaStream display
 * Used by VoiceChannelView, VideoChat, and other video components
 */
export const VideoPlayer = ({
  stream,
  isLocal = false,
  isVideoEnabled = true,
  username,
  className = "w-full h-full object-cover bg-black",
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (stream) {
      // Check if video track is still active
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && videoTrack.readyState === "ended") {
        console.warn(
          `⚠️ Video track ended (Local: ${isLocal}${username ? `, User: ${username}` : ""}), stream may be invalid`
        );
        return;
      }

      // Only assign if different stream ID to avoid flickering
      if (videoEl.srcObject !== stream) {
        videoEl.srcObject = stream;
        videoEl.play().catch((e) => {
          console.warn(`⚠️ Autoplay blocked (Local: ${isLocal}):`, e);
        });
      } else {
        // Stream already assigned, but may need to resume
        if (videoEl.paused) {
          videoEl.play().catch((e) => {
            console.warn(`⚠️ Resume failed (Local: ${isLocal}):`, e);
          });
        }
      }

      // Monitor track state
      const checkTrackState = () => {
        if (videoTrack && videoTrack.readyState === "ended") {
          console.warn(
            `⚠️ Video track ended while playing (Local: ${isLocal}) - camera may be in use by another tab`
          );
        }
      };

      if (videoTrack) {
        videoTrack.addEventListener("ended", checkTrackState);
        return () => {
          videoTrack.removeEventListener("ended", checkTrackState);
        };
      }
    } else {
      if (videoEl.srcObject) {
        videoEl.srcObject = null;
      }
    }
  }, [stream, isLocal, username]);

  const handlePlay = () => {
    if (videoRef.current && stream) {
      videoRef.current.play().catch((e) => {
        console.warn(`⚠️ Play failed (Local: ${isLocal}):`, e);
      });
    }
  };

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={isLocal}
      className={className}
      style={{
        display: stream ? "block" : "none",
        opacity: stream && isVideoEnabled ? 1 : stream ? 0.3 : 0,
      }}
      onLoadedMetadata={handlePlay}
      onCanPlay={handlePlay}
      onError={(e) => {
        console.error(`❌ Video error (Local: ${isLocal}, Stream: ${stream?.id}):`, e);
        if (isLocal && stream) {
          const videoTrack = stream.getVideoTracks()[0];
          if (videoTrack && videoTrack.readyState === "ended") {
            console.error(`❌ Local video track ended - camera is in use by another tab/browser`);
          }
        }
      }}
    />
  );
};
