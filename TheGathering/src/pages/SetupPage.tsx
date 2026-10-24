import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Mic, MicOff, Video, VideoOff, Settings, ArrowLeft } from "lucide-react";

export default function SetupPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Load saved preferences
    const savedName = localStorage.getItem("userName");
    const savedCam = localStorage.getItem("cameraEnabled") === "true";
    const savedMic = localStorage.getItem("micEnabled") === "true";

    if (savedName) setDisplayName(savedName);
    
    // Attempt to get media stream
    requestMedia(savedCam, savedMic);

    return () => {
      stopStream();
    };
  }, []);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const requestMedia = async (wantVideo: boolean, wantAudio: boolean) => {
    try {
      if (!wantVideo && !wantAudio) {
        stopStream();
        setCameraEnabled(false);
        setMicEnabled(false);
        return;
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: wantVideo,
        audio: wantAudio
      });
      
      setStream(newStream);
      setCameraEnabled(wantVideo);
      setMicEnabled(wantAudio);
    } catch (err) {
      console.warn("Media access failed or denied:", err);
      // Even if failed, we update state to reflect "off"
      setCameraEnabled(false);
      setMicEnabled(false);
    }
  };

  const toggleCamera = () => {
    const newState = !cameraEnabled;
    setCameraEnabled(newState);
    // If we have a stream and just toggling video track
    if (stream) {
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = newState;
            // If turning on and no track exists (unlikely if stream exists but maybe limited), re-request
            // But usually getUserMedia with video=true gives a track.
            // If we started with audio-only, we might need to re-request stream.
            if (!videoTrack && newState) {
                requestMedia(true, micEnabled);
                return;
            }
        } else if (newState) {
             // Upgrading to video
             stopStream();
             requestMedia(true, micEnabled);
             return;
        }
    } else {
        if (newState) requestMedia(true, micEnabled);
    }
  };

  const toggleMic = () => {
    const newState = !micEnabled;
    setMicEnabled(newState);
    if (stream) {
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = newState;
        } else if (newState) {
            stopStream();
            requestMedia(cameraEnabled, true);
        }
    } else {
        if (newState) requestMedia(cameraEnabled, true);
    }
  };

  const handleJoin = () => {
    if (!displayName.trim()) {
      alert("Please enter your name");
      return;
    }
    
    // Save state
    localStorage.setItem("userName", displayName);
    localStorage.setItem("cameraEnabled", String(cameraEnabled));
    localStorage.setItem("micEnabled", String(micEnabled));
    if (roomId) localStorage.setItem("roomId", roomId);

    // Stop stream here effectively transfers control to next page (which will re-request)
    // Or we could keep it if we used a global context. For now, we follow standard flow: stop -> nav -> start.
    stopStream();

    navigate(`/app/${roomId}`);
  };

  return (
    <div className="min-h-screen bg-[#202124] text-white flex flex-col font-sans">
      {/* Header */}
      <div className="flex items-center px-6 py-4 border-b border-white/10">
        <button 
            onClick={() => navigate("/spaces")}
            className="p-2 mr-4 hover:bg-white/10 rounded-full transition-colors"
        >
            <ArrowLeft size={20} />
        </button>
        <span className="text-xl font-medium tracking-wide">Gather</span>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex w-full max-w-5xl gap-12 items-center flex-col md:flex-row">
            
            {/* Left: Video Preview */}
            <div className="flex-1 w-full md:max-w-xl">
                <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
                    {cameraEnabled && stream ? (
                        <video 
                            ref={videoRef}
                            autoPlay 
                            muted 
                            playsInline 
                            className="w-full h-full object-cover transform scale-x-[-1]" 
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#28292c]">
                            <div className="text-white/40 font-medium text-lg">Camera is off</div>
                        </div>
                    )}
                    
                    {/* Media Controls Overlay */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
                        <button 
                            onClick={toggleMic}
                            className={`p-4 rounded-full transition-all duration-200 border ${micEnabled ? 'bg-white/10 border-transparent hover:bg-white/20' : 'bg-red-500/90 border-red-500 hover:bg-red-600'}`}
                        >
                            {micEnabled ? <Mic size={24} /> : <MicOff size={24} />}
                        </button>
                        <button 
                            onClick={toggleCamera}
                            className={`p-4 rounded-full transition-all duration-200 border ${cameraEnabled ? 'bg-white/10 border-transparent hover:bg-white/20' : 'bg-red-500/90 border-red-500 hover:bg-red-600'}`}
                        >
                            {cameraEnabled ? <Video size={24} /> : <VideoOff size={24} />}
                        </button>
                        {/* Settings button placeholder */}
                        <div className="absolute right-[-60px] top-1/2 -translate-y-1/2">
                             <button className="p-3 rounded-full bg-black/40 text-white/70 hover:text-white hover:bg-black/60 transition-all">
                                <Settings size={20} />
                             </button>
                        </div>
                    </div>

                    {/* Mic Indicator (visual only for now) */}
                    {micEnabled && (
                        <div className="absolute top-4 right-4 w-3 h-3 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.6)]" />
                    )}
                </div>
            </div>

            {/* Right: Join Controls */}
            <div className="flex-1 w-full md:max-w-md flex flex-col gap-8">
                <div className="text-center md:text-left">
                    <h1 className="text-3xl font-bold mb-2">Welcome to {roomId || "Gather"}</h1>
                    <p className="text-gray-400">Get ready to join your team.</p>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Display Name</label>
                        <input 
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="What should we call you?"
                            className="bg-[#28292c] border border-white/10 rounded-xl px-4 py-4 text-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                        />
                    </div>
                    
                    <button 
                        onClick={handleJoin}
                        className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Join Gathering
                    </button>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}
