# Gather Clone

A 2D multiplayer virtual office space with proximity-based video/audio chat, built with Phaser 3, React, Socket.io, and WebRTC.

## Features

### Virtual Office
- **2D Pixel-Art World** — Godot/RPG Maker style procedural pixel-art graphics rendered with Phaser 3 (WebGL)
- **24x18 Tile Map** — Office with lobby, open workspace, meeting rooms, kitchen, and lounge areas
- **Real-time Multiplayer** — Walk around the office, see other players move in real-time via Socket.io
- **WASD / Arrow Keys** — Standard 2D movement with server-side collision validation
- **Zoom In/Out** — Mouse scroll wheel to zoom (0.5x to 2.0x)

### Proximity Video Chat
- **Automatic Connection** — Walk near a colleague and video/audio starts automatically via WebRTC (simple-peer)
- **Proximity Radius** — 4 tiles radius for triggering connections
- **Camera/Mic Release** — Media devices are released when nobody is nearby

### Conversation System
- **Conversation Groups** — When two players connect, a conversation group is created on the server
- **Visual Indicators** — Speech bubbles above players in a conversation + teal glow ring around the group
- **Join Request** — Walk near an existing conversation and click "Request to join"
- **Approval Flow** — Members see a notification and can Approve or Decline the request
- **Leave** — Click "Leave" to exit a conversation at any time

### Office Builder
- **Builder Panel** — Click "Builder" button to open the furniture placement panel
- **11 Furniture Types** — Desk, Chair, Table, Plant, Couch, Whiteboard, Bookshelf, Coffee Table, Printer, Water Cooler, Rug
- **Click to Place** — Select an item, then click on any walkable floor tile to place it
- **Ghost Preview** — Shows green/red outline while hovering to indicate valid/invalid placement
- **Remove Mode** — Toggle remove mode and click placed furniture to remove it. Right-click also removes
- **Synced** — All furniture placements are broadcast to all connected players in real-time
- **Collision** — Placed solid furniture blocks player movement

### Camera/Mic Test
- **Pre-join Test** — Camera and microphone test screen before entering the office
- **Video Preview** — See your camera feed with status indicators
- **Mic Level Bar** — Animated microphone level visualization
- **Auto Cleanup** — Media streams are stopped before joining the game

### Graphics
- **Procedural Pixel Art** — All textures generated at runtime via Canvas 2D API
- **Chibi Avatars** — RPG-style characters with hair, eyes, clothes, outlined body
- **Wall Decorations** — Random wall clocks and framed landscape paintings
- **Desk Details** — Monitor with ambient glow, keyboard, mouse, sticky notes, coffee cups
- **Furniture Shadows** — Subtle shadows under all furniture
- **8 Avatar Styles** — Random hair, skin, shirt, pants, shoes combinations

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Game Engine | Phaser 3 (v3.90.0) |
| Frontend | React 19 + Vite |
| Backend | Node.js + Express |
| Real-time | Socket.io |
| Video/Audio | WebRTC via simple-peer |
| Rendering | WebGL (Phaser) + Canvas 2D (textures) |

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone https://gitlab.com/rubenNettaroGitlab/gather-clone.git
cd gather-clone

# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### Running

You need two terminal windows:

**Terminal 1 — Backend Server:**
```bash
node server/server.js
```
Server starts on `http://localhost:3001`

**Terminal 2 — Frontend Dev Server:**
```bash
cd client
npx vite --host
```
Frontend starts on `http://localhost:5173`

### Usage

1. Open `http://localhost:5173` in your browser
2. Camera/mic test screen appears — click "Looks good, continue"
3. Enter your name and click "Enter Space"
4. Walk around with WASD or arrow keys
5. Walk near other players for automatic video chat
6. Use the Builder button to place furniture
7. Scroll to zoom in/out

## Project Structure

```
gather-clone/
├── server/
│   └── server.js              # Express + Socket.io backend
├── client/
│   ├── src/
│   │   ├── App.jsx            # Main app orchestrator
│   │   ├── main.jsx           # Entry point
│   │   ├── game/
│   │   │   ├── PhaserGame.jsx # React ↔ Phaser bridge
│   │   │   ├── OfficeScene.js # Phaser scene (map, players, builder, zoom)
│   │   │   └── textures.js    # Procedural pixel-art texture generation
│   │   ├── components/
│   │   │   ├── LoginScreen.jsx   # Login + camera/mic test
│   │   │   ├── HUD.jsx          # Team list, conversation UI
│   │   │   ├── VideoOverlay.jsx  # WebRTC video feeds
│   │   │   └── BuilderPanel.jsx  # Furniture placement panel
│   │   ├── hooks/
│   │   │   └── useProximityChat.js # WebRTC + conversation logic
│   │   └── utils/
│   │       └── socket.js       # Socket.io singleton
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── package.json
└── README.md
```

## Architecture

### React ↔ Phaser Communication
The app uses a `window.__GATHER__` global bridge object. React sets callbacks and state on this object; the Phaser scene reads from it during its `update()` loop. This avoids tight coupling between React state management and the Phaser game loop.

### Socket Event Flow
1. Client connects → emits `player:join`
2. Server responds with `game:init` (map, players, furniture, conversations)
3. Movement: `player:move` → server validates → broadcasts `player:moved`
4. Proximity triggers WebRTC signaling via `webrtc:signal`, `webrtc:request`, `webrtc:end`
5. Conversations: `conv:start`, `conv:request`, `conv:approve/deny`
6. Furniture: `furniture:place` → server validates → broadcasts `furniture:placed`

### Texture Generation
All pixel-art textures are generated programmatically using Canvas 2D API at startup. No external image assets are needed. Textures are registered with Phaser via `scene.textures.addCanvas()`.

## License

MIT
