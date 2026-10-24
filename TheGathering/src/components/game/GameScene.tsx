import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import { useSocket } from "../../contexts/SocketContext";
import { useMap } from "../../contexts/MapContext";
import SimplifiedMap from "../ui/SimplifiedMap";
// NotificationPanel removed - using NotificationCenter in Sidebar instead
import { useNotifications } from "../../contexts/NotificationContext";
import {
  AssetLoader,
  AnimationManager,
  MapRenderer,
  ObjectManager,
  NPCManager,
  PlayerController,
  PlayerManager,
  SocketHandlers,
  ZoneIndicator,
  SpeechBubble,
} from ".";
import { ReactionDisplay } from "./ReactionDisplay";
import { composeAvatarSpriteSheetCanvas } from "../../utils/avatarComposer";

const GameScene = () => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const { socket, users, currentUser } = useSocket();
  const { mapData } = useMap();
  const [currentZone, setCurrentZone] = useState<{ id: string; name: string } | null>(null);
  const [interactionPrompt, setInteractionPrompt] = useState<string | null>(null);
  const [isOverviewMode, setIsOverviewMode] = useState(false);
  const isOverviewModeRef = useRef(false); // Ref for Phaser access
  const { unreadCount } = useNotifications();

  // Handle Escape key to close map
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOverviewMode(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    class MainScene extends Phaser.Scene {
      private playerContainer?: Phaser.GameObjects.Container;
      private playerSprite?: Phaser.GameObjects.Sprite;
      private otherPlayers: Map<
        string,
        { container: Phaser.GameObjects.Container; sprite: Phaser.GameObjects.Sprite; label: Phaser.GameObjects.Text }
      > = new Map();
      private mapRenderer = new MapRenderer();
      private npcManager = new NPCManager();
      private playerController = new PlayerController();
      private zoneIndicator = new ZoneIndicator();
      private reactionDisplay!: ReactionDisplay;
      private targetZoom = 1.5;
      private cleanupSocketHandlers?: () => void;

      constructor() {
        super({ key: "MainScene" });
      }

      preload() {
        AssetLoader.preload(this);
      }

      async create() {
        // Create Animations
        AnimationManager.createAllAnimations(this);

        // If user has a saved avatarConfig, compose it into a Phaser spritesheet texture
        // so the in-game character matches the editor avatar.
        let playerSpriteKey = "player";
        let playerSpriteScale = 1;
        try {
          const avatarConfig = (currentUser as any)?.avatarConfig;
          const userId = (currentUser as any)?.userId;
          if (avatarConfig && userId) {
            const key = `avatar-${userId}`;
            if (!this.textures.exists(key)) {
              const canvas = await composeAvatarSpriteSheetCanvas({ avatarConfig });
              if (canvas) {
                // Register as spritesheet (LPC 64x64)
                (this.textures as any).addSpriteSheet(key, canvas, {
                  frameWidth: 64,
                  frameHeight: 64,
                });
                AnimationManager.createCharacterAnimations(this, key, {
                  layout: "lpc",
                  frameWidth: 64,
                  frameHeight: 64,
                });
                playerSpriteKey = key;
                playerSpriteScale = 0.5; // 64px -> ~32px in world
              }
            } else {
              playerSpriteKey = key;
              playerSpriteScale = 0.5;
            }
          }
        } catch (e) {
          console.warn("Failed to compose avatar spritesheet, falling back:", e);
        }

        // Create Map
        const { wallLayer } = this.mapRenderer.createMap(this, mapData);

        // Create Player
        const playerData = PlayerManager.createPlayer(this, currentUser, wallLayer, {
          spriteKey: playerSpriteKey,
          scale: playerSpriteScale,
        });
        this.playerContainer = playerData.container;
        this.playerSprite = playerData.sprite;
        this.playerController.setPlayer(this.playerContainer, this.playerSprite);

        // Initialize ReactionDisplay
        this.reactionDisplay = new ReactionDisplay(this);

        // Create Office Objects (after player so collisions work)
        ObjectManager.createOfficeObjects(this, this.playerContainer);

        // Create NPCs
        this.npcManager.createNPC(this, 200, 200, "Receptionist", this.playerContainer);
        this.npcManager.createNPC(this, 400, 300, "Colleague", this.playerContainer);

        // Create other players from initial list
        // Chỉ tạo cho user đang online để tránh ghost/offline trên map
        if (users) {
          users.forEach((user) => {
            const status = (user as any).status || "online";
            if (user.userId !== currentUser?.userId && status === "online") {
              this.createOtherPlayer(user);
            }
          });
        }

        // Initialize input controls
        this.playerController.initInput(this);

        // Setup camera
        if (this.playerContainer) {
          this.cameras.main.startFollow(this.playerContainer);
          this.cameras.main.setZoom(1.5);
          this.targetZoom = 1.5;
        }

        // Setup zoom controls
        this.input.on("wheel", (_pointer: any, _gameObjects: any, _deltaX: number, deltaY: number) => {
          const currentZoom = this.cameras.main.zoom;
          if (deltaY > 0) {
            if (currentZoom > 1.0) {
              this.targetZoom = Math.max(1.0, currentZoom - 0.1);
            } else {
              setIsOverviewMode(true);
            }
          } else {
            this.targetZoom = Math.min(2.5, currentZoom + 0.1);
            setIsOverviewMode(false);
          }
        });

        // Create Zone Indicator
        this.zoneIndicator.createIndicator(this);

        // Setup Socket Listeners
        if (socket) {
          this.cleanupSocketHandlers = SocketHandlers.setupListeners(
            this,
            socket,
            currentUser,
            this.otherPlayers,
            (user) => this.createOtherPlayer(user),
            (userId, position, direction) => this.updateOtherPlayer(userId, position, direction),
            (userId, message) => this.showSpeechBubble(userId, message),
            (userId, reaction) => this.showReaction(userId, reaction)
          );
        }
      }

      private lastZoneCheck = 0;
      private zoneCheckInterval = 500; // Check zone every 500ms instead of every frame

      update() {
        // Camera zoom interpolation (lightweight, can run every frame)
        this.cameras.main.setZoom(
          Phaser.Math.Interpolation.Linear([this.cameras.main.zoom, this.targetZoom], 0.1)
        );

        if (isOverviewMode !== isOverviewModeRef.current) {
          isOverviewModeRef.current = isOverviewMode;
        }

        // Update player position (critical, run every frame)
        this.playerController.updatePlayerPosition(
          this,
          socket,
          (animName) => this.playAnimation(animName)
        );

        // Check interactions (can be throttled, but keep responsive)
        this.playerController.checkInteractions(
          this,
          this.mapRenderer.getInteractiveObjects() || null,
          setInteractionPrompt,
          (sitting) => this.playerController.setSitting(sitting),
          (x, y) => {
            if (this.playerContainer) {
              this.playerContainer.setPosition(x, y);
            }
          },
          (animName) => this.playAnimation(animName)
        );

        // Update NPCs (throttled for performance)
        this.npcManager.updateNPCs(this.time.now);

        // Update zone indicator (throttle to reduce calculations)
        const now = this.time.now;
        if (now - this.lastZoneCheck >= this.zoneCheckInterval) {
          this.zoneIndicator.updateIndicator(
            this,
            this.playerController.getPlayerPosition(),
            mapData,
            setCurrentZone
          );
          this.lastZoneCheck = now;
        }
      }

      showSpeechBubble(userId: string, message: string) {
        let container: Phaser.GameObjects.Container | undefined;

        if (userId === currentUser?.userId) {
          container = this.playerContainer;
        } else if (this.otherPlayers.has(userId)) {
          container = this.otherPlayers.get(userId)?.container;
        }

        if (!container) return;

        SpeechBubble.showSpeechBubble(this, container, message);
      }

      showReaction(userId: string, reaction: string) {
        let container: Phaser.GameObjects.Container | undefined;

        if (userId === currentUser?.userId) {
          container = this.playerContainer;
        } else if (this.otherPlayers.has(userId)) {
          container = this.otherPlayers.get(userId)?.container;
        }

        if (!container) {
          console.warn(`Cannot show reaction: container not found for user ${userId}`);
          return;
        }

        this.reactionDisplay.showReaction(userId, reaction, container);
      }

      createOtherPlayer(user: any) {
        // Avoid duplicate: nếu đã có (từ users ban đầu hoặc từ socket), chỉ nâng cấp avatar nếu có avatarConfig
        if (this.otherPlayers.has(user.userId)) {
          this.ensureOtherPlayerAvatar(user);
          return;
        }
        const playerData = PlayerManager.createOtherPlayer(this, user, { spriteKey: "player", scale: 1 });
        this.otherPlayers.set(user.userId, playerData);
        this.ensureOtherPlayerAvatar(user);
      }

      /** Load avatar texture cho remote user và gán vào sprite (đúng outfit, không còn nhầm "người lính") */
      async ensureOtherPlayerAvatar(user: any) {
        const avatarConfig = user?.avatarConfig;
        const userId = user?.userId;
        if (!avatarConfig || !userId || typeof avatarConfig !== "object") return;
        const key = `avatar-${userId}`;
        const entry = this.otherPlayers.get(userId);
        if (!entry) return;

        const applyTexture = (spriteKey: string, scale: number) => {
          if (!entry) return;
          entry.sprite.setTexture(spriteKey, 0);
          entry.sprite.setScale(scale);
          const dir = user.direction || "idle-down";
          const animName = dir.startsWith("idle") ? dir : `walk-${dir}`;
          const fullAnim = `${spriteKey}-${animName}`;
          if (this.anims.exists(fullAnim)) entry.sprite.play(fullAnim, true);
          else {
            const idle = `${spriteKey}-idle-down`;
            if (this.anims.exists(idle)) entry.sprite.play(idle, true);
          }
        };

        if (this.textures.exists(key)) {
          applyTexture(key, 0.5);
          return;
        }
        try {
          const canvas = await composeAvatarSpriteSheetCanvas({ avatarConfig });
          if (!canvas) return;
          (this.textures as any).addSpriteSheet(key, canvas, { frameWidth: 64, frameHeight: 64 });
          AnimationManager.createCharacterAnimations(this, key, { layout: "lpc", frameWidth: 64, frameHeight: 64 });
          applyTexture(key, 0.5);
        } catch (e) {
          console.warn("Failed to compose remote avatar, keeping default:", userId, e);
        }
      }

      updateOtherPlayer(userId: string, position: { x: number; y: number }, direction?: string) {
        const player = this.otherPlayers.get(userId);
        if (!player) return;
        PlayerManager.updateOtherPlayer(this, player.container, player.sprite, position, direction);
      }

      playAnimation(animName: string) {
        if (!this.playerSprite) return;
        const spriteKey = (this.playerSprite as any).texture?.key || "player";
        const fullAnim = `${spriteKey}-${animName}`;
        if (this.anims.exists(fullAnim)) {
          this.playerSprite.play(fullAnim, true);
        }
      }
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: window.innerWidth - 300,
      height: window.innerHeight - 60,
      parent: "phaser-game",
      backgroundColor: "#F0F4F8", // Pastel Blue-Grey
      scene: MainScene,
      physics: {
        default: "arcade",
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
      // Socket cleanup is handled by SocketHandlers cleanup function
    };
  }, [socket, mapData, currentUser?.userId]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <SimplifiedMap visible={isOverviewMode} onClose={() => setIsOverviewMode(false)} />
      <div id="phaser-game" style={{ width: "100%", height: "100%" }} />
      {currentZone && (
        <div
          style={{
            position: "absolute",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(99, 102, 241, 0.9)",
            color: "white",
            padding: "8px 16px",
            borderRadius: "20px",
            fontWeight: "bold",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            zIndex: 100,
            pointerEvents: "none",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>🔊</span>
          <span>{currentZone.name}</span>
        </div>
      )}
      {interactionPrompt && (
        <div
          style={{
            position: "absolute",
            bottom: 40,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            color: "#fbbf24", // Amber color
            padding: "12px 24px",
            borderRadius: "8px",
            fontWeight: "bold",
            fontSize: "18px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
            zIndex: 100,
            pointerEvents: "none",
            animation: "fadeIn 0.2s ease-in-out"
          }}
        >
          {interactionPrompt}
        </div>
      )}

      {/* Notifications UI is handled by NotificationCenter (Sidebar). */}
    </div>
  );
};

export default GameScene;
