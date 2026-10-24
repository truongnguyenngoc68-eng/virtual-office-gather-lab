import mediasoup from "mediasoup";
import type { Server, Socket } from "socket.io";

// Type inference from mediasoup instances - these types are not directly exported
type Worker = Awaited<ReturnType<typeof mediasoup.createWorker>>;
type Router = Awaited<ReturnType<Worker["createRouter"]>>;
type WebRtcTransport = Awaited<ReturnType<Router["createWebRtcTransport"]>>;
type Producer = Awaited<ReturnType<WebRtcTransport["produce"]>>;
type Consumer = Awaited<ReturnType<WebRtcTransport["consume"]>>;

// Parameter types inferred from properties and method signatures
type RtpCapabilities = Router["rtpCapabilities"];
type DtlsParameters = WebRtcTransport["dtlsParameters"];
type IceParameters = WebRtcTransport["iceParameters"];
type IceCandidate = WebRtcTransport["iceCandidates"][number];
type RtpParameters = Parameters<WebRtcTransport["produce"]>[0]["rtpParameters"];

type Direction = "send" | "recv";

type SFUTransportParams = {
  id: string;
  iceParameters: IceParameters;
  iceCandidates: IceCandidate[];
  dtlsParameters: DtlsParameters;
};

type ProducerInfo = {
  producerId: string;
  userId: string;
  kind: "audio" | "video";
};

type MediaState = {
  userId: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
};

type RoomPeer = {
  socketId: string;
  userId: string;
  transports: Map<string, WebRtcTransport>;
  producers: Map<string, Producer>;
  consumers: Map<string, Consumer>;
};

type SFURoom = {
  roomKey: string; // `${roomId}:${channelId}`
  router: Router;
  peers: Map<string, RoomPeer>; // socketId -> peer
  producers: Map<string, ProducerInfo>; // producerId -> info
  mediaStates: Map<string, MediaState>; // userId -> state
};

let worker: Worker | null = null;
const rooms = new Map<string, SFURoom>();

function getListenIp() {
  // Local demo: no need announcedIp; keep env override for later deploy
  const ip = process.env.WEBRTC_LISTEN_IP || "0.0.0.0";
  const announcedIp = process.env.WEBRTC_ANNOUNCED_IP || undefined;
  return { ip, announcedIp };
}

async function ensureWorker(): Promise<Worker> {
  if (worker) return worker;
  worker = await mediasoup.createWorker({
    rtcMinPort: Number(process.env.WEBRTC_MIN_PORT || 40000),
    rtcMaxPort: Number(process.env.WEBRTC_MAX_PORT || 49999),
    logLevel: (process.env.MEDIASOUP_LOG_LEVEL as any) || "warn",
    logTags: (process.env.MEDIASOUP_LOG_TAGS?.split(",") as any) || undefined,
  });

  worker.on("died", () => {
    console.error("❌ mediasoup worker died, exiting in 2s...");
    setTimeout(() => process.exit(1), 2000);
  });

  console.log("✅ mediasoup worker created");
  return worker;
}

async function getOrCreateRoom(roomId: string, channelId: string): Promise<SFURoom> {
  const roomKey = `${roomId}:${channelId}`;
  const existing = rooms.get(roomKey);
  if (existing) return existing;

  const w = await ensureWorker();
  const mediaCodecs = [
    {
      kind: "audio",
      mimeType: "audio/opus",
      clockRate: 48000,
      channels: 2,
    },
    {
      kind: "video",
      mimeType: "video/VP8",
      clockRate: 90000,
      parameters: {
        "x-google-start-bitrate": 800,
      },
    },
  ] as any;

  const router = await w.createRouter({ mediaCodecs });
  const room: SFURoom = {
    roomKey,
    router,
    peers: new Map(),
    producers: new Map(),
    mediaStates: new Map(),
  };
  rooms.set(roomKey, room);
  console.log(`✅ SFU room created: ${roomKey}`);
  return room;
}

async function createWebRtcTransport(router: Router): Promise<WebRtcTransport> {
  const { ip, announcedIp } = getListenIp();
  const transport = await router.createWebRtcTransport({
    listenIps: [{ ip, announcedIp }],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
    initialAvailableOutgoingBitrate: Number(process.env.WEBRTC_INITIAL_BITRATE || 800_000),
  });

  transport.on("dtlsstatechange", (dtlsState) => {
    if (dtlsState === "closed") {
      transport.close();
    }
  });

  return transport;
}

function serializeTransport(transport: WebRtcTransport): SFUTransportParams {
  return {
    id: transport.id,
    iceParameters: transport.iceParameters,
    iceCandidates: transport.iceCandidates,
    dtlsParameters: transport.dtlsParameters,
  };
}

function cleanupPeer(room: SFURoom, socketId: string) {
  const peer = room.peers.get(socketId);
  if (!peer) return;

  peer.consumers.forEach((c) => c.close());
  peer.producers.forEach((p) => {
    room.producers.delete(p.id);
    p.close();
  });
  peer.transports.forEach((t) => t.close());

  // Remove media state for this user
  room.mediaStates.delete(peer.userId);
  // no-op (kept for debugging hooks)

  room.peers.delete(socketId);

  if (room.peers.size === 0) {
    rooms.delete(room.roomKey);
    console.log(`🧹 SFU room cleaned up (empty): ${room.roomKey}`);
  }
}

export function registerSFUHandlers(io: Server, socket: Socket) {
  // Join SFU room (router)
  socket.on(
    "sfu:join",
    async (
      data: { roomId: string; channelId: string; userId: string },
      cb: (resp: { ok: true; rtpCapabilities: RtpCapabilities; producers: ProducerInfo[]; mediaStates: MediaState[] } | { ok: false; error: string }) => void
    ) => {
      try {
        const { roomId, channelId, userId } = data;
        const room = await getOrCreateRoom(roomId, channelId);

        if (!room.peers.has(socket.id)) {
          room.peers.set(socket.id, {
            socketId: socket.id,
            userId,
            transports: new Map(),
            producers: new Map(),
            consumers: new Map(),
          });
        }

        // Default media state if not set yet
        if (!room.mediaStates.has(userId)) {
          room.mediaStates.set(userId, { userId, audioEnabled: true, videoEnabled: true });
        }

        cb({
          ok: true,
          rtpCapabilities: room.router.rtpCapabilities,
          producers: Array.from(room.producers.values()),
          mediaStates: Array.from(room.mediaStates.values()),
        });
      } catch (e: any) {
        cb({ ok: false, error: e?.message || "join failed" });
      }
    }
  );

  socket.on(
    "sfu:createTransport",
    async (
      data: { roomId: string; channelId: string; direction: Direction },
      cb: (resp: { ok: true; params: SFUTransportParams } | { ok: false; error: string }) => void
    ) => {
      try {
        const { roomId, channelId } = data;
        const room = await getOrCreateRoom(roomId, channelId);
        const peer = room.peers.get(socket.id);
        if (!peer) return cb({ ok: false, error: "not joined" });

        const transport = await createWebRtcTransport(room.router);
        peer.transports.set(transport.id, transport);
        cb({ ok: true, params: serializeTransport(transport) });
      } catch (e: any) {
        cb({ ok: false, error: e?.message || "createTransport failed" });
      }
    }
  );

  socket.on(
    "sfu:connectTransport",
    async (
      data: { roomId: string; channelId: string; transportId: string; dtlsParameters: DtlsParameters },
      cb: (resp: { ok: true } | { ok: false; error: string }) => void
    ) => {
      try {
        const { roomId, channelId, transportId, dtlsParameters } = data;
        const roomKey = `${roomId}:${channelId}`;
        const room = rooms.get(roomKey);
        if (!room) return cb({ ok: false, error: "room not found" });
        const peer = room.peers.get(socket.id);
        if (!peer) return cb({ ok: false, error: "not joined" });
        const transport = peer.transports.get(transportId);
        if (!transport) return cb({ ok: false, error: "transport not found" });

        await transport.connect({ dtlsParameters });
        cb({ ok: true });
      } catch (e: any) {
        cb({ ok: false, error: e?.message || "connectTransport failed" });
      }
    }
  );

  socket.on(
    "sfu:produce",
    async (
      data: {
        roomId: string;
        channelId: string;
        transportId: string;
        kind: "audio" | "video";
        rtpParameters: RtpParameters;
      },
      cb: (resp: { ok: true; producerId: string } | { ok: false; error: string }) => void
    ) => {
      try {
        const { roomId, channelId, transportId, kind, rtpParameters } = data;
        const roomKey = `${roomId}:${channelId}`;
        const room = rooms.get(roomKey);
        if (!room) return cb({ ok: false, error: "room not found" });
        const peer = room.peers.get(socket.id);
        if (!peer) return cb({ ok: false, error: "not joined" });

        const transport = peer.transports.get(transportId);
        if (!transport) return cb({ ok: false, error: "transport not found" });

        const producer = await transport.produce({ kind, rtpParameters });
        peer.producers.set(producer.id, producer);
        room.producers.set(producer.id, { producerId: producer.id, userId: peer.userId, kind });

        producer.on("transportclose", () => {
          peer.producers.delete(producer.id);
          room.producers.delete(producer.id);
        });

        // Notify others in this SFU room
        socket.to(roomKey).emit("sfu:newProducer", {
          producerId: producer.id,
          userId: peer.userId,
          kind,
        } satisfies ProducerInfo);

        cb({ ok: true, producerId: producer.id });
      } catch (e: any) {
        cb({ ok: false, error: e?.message || "produce failed" });
      }
    }
  );

  socket.on(
    "sfu:consume",
    async (
      data: {
        roomId: string;
        channelId: string;
        transportId: string;
        producerId: string;
        rtpCapabilities: RtpCapabilities;
      },
      cb: (resp: { ok: true; params: { id: string; producerId: string; kind: "audio" | "video"; rtpParameters: RtpParameters; userId: string } } | { ok: false; error: string }) => void
    ) => {
      try {
        const { roomId, channelId, transportId, producerId, rtpCapabilities } = data;
        const roomKey = `${roomId}:${channelId}`;
        const room = rooms.get(roomKey);
        if (!room) return cb({ ok: false, error: "room not found" });
        const peer = room.peers.get(socket.id);
        if (!peer) return cb({ ok: false, error: "not joined" });

        const transport = peer.transports.get(transportId);
        if (!transport) return cb({ ok: false, error: "transport not found" });

        if (!room.router.canConsume({ producerId, rtpCapabilities })) {
          return cb({ ok: false, error: "cannot consume" });
        }

        const producerInfo = room.producers.get(producerId);
        if (!producerInfo) return cb({ ok: false, error: "producer not found" });

        const consumer = await transport.consume({
          producerId,
          rtpCapabilities,
          paused: true,
        });

        peer.consumers.set(consumer.id, consumer);

        consumer.on("transportclose", () => peer.consumers.delete(consumer.id));
        consumer.on("producerclose", () => {
          peer.consumers.delete(consumer.id);
          socket.emit("sfu:producerClosed", { producerId });
        });

        cb({
          ok: true,
          params: {
            id: consumer.id,
            producerId,
            kind: consumer.kind as any,
            rtpParameters: consumer.rtpParameters,
            userId: producerInfo.userId,
          },
        });
      } catch (e: any) {
        cb({ ok: false, error: e?.message || "consume failed" });
      }
    }
  );

  socket.on(
    "sfu:resume",
    async (
      data: { roomId: string; channelId: string; consumerId: string },
      cb: (resp: { ok: true } | { ok: false; error: string }) => void
    ) => {
      try {
        const { roomId, channelId, consumerId } = data;
        const roomKey = `${roomId}:${channelId}`;
        const room = rooms.get(roomKey);
        if (!room) return cb({ ok: false, error: "room not found" });
        const peer = room.peers.get(socket.id);
        if (!peer) return cb({ ok: false, error: "not joined" });
        const consumer = peer.consumers.get(consumerId);
        if (!consumer) return cb({ ok: false, error: "consumer not found" });
        await consumer.resume();
        cb({ ok: true });
      } catch (e: any) {
        cb({ ok: false, error: e?.message || "resume failed" });
      }
    }
  );

  socket.on("sfu:leave", (data: { roomId: string; channelId: string }) => {
    const roomKey = `${data.roomId}:${data.channelId}`;
    const room = rooms.get(roomKey);
    if (!room) return;
    cleanupPeer(room, socket.id);
  });

  socket.on("disconnect", () => {
    // Remove from all SFU rooms
    rooms.forEach((room) => cleanupPeer(room, socket.id));
  });

  // Allow clients to join a socket.io room for SFU broadcast
  socket.on("sfu:joinRoom", (data: { roomId: string; channelId: string }) => {
    const roomKey = `${data.roomId}:${data.channelId}`;
    socket.join(roomKey);
  });

  // Media state sync (mute/cam off) for UI
  socket.on("sfu:mediaState", (data: { roomId: string; channelId: string; userId: string; audioEnabled: boolean; videoEnabled: boolean }) => {
    const roomKey = `${data.roomId}:${data.channelId}`;
    const room = rooms.get(roomKey);
    if (!room) return;
    room.mediaStates.set(data.userId, {
      userId: data.userId,
      audioEnabled: !!data.audioEnabled,
      videoEnabled: !!data.videoEnabled,
    });
    io.to(roomKey).emit("sfu:mediaState", {
      userId: data.userId,
      audioEnabled: !!data.audioEnabled,
      videoEnabled: !!data.videoEnabled,
    } satisfies MediaState);
  });
}

