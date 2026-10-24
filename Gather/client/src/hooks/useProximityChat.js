import { useState, useEffect, useRef, useCallback } from "react";
import SimplePeer from "simple-peer";
import socket from "../utils/socket";

export default function useProximityChat(players, myId, proximityRadius, zenMode = false) {
  const [activePeers, setActivePeers] = useState({});
  const [remoteStreams, setRemoteStreams] = useState({});
  const [localStream, setLocalStream] = useState(null);
  const localStreamRef = useRef(null);
  const peersRef = useRef({});
  const nearbyRef = useRef(new Set());

  // Conversation state
  const [conversations, setConversations] = useState({});   // { convId: { members, memberNames } }
  const [myConvId, setMyConvId] = useState(null);            // which conv I'm in
  const [pendingRequests, setPendingRequests] = useState([]); // incoming join requests
  const [requestStatus, setRequestStatus] = useState(null);  // "pending" | "approved" | "denied" | null
  const [nearbyPlayers, setNearbyPlayers] = useState({});    // { playerId: true } for all players within proximity radius

  const acquireStream = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 320 }, height: { ideal: 240 }, frameRate: { ideal: 15 } },
        audio: true,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.warn("Could not access media devices:", err.message);
      return null;
    }
  }, []);

  const releaseStream = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }
  }, []);

  const getDistance = useCallback((p1, p2) => {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
  }, []);

  const cleanupPeer = useCallback((targetId) => {
    const peer = peersRef.current[targetId];
    if (peer) { peer.destroy(); delete peersRef.current[targetId]; }
    setActivePeers((prev) => { const n = { ...prev }; delete n[targetId]; return n; });
    setRemoteStreams((prev) => { const n = { ...prev }; delete n[targetId]; return n; });
  }, []);

  const createPeer = useCallback(async (targetId, initiator) => {
    if (peersRef.current[targetId]) return;
    const stream = await acquireStream();
    if (!stream) return;

    const peer = new SimplePeer({
      initiator, trickle: true, stream,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      },
    });

    peer.on("signal", (signal) => {
      socket.emit("webrtc:signal", { to: targetId, signal });
    });
    peer.on("stream", (remoteStream) => {
      setRemoteStreams((prev) => ({ ...prev, [targetId]: remoteStream }));
    });
    peer.on("close", () => cleanupPeer(targetId));
    peer.on("error", (err) => {
      console.warn(`Peer error with ${targetId}:`, err.message);
      cleanupPeer(targetId);
    });

    peersRef.current[targetId] = peer;
    setActivePeers((prev) => ({ ...prev, [targetId]: true }));
  }, [acquireStream, cleanupPeer]);

  // Request to join a conversation
  const requestJoin = useCallback((convId) => {
    socket.emit("conv:request", { convId });
    setRequestStatus("pending");
  }, []);

  // Respond to an incoming join request
  const respondToRequest = useCallback((requesterId, approve, convId) => {
    if (approve) {
      socket.emit("conv:approve", { convId, requesterId });
    } else {
      socket.emit("conv:deny", { convId, requesterId });
    }
    // Remove from pending
    setPendingRequests((prev) => prev.filter((r) => r.requesterId !== requesterId));
  }, []);

  // Leave current conversation
  const leaveConversation = useCallback(() => {
    socket.emit("conv:leave");
    // Cleanup all peers
    Object.keys(peersRef.current).forEach(cleanupPeer);
    setMyConvId(null);
    releaseStream();
  }, [cleanupPeer, releaseStream]);

  // Handle incoming WebRTC signals
  useEffect(() => {
    socket.on("webrtc:signal", async (data) => {
      const peer = peersRef.current[data.from];
      if (peer) {
        peer.signal(data.signal);
      } else {
        await createPeer(data.from, false);
        setTimeout(() => {
          const p = peersRef.current[data.from];
          if (p) p.signal(data.signal);
        }, 100);
      }
    });
    socket.on("webrtc:request", async (data) => { await createPeer(data.from, false); });
    socket.on("webrtc:end", (data) => { cleanupPeer(data.from); });

    return () => {
      socket.off("webrtc:signal");
      socket.off("webrtc:request");
      socket.off("webrtc:end");
    };
  }, [createPeer, cleanupPeer]);

  // Handle conversation events from server
  useEffect(() => {
    socket.on("conv:update", (data) => {
      setConversations((prev) => ({
        ...prev,
        [data.convId]: { members: data.members, memberNames: data.memberNames },
      }));
      // Check if I'm in this conversation
      if (data.members.includes(myId)) {
        setMyConvId(data.convId);
      }
    });

    socket.on("conv:dissolved", (data) => {
      setConversations((prev) => {
        const n = { ...prev };
        delete n[data.convId];
        return n;
      });
      setMyConvId((prev) => prev === data.convId ? null : prev);
    });

    socket.on("conv:ended", () => {
      // My conversation was dissolved (only 1 left after someone left)
      setMyConvId(null);
      Object.keys(peersRef.current).forEach(cleanupPeer);
      releaseStream();
    });

    socket.on("conv:join-request", (data) => {
      setPendingRequests((prev) => {
        if (prev.some((r) => r.requesterId === data.requesterId)) return prev;
        return [...prev, data];
      });
      // Auto-dismiss after 15s
      setTimeout(() => {
        setPendingRequests((prev) => prev.filter((r) => r.requesterId !== data.requesterId));
      }, 15000);
    });

    socket.on("conv:approved", async (data) => {
      setRequestStatus("approved");
      setMyConvId(data.convId);
      setTimeout(() => setRequestStatus(null), 2000);
    });

    socket.on("conv:denied", () => {
      setRequestStatus("denied");
      setTimeout(() => setRequestStatus(null), 3000);
    });

    socket.on("conv:connect-to", async (data) => {
      // Server tells us to connect to a peer in the conversation
      await createPeer(data.peerId, true);
    });

    socket.on("conv:member-added", async (data) => {
      // A new member was added to our conversation, they'll initiate
      // We just wait for the incoming signal
    });

    return () => {
      socket.off("conv:update");
      socket.off("conv:dissolved");
      socket.off("conv:ended");
      socket.off("conv:join-request");
      socket.off("conv:approved");
      socket.off("conv:denied");
      socket.off("conv:connect-to");
      socket.off("conv:member-added");
    };
  }, [myId, createPeer, cleanupPeer, releaseStream]);

  // Proximity check loop — conversation aware
  useEffect(() => {
    if (!myId || !players[myId]) return;

    const checkProximity = () => {
      const me = players[myId];
      if (!me) {
        setNearbyPlayers({});
        return;
      }

      const currentNearby = new Set();

      Object.values(players).forEach((player) => {
        if (player.id === myId) return;
        if (getDistance(me, player) <= proximityRadius) {
          currentNearby.add(player.id);

          // Only auto-connect if NEITHER player is in a conversation
          const theirConvId = findPlayerConv(player.id);
          const myConv = findPlayerConv(myId);

          if (!nearbyRef.current.has(player.id) && !peersRef.current[player.id]) {
            if (!zenMode && !theirConvId && !myConv) {
              // Neither in a conv and not in zen mode — auto-connect and start a conversation
              if (myId < player.id) {
                createPeer(player.id, true);
                socket.emit("conv:start", { withId: player.id });
              }
            }
          }
        }
      });

      // Cleanup when walking away (only if not in a conversation)
      nearbyRef.current.forEach((id) => {
        if (!currentNearby.has(id)) {
          const myConv = findPlayerConv(myId);
          const theirConv = findPlayerConv(id);
          // Only auto-disconnect if we're not in the same conversation
          if (!myConv || myConv !== theirConv) {
            socket.emit("webrtc:end", { to: id });
            cleanupPeer(id);
          }
        }
      });

      nearbyRef.current = currentNearby;

      // Expose nearby players at a fixed notification radius (always 4 tiles)
      // so zen mode (radius=1) still shows activity notifications
      const NOTIFY_RADIUS = 4;
      const notifyNearby = new Set();
      Object.values(players).forEach((player) => {
        if (player.id === myId) return;
        if (getDistance(me, player) <= NOTIFY_RADIUS) notifyNearby.add(player.id);
      });
      setNearbyPlayers(Object.fromEntries([...notifyNearby].map((id) => [id, true])));

      // Release camera when nobody is nearby and not in a conversation
      if (currentNearby.size === 0 && Object.keys(peersRef.current).length === 0) {
        releaseStream();
      }
    };

    // Helper: find which conversation a player is in
    function findPlayerConv(playerId) {
      for (const [convId, conv] of Object.entries(conversations)) {
        if (conv.members.includes(playerId)) return convId;
      }
      return null;
    }

    const interval = setInterval(checkProximity, 500);
    return () => clearInterval(interval);
  }, [players, myId, proximityRadius, zenMode, conversations, getDistance, createPeer, cleanupPeer, releaseStream]);

  useEffect(() => {
    return () => {
      Object.keys(peersRef.current).forEach(cleanupPeer);
      releaseStream();
    };
  }, [cleanupPeer, releaseStream]);

  // Compute nearby conversations for the UI — always use radius 5 so
  // zen mode users still see conversations they could request to join
  const nearbyConversations = (() => {
    if (!myId || !players[myId]) return [];
    const me = players[myId];
    const result = [];
    const myConv = Object.entries(conversations).find(([, c]) => c.members.includes(myId));

    Object.entries(conversations).forEach(([convId, conv]) => {
      if (myConv && myConv[0] === convId) return; // Skip my own conv
      // Check if any member is within 5 tiles (independent of proximityRadius)
      const hasNearbyMember = conv.members.some((mid) => {
        const p = players[mid];
        if (!p) return false;
        return getDistance(me, p) <= 5;
      });
      if (hasNearbyMember) {
        result.push({ convId, ...conv });
      }
    });
    return result;
  })();

  return {
    activePeers, remoteStreams, localStream,
    nearbyPlayers,
    // Conversation state
    conversations, myConvId, nearbyConversations,
    pendingRequests, requestStatus,
    // Actions
    requestJoin, respondToRequest, leaveConversation,
  };
}
