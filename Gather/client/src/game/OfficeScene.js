import Phaser from "phaser";
import socket from "../utils/socket";
import { generateTextures, getTileKey, generateAvatarTexture } from "./textures";

const MOVE_COOLDOWN = 120;

function isWalkable(tile) {
  return tile === 0 || tile === 3 || tile === 9 || tile === 10 || tile === 11 || tile === 16;
}

export default class OfficeScene extends Phaser.Scene {
  constructor() {
    super("OfficeScene");
    this.mapData = null;
    this.mapCols = 0;
    this.mapRows = 0;
    this.tileSize = 32;
    this.proximityRadius = 4;
    this.myId = null;
    this.playerSprites = {};
    this.playerNames = {};
    this.localSprite = null;
    this.lastMoveTime = 0;
    this.players = {};
    this.proximityGfx = null;
    this.mapBuilt = false;
    this.sceneReady = false;

    // Conversation visual state
    this.convBubbles = {};
    this.convGfx = null;

    // Builder state
    this.placedFurniture = {};      // { furnitureId: { sprite, data } }
    this.builderGhostSprite = null; // Preview sprite for placement
    this.currentZoom = 1;

    // Queues for data that arrives before scene is ready
    this._pendingInit = null;
    this._pendingJoins = [];
    this._pendingMoves = [];
    this._pendingLeaves = [];

    this.reactionTexts = {};
  }

  create() {
    console.log("[OfficeScene] create() start");

    generateTextures(this);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasdKeys = this.input.keyboard.addKeys("W,S,A,D");

    this.proximityGfx = this.add.graphics();
    this.proximityGfx.setDepth(5);

    this.convGfx = this.add.graphics();
    this.convGfx.setDepth(8);

    // Builder ghost preview (hidden by default)
    this.builderGhostGfx = this.add.graphics();
    this.builderGhostGfx.setDepth(15);
    this.builderGhostGfx.setVisible(false);

    // ── Zoom with scroll wheel ──────────────────────────────────
    this.input.on("wheel", (pointer, gameObjects, deltaX, deltaY) => {
      const zoomDelta = deltaY > 0 ? -0.1 : 0.1;
      this.currentZoom = Phaser.Math.Clamp(this.currentZoom + zoomDelta, 0.5, 2.0);
      this.cameras.main.setZoom(this.currentZoom);
      // Notify React about zoom
      if (window.__GATHER__?.onZoomChange) {
        window.__GATHER__.onZoomChange(this.currentZoom);
      }
    });

    // ── Pointer click for builder mode ──────────────────────────
    this.input.on("pointerdown", (pointer) => {
      const g = window.__GATHER__;
      if (!g || !this.mapData) return;

      // Convert screen coords to world coords
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const tileX = Math.floor(worldPoint.x / this.tileSize);
      const tileY = Math.floor(worldPoint.y / this.tileSize);

      if (tileX < 0 || tileX >= this.mapCols || tileY < 0 || tileY >= this.mapRows) return;

      // Remove mode: right click or removeMode active
      if (g.builderRemoveMode || pointer.rightButtonDown()) {
        // Find furniture at this tile
        for (const [fid, fdata] of Object.entries(this.placedFurniture)) {
          if (fdata.data.x === tileX && fdata.data.y === tileY) {
            socket.emit("furniture:remove", { furnitureId: fid });
            return;
          }
        }
        return;
      }

      // Place mode
      const selectedItem = g.builderSelectedItem;
      if (selectedItem !== null && selectedItem !== undefined) {
        const tile = this.mapData[tileY][tileX];
        if (!isWalkable(tile)) return;
        // Check no player at this position
        for (const p of Object.values(this.players)) {
          if (p.x === tileX && p.y === tileY) return;
        }
        // Check no existing furniture
        for (const fdata of Object.values(this.placedFurniture)) {
          if (fdata.data.x === tileX && fdata.data.y === tileY) return;
        }
        socket.emit("furniture:place", { type: selectedItem, x: tileX, y: tileY });
      }
    });

    // Prevent context menu on right-click
    this.game.canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    // ── Pointer move for ghost preview ──────────────────────────
    this.input.on("pointermove", (pointer) => {
      const g = window.__GATHER__;
      if (!g || !this.mapData) return;
      const selectedItem = g.builderSelectedItem;

      if (selectedItem !== null && selectedItem !== undefined) {
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const tileX = Math.floor(worldPoint.x / this.tileSize);
        const tileY = Math.floor(worldPoint.y / this.tileSize);

        this.builderGhostGfx.clear();
        this.builderGhostGfx.setVisible(true);

        if (tileX >= 0 && tileX < this.mapCols && tileY >= 0 && tileY < this.mapRows) {
          const tile = this.mapData[tileY][tileX];
          const canPlace = isWalkable(tile) && !this._hasFurnitureAt(tileX, tileY);
          const px = tileX * this.tileSize;
          const py = tileY * this.tileSize;

          this.builderGhostGfx.lineStyle(2, canPlace ? 0x4ECDC4 : 0xE53935, 0.8);
          this.builderGhostGfx.strokeRect(px, py, this.tileSize, this.tileSize);
          this.builderGhostGfx.fillStyle(canPlace ? 0x4ECDC4 : 0xE53935, 0.15);
          this.builderGhostGfx.fillRect(px, py, this.tileSize, this.tileSize);
        }
      } else {
        this.builderGhostGfx.setVisible(false);
        this.builderGhostGfx.clear();
      }
    });

    // ── Socket listeners ────────────────────────────────────────
    socket.on("game:init", (data) => {
      console.log("[OfficeScene] game:init received", data.mapCols, "x", data.mapRows);
      if (!this.sceneReady) {
        this._pendingInit = data;
      } else {
        this._processInit(data);
      }
    });

    socket.on("player:joined", (p) => {
      if (!this.sceneReady) { this._pendingJoins.push(p); return; }
      this.players[p.id] = p;
      this._addSprite(p);
      this._notify();
    });

    socket.on("player:moved", (d) => {
      if (!this.sceneReady) { this._pendingMoves.push(d); return; }
      const p = this.players[d.id];
      if (!p) return;
      p.x = d.x; p.y = d.y; p.direction = d.direction;
      this._moveSprite(d.id);
      this._notify();
    });

    socket.on("player:left", (d) => {
      if (!this.sceneReady) { this._pendingLeaves.push(d); return; }
      this._removeSprite(d.id);
      delete this.players[d.id];
      this._notify();
    });

    socket.on("player:reacted", (data) => {
      this._showReactionEmoji(data.id, data.emoji);
    });

    socket.on("connect", () => this._notifyConnection(true));
    socket.on("disconnect", () => this._notifyConnection(false));

    // Furniture socket events
    socket.on("furniture:placed", (item) => {
      this._addFurnitureSprite(item);
    });
    socket.on("furniture:removed", (data) => {
      this._removeFurnitureSprite(data.furnitureId);
    });

    this.sceneReady = true;
    console.log("[OfficeScene] scene marked ready");

    const name = window.__GATHER__?.playerName || "Anonymous";
    console.log("[OfficeScene] Connecting as:", name);

    if (socket.connected) {
      socket.emit("player:join", { name });
    } else {
      socket.connect();
      socket.once("connect", () => {
        socket.emit("player:join", { name });
      });
    }
  }

  _processInit(data) {
    if (!this.cameras?.main) return;

    this.mapData = data.map;
    this.mapCols = data.mapCols;
    this.mapRows = data.mapRows;
    this.tileSize = data.tileSize;
    this.proximityRadius = data.proximityRadius;
    this.myId = data.playerId;
    this.players = data.players;


    if (data.conversations && window.__GATHER__?.onConversationsUpdate) {
      window.__GATHER__.onConversationsUpdate(data.conversations);
    }

    this._buildMap();
    Object.values(data.players).forEach((p) => this._addSprite(p));

    // Load existing furniture
    if (data.furniture) {
      Object.values(data.furniture).forEach((item) => this._addFurnitureSprite(item));
    }

    this.cameras.main.setBounds(0, 0, this.mapCols * this.tileSize, this.mapRows * this.tileSize);
    if (this.localSprite) {
      this.cameras.main.startFollow(this.localSprite, true, 0.1, 0.1);
    }

    this._notify(true);
  }

  _buildMap() {
    if (this.mapBuilt) return;
    this.mapBuilt = true;
    for (let y = 0; y < this.mapRows; y++) {
      for (let x = 0; x < this.mapCols; x++) {
        const tile = this.mapData[y][x];
        const key = getTileKey(tile, x, y);
        this.add.image(
          x * this.tileSize + this.tileSize / 2,
          y * this.tileSize + this.tileSize / 2,
          key
        ).setDepth(0);
      }
    }
  }

  _addSprite(player) {
    if (this.playerSprites[player.id]) return;
    const isLocal = player.id === this.myId;
    generateAvatarTexture(this, player.id, player.style);

    const px = player.x * this.tileSize + this.tileSize / 2;
    const py = player.y * this.tileSize + this.tileSize / 2;

    const sprite = this.add.sprite(px, py, `avatar_${player.id}`, 0).setDepth(10);
    const nameTag = this.add.text(px, py - 22, player.name, {
      fontSize: "10px", fontFamily: "monospace", fontStyle: "bold",
      color: "#FFF", backgroundColor: isLocal ? "#285078" : "#1E1E32",
      padding: { x: 3, y: 2 },
    }).setOrigin(0.5, 1).setDepth(11);

    if (isLocal) {
      const ring = this.add.ellipse(px, py + 14, 28, 8, 0x64C8FF, 0.4).setDepth(9);
      sprite.ring = ring;
      this.localSprite = sprite;
      this.cameras.main.startFollow(sprite, true, 0.1, 0.1);
    }

    this.playerSprites[player.id] = sprite;
    this.playerNames[player.id] = nameTag;

    const frames = { down: 0, left: 1, right: 2, up: 3 };
    sprite.setFrame(frames[player.direction] || 0);
  }

  _moveSprite(id) {
    const p = this.players[id];
    const s = this.playerSprites[id];
    const n = this.playerNames[id];
    if (!p || !s) return;

    const tx = p.x * this.tileSize + this.tileSize / 2;
    const ty = p.y * this.tileSize + this.tileSize / 2;

    if (id !== this.myId) {
      this.tweens.add({
        targets: s, x: tx, y: ty, duration: 100, ease: "Linear",
        onUpdate: () => {
          if (n) n.setPosition(s.x, s.y - 22);
          this._updateBubblePos(id, s.x, s.y);
        },
      });
    } else {
      s.setPosition(tx, ty);
      if (n) n.setPosition(tx, ty - 22);
      if (s.ring) s.ring.setPosition(tx, ty + 14);
      this._updateBubblePos(id, tx, ty);
    }

    const frames = { down: 0, left: 1, right: 2, up: 3 };
    s.setFrame(frames[p.direction] || 0);
  }

  _removeSprite(id) {
    const s = this.playerSprites[id];
    if (s) {
      if (s.ring) s.ring.destroy(); s.destroy(); delete this.playerSprites[id];

      if (this.reactionTexts[id]) {
        this.reactionTexts[id].destroy();
        delete this.reactionTexts[id];
      }
    }
    const n = this.playerNames[id];
    if (n) { n.destroy(); delete this.playerNames[id]; }
    this._removeBubble(id);
  }

  _showReactionEmoji(playerId, emoji) {
    // Destroy any in-flight reaction for this player
    if (this.reactionTexts[playerId]) {
      this.reactionTexts[playerId].destroy();
      delete this.reactionTexts[playerId];
    }
    const s = this.playerSprites[playerId];
    if (!s) return;

    const text = this.add.text(s.x, s.y - 42, emoji, {
      fontSize: "22px",
    }).setOrigin(0.5, 1).setDepth(20);

    this.reactionTexts[playerId] = text;

    this.tweens.add({
      targets: text,
      y: text.y - 36,
      alpha: 0,
      duration: 2500,
      ease: "Sine.easeIn",
      onComplete: () => {
        text.destroy();
        if (this.reactionTexts[playerId] === text) {
          delete this.reactionTexts[playerId];
        }
      },
    });
  }

  // ── Furniture sprite management ────────────────────────────
  _addFurnitureSprite(item) {
    if (this.placedFurniture[item.id]) return;
    const key = getTileKey(item.type, item.x, item.y);
    if (!this.textures.exists(key)) return;

    const px = item.x * this.tileSize + this.tileSize / 2;
    const py = item.y * this.tileSize + this.tileSize / 2;
    const sprite = this.add.image(px, py, key).setDepth(1);

    // Add a subtle pop-in animation
    sprite.setScale(0.1);
    this.tweens.add({
      targets: sprite,
      scaleX: 1, scaleY: 1,
      duration: 200,
      ease: "Back.easeOut",
    });

    this.placedFurniture[item.id] = { sprite, data: item };
  }

  _removeFurnitureSprite(furnitureId) {
    const entry = this.placedFurniture[furnitureId];
    if (!entry) return;
    // Pop-out animation then destroy
    this.tweens.add({
      targets: entry.sprite,
      scaleX: 0, scaleY: 0, alpha: 0,
      duration: 150,
      ease: "Back.easeIn",
      onComplete: () => entry.sprite.destroy(),
    });
    delete this.placedFurniture[furnitureId];
  }

  _hasFurnitureAt(x, y) {
    for (const fdata of Object.values(this.placedFurniture)) {
      if (fdata.data.x === x && fdata.data.y === y) return true;
    }
    return false;
  }

  // ── Conversation bubble management ────────────────────────
  _addBubble(playerId) {
    if (this.convBubbles[playerId]) return;
    const s = this.playerSprites[playerId];
    if (!s) return;

    const bubble = this.add.graphics();
    bubble.fillStyle(0xFFFFFF, 0.92);
    bubble.fillRoundedRect(0, 0, 20, 14, 4);
    bubble.fillStyle(0x333333, 1);
    bubble.fillCircle(5, 7, 1.5);
    bubble.fillCircle(10, 7, 1.5);
    bubble.fillCircle(15, 7, 1.5);
    bubble.fillStyle(0xFFFFFF, 0.92);
    bubble.fillTriangle(2, 14, 6, 14, 0, 18);
    bubble.setPosition(s.x + 12, s.y - 28);
    bubble.setDepth(12);

    this.convBubbles[playerId] = { bubble };

    this.tweens.add({
      targets: bubble,
      scaleX: 1.1, scaleY: 1.1,
      duration: 800, yoyo: true, repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  _removeBubble(playerId) {
    const b = this.convBubbles[playerId];
    if (!b) return;
    if (b.bubble) b.bubble.destroy();
    delete this.convBubbles[playerId];
  }

  _updateBubblePos(playerId, x, y) {
    const b = this.convBubbles[playerId];
    if (!b) return;
    b.bubble.setPosition(x + 12, y - 28);
  }

  _updateConversationVisuals() {
    const convData = window.__GATHER__?.conversations || {};
    const inConv = new Set();
    Object.values(convData).forEach((conv) => {
      if (conv.members) conv.members.forEach((mid) => inConv.add(mid));
    });

    Object.keys(this.playerSprites).forEach((pid) => {
      if (inConv.has(pid) && pid !== this.myId) {
        this._addBubble(pid);
      } else if (!inConv.has(pid)) {
        this._removeBubble(pid);
      }
    });

    this.convGfx.clear();
    Object.values(convData).forEach((conv) => {
      if (!conv.members || conv.members.length < 2) return;
      let cx = 0, cy = 0, count = 0;
      conv.members.forEach((mid) => {
        const p = this.players[mid];
        if (p) {
          cx += p.x * this.tileSize + this.tileSize / 2;
          cy += p.y * this.tileSize + this.tileSize / 2;
          count++;
        }
      });
      if (count < 2) return;
      cx /= count; cy /= count;

      let maxDist = 0;
      conv.members.forEach((mid) => {
        const p = this.players[mid];
        if (p) {
          const px = p.x * this.tileSize + this.tileSize / 2;
          const py = p.y * this.tileSize + this.tileSize / 2;
          const d = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
          if (d > maxDist) maxDist = d;
        }
      });

      const radius = Math.max(maxDist + 24, 30);
      this.convGfx.lineStyle(3, 0x4ECDC4, 0.3);
      this.convGfx.strokeCircle(cx, cy, radius);
      this.convGfx.lineStyle(1, 0x4ECDC4, 0.15);
      this.convGfx.strokeCircle(cx, cy, radius + 4);
    });
  }

  _notify(withConnection) {
    const g = window.__GATHER__;
    if (g?.onPlayersUpdate) g.onPlayersUpdate({ ...this.players }, this.myId);
    if (withConnection && g?.onConnectionUpdate) g.onConnectionUpdate(true);
  }

  _notifyConnection(val) {
    const g = window.__GATHER__;
    if (g?.onConnectionUpdate) g.onConnectionUpdate(val);
  }

  update(time) {
    if (this._pendingInit) {
      const data = this._pendingInit;
      this._pendingInit = null;
      this._processInit(data);
    }
    if (this._pendingJoins.length > 0) {
      const joins = this._pendingJoins.splice(0);
      joins.forEach((p) => { this.players[p.id] = p; this._addSprite(p); });
      this._notify();
    }
    if (this._pendingMoves.length > 0) {
      const moves = this._pendingMoves.splice(0);
      moves.forEach((d) => {
        const p = this.players[d.id];
        if (!p) return;
        p.x = d.x; p.y = d.y; p.direction = d.direction;
        this._moveSprite(d.id);
      });
      this._notify();
    }
    if (this._pendingLeaves.length > 0) {
      const leaves = this._pendingLeaves.splice(0);
      leaves.forEach((d) => { this._removeSprite(d.id); delete this.players[d.id]; });
      this._notify();
    }

    if (!this.myId || !this.players[this.myId]) return;

    this._updateConversationVisuals();

    // Proximity ring
    this.proximityGfx.clear();
    const me = this.players[this.myId];
    const cx = me.x * this.tileSize + this.tileSize / 2;
    const cy = me.y * this.tileSize + this.tileSize / 2;
    const proximityRadius = window.__GATHER__?.proximityRadius ?? this.proximityRadius;
    this.proximityGfx.lineStyle(2, 0x4A90D0, 0.15);
    this.proximityGfx.strokeCircle(cx, cy, proximityRadius * this.tileSize);

    // Movement (only if not in builder placement mode)
    if (time - this.lastMoveTime < MOVE_COOLDOWN) return;
    const g = window.__GATHER__;
    const inBuilderMode = g?.builderSelectedItem !== null && g?.builderSelectedItem !== undefined;
    if (inBuilderMode) return; // Don't move when placing furniture

    let dx = 0, dy = 0, dir = null;
    const k = this.wasdKeys;
    if (this.cursors.up.isDown || k.W.isDown) { dy = -1; dir = "up"; }
    else if (this.cursors.down.isDown || k.S.isDown) { dy = 1; dir = "down"; }
    else if (this.cursors.left.isDown || k.A.isDown) { dx = -1; dir = "left"; }
    else if (this.cursors.right.isDown || k.D.isDown) { dx = 1; dir = "right"; }

    if (!dir) return;

    const nx = me.x + dx, ny = me.y + dy;
    if (nx >= 0 && nx < this.mapCols && ny >= 0 && ny < this.mapRows && isWalkable(this.mapData[ny][nx]) && !this._hasFurnitureAt(nx, ny)) {
      this.lastMoveTime = time;
      me.x = nx; me.y = ny; me.direction = dir;
      this._moveSprite(this.myId);
      socket.emit("player:move", { dx, dy, direction: dir });
      this._notify();
    }
  }

  shutdown() {
    socket.off("game:init");
    socket.off("player:joined");
    socket.off("player:moved");
    socket.off("player:left");
    socket.off("connect");
    socket.off("disconnect");
    socket.off("furniture:placed");
    socket.off("furniture:removed");
    socket.off("player:reacted");
    socket.disconnect();
  }
}
