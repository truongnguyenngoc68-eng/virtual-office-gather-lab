# Kiến trúc Hệ thống Gather 2.0

**Phiên bản:** 1.0  
**Ngày cập nhật:** 2026-02-16  
**Tác giả:** BanhVanTranPhat

---

## 1. Tổng quan

Gather 2.0 là một ứng dụng không gian làm việc ảo 2D, cho phép các đội nhóm làm việc từ xa tương tác trong một môi trường giống như văn phòng thật. Hệ thống sử dụng công nghệ web hiện đại để cung cấp trải nghiệm real-time với avatar di chuyển, chat, video/audio call, và các tính năng cộng tác khác.

### 1.1. Mục tiêu Kiến trúc

- **Real-time Collaboration**: Đồng bộ vị trí và trạng thái người dùng theo thời gian thực
- **Scalability**: Hỗ trợ nhiều phòng (rooms) đồng thời, mỗi phòng có thể chứa nhiều người dùng
- **Performance**: Tối ưu network traffic và render performance
- **Maintainability**: Code structure rõ ràng, dễ mở rộng và bảo trì

---

## 2. Kiến trúc Tổng thể

Hệ thống được xây dựng theo mô hình **Client-Server** với các thành phần chính:

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (Frontend)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   React UI   │  │ Phaser Game  │  │ Socket.IO    │    │
│  │   (Pages,    │  │   Engine     │  │   Client     │    │
│  │ Components)  │  │  (2D Map)   │  │              │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│         │                  │                  │            │
│         └──────────────────┼──────────────────┘            │
│                            │                                │
└────────────────────────────┼────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  HTTP REST API  │
                    │  (Express)      │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌────────▼────────┐  ┌───────▼────────┐
│ Socket.IO      │  │  MongoDB        │  │ WebRTC/SFU     │
│ Server         │  │  Database       │  │ (mediasoup)    │
│ (Real-time)    │  │                 │  │                │
└────────────────┘  └────────────────┘  └────────────────┘
```

### 2.1. Các Layer Chính

1. **Presentation Layer** (Frontend)
   - React 19 + TypeScript cho UI
   - Phaser 3 cho game engine và rendering 2D
   - Tailwind CSS cho styling

2. **Application Layer** (Backend)
   - Node.js + Express cho REST API
   - Socket.IO Server cho real-time communication
   - Mediasoup (SFU) cho WebRTC signaling

3. **Data Layer**
   - MongoDB cho persistent storage
   - Mongoose ODM cho data modeling

---

## 3. Frontend Architecture

### 3.1. Component Structure

```
src/
├── pages/              # Route-level pages
│   ├── App.tsx         # Main app shell với game scene
│   ├── Spaces.tsx      # Room selection
│   ├── Lobby.tsx       # Camera/mic setup
│   ├── AvatarPage.tsx  # Pixel avatar editor
│   ├── EventsPage.tsx  # Events calendar
│   └── LibraryApp.tsx  # Library resources
│
├── components/         # Reusable components
│   ├── Sidebar.tsx     # Main navigation sidebar
│   ├── game/           # Phaser game components
│   │   ├── GameScene.tsx
│   │   ├── PlayerController.ts
│   │   └── SocketHandlers.ts
│   ├── chat/           # Chat components
│   ├── modals/         # Modal dialogs
│   └── sidebar/       # Sidebar sub-components
│
├── contexts/           # React Context providers
│   ├── SocketContext.tsx    # Socket.IO connection & user presence
│   ├── WebRTCContext.tsx   # WebRTC media streams (SFU)
│   ├── ChatContext.tsx     # Chat messages & channels
│   └── MapContext.tsx      # Map data & objects
│
├── hooks/              # Custom React hooks
│   └── useUserList.ts  # User list filtering logic
│
└── utils/              # Utility functions
    ├── authFetch.ts    # Authenticated API calls
    └── avatarComposer.ts # Pixel avatar generation
```

### 3.2. Routing Structure

```typescript
/                    → LegacyAuthFlow (landing/login)
/login               → Redirect to /
/avatar              → AvatarPage (pixel avatar editor)
/spaces              → Spaces (room selection)
/lobby               → Lobby (camera/mic setup)
/app/:roomId         → AppPage (main game/office view)
/app/events          → EventsPage (in-app shell)
/app/library         → LibraryApp (in-app shell)
/app/chat            → ChatPage
/app/admin           → AdminDashboard
```

### 3.3. State Management

- **React Context API**: Quản lý global state (Socket, WebRTC, Chat, Map)
- **Local State**: Component-level state với `useState`
- **localStorage**: Persist user preferences, tokens, roomId

### 3.4. Phaser Integration

- **GameScene**: Phaser Scene chính render 2D map và avatars
- **PlayerController**: Xử lý input (WASD/Arrow keys) và di chuyển player
- **SocketHandlers**: Lắng nghe Socket.IO events để sync player positions
- **MapRenderer**: Render tilemap và objects từ map data

---

## 4. Backend Architecture

### 4.1. Server Structure

```
backend/
├── server.ts         # Express + Socket.IO server entry
├── routes/           # REST API routes
│   ├── auth.ts       # Authentication endpoints
│   ├── rooms.ts      # Room management
│   ├── users.ts      # User profile endpoints
│   └── admin.ts      # Admin endpoints
├── models/           # Mongoose models
│   ├── User.ts
│   ├── Room.ts
│   ├── Message.ts
│   └── Event.ts
├── middleware/       # Express middleware
│   ├── auth.ts       # JWT authentication
│   └── rateLimiter.ts
└── utils/            # Utility functions
```

### 4.2. API Endpoints

#### Authentication
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/google` - Google OAuth login

#### Rooms
- `GET /api/rooms` - List available rooms
- `GET /api/rooms/:roomId` - Get room details
- `POST /api/rooms` - Create new room

#### Users
- `GET /api/user/me` - Get current user profile
- `PATCH /api/user/me` - Update user profile

### 4.3. Socket.IO Events

#### Client → Server
- `user-join`: Join a room
- `playerMovement`: Send player position update
- `chat-message`: Send chat message
- `reaction`: Send emoji reaction

#### Server → Client
- `user-joined`: User joined room
- `user-left`: User left room
- `playerMoved`: Individual player position update
- `allPlayersPositions`: Batch position update (every 500ms)
- `room-users`: List of all users in room
- `chat-message`: Broadcast chat message

---

## 5. Real-time Communication

### 5.1. Socket.IO (Presence & Chat)

**Mục đích**: Đồng bộ vị trí avatar, trạng thái online/offline, và chat messages

**Flow**:
1. Client kết nối Socket.IO với `roomId`
2. Client emit `user-join` với userId, username, position
3. Server broadcast `user-joined` và `room-users` đến tất cả clients trong room
4. Client gửi `playerMovement` khi di chuyển
5. Server batch và broadcast `allPlayersPositions` mỗi 500ms để giảm network traffic

**Tối ưu**:
- Batch position updates (500ms interval) thay vì gửi từng movement
- Debounce offline status (5s) để tránh flicker khi reconnect

### 5.2. WebRTC (Audio/Video)

**Mục đích**: Truyền media streams (audio/video) giữa các users

**Architecture**: SFU (Selective Forwarding Unit) với Mediasoup

**Flow**:
1. Client request media devices (camera/mic)
2. Client tạo Mediasoup Device và Producer
3. Server tạo Transport và Consumer cho mỗi peer
4. Media streams được forward qua SFU server (không phải P2P)
5. Client nhận Consumer streams và render vào UI

**Lợi ích SFU**:
- Giảm bandwidth cho mỗi client (không cần gửi đến tất cả peers)
- Dễ scale với nhiều users trong room
- Server có thể điều khiển chất lượng stream

---

## 6. Database Schema

### 6.1. User Model

```typescript
{
  _id: ObjectId
  email: string (unique, indexed)
  username: string
  password: string (hashed với bcrypt)
  displayName: string
  avatar: string
  avatarConfig: Object (pixel avatar config)
  role: "admin" | "member"
  lastSeen: Date
  createdAt: Date
  updatedAt: Date
}
```

### 6.2. Room Model

```typescript
{
  _id: ObjectId
  roomId: string (unique, indexed)
  name: string
  description: string
  mapData: Object (Phaser map JSON)
  maxUsers: number (default: 20)
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
```

### 6.3. Message Model

```typescript
{
  _id: ObjectId
  roomId: string (indexed)
  userId: ObjectId (ref: User)
  username: string
  content: string
  channel: "global" | "nearby" | "dm" | "group"
  targetUserId?: ObjectId (for DM)
  createdAt: Date (indexed)
}
```

### 6.4. Event Model

```typescript
{
  _id: ObjectId
  title: string
  description: string
  startTime: Date
  endTime: Date
  roomId: string
  createdBy: ObjectId (ref: User)
  createdAt: Date
}
```

---

## 7. Data Flow

### 7.1. User Login Flow

```
User → Frontend (EmailForm/PasswordLogin)
  → POST /api/auth/login
  → Backend validates credentials
  → Backend generates JWT tokens
  → Frontend stores tokens in localStorage
  → Frontend checks user profile (/api/user/me)
  → If missing avatar → Navigate to /avatar
  → Else → Navigate to /spaces
```

### 7.2. Join Room Flow

```
User → /spaces (select room)
  → Navigate to /lobby
  → Setup camera/mic
  → Navigate to /app/:roomId
  → AppPage loads GameScene
  → Socket.IO connects với roomId
  → Emit "user-join"
  → Server broadcasts "user-joined" và "room-users"
  → GameScene renders map và avatars
  → User can move và interact
```

### 7.3. Player Movement Flow

```
User presses WASD/Arrow keys
  → PlayerController updates local position
  → Emit "playerMovement" via Socket.IO
  → Server updates user position in memory
  → Server broadcasts "playerMoved" to other clients
  → Other clients update avatar position on map
  → Server batches và sends "allPlayersPositions" every 500ms
```

### 7.4. Chat Message Flow

```
User types message và sends
  → Emit "chat-message" via Socket.IO
  → Server saves message to MongoDB
  → Server broadcasts "chat-message" to room/channel
  → All clients receive và display message
```

---

## 8. Security

### 8.1. Authentication

- **JWT Tokens**: Access token (short-lived) + Refresh token (long-lived)
- **Password Hashing**: bcrypt với salt rounds
- **Rate Limiting**: Giới hạn số lần login attempt (brute force protection)
- **Account Lockout**: Lock account sau nhiều failed attempts

### 8.2. Authorization

- **Role-Based Access Control (RBAC)**: Admin vs Member roles
- **Room Permissions**: Room admin có thể quản lý room
- **Protected Routes**: RequireAuth wrapper cho protected pages

### 8.3. Input Validation

- **Sanitization**: XSS protection cho user input
- **Email Validation**: Format validation
- **Password Policy**: Minimum strength requirements

---

## 9. Performance Optimizations

### 9.1. Frontend

- **Code Splitting**: Lazy load components với `React.lazy`
- **Memoization**: `React.memo`, `useMemo`, `useCallback` cho expensive renders
- **Batch Updates**: Socket.IO batch position updates (500ms)
- **Debouncing**: Debounce offline status (5s)

### 9.2. Backend

- **Database Indexing**: Indexes trên `email`, `roomId`, `createdAt`
- **Connection Pooling**: MongoDB connection pool
- **Caching**: In-memory cache cho room users (Socket.IO)

### 9.3. Network

- **WebSocket Compression**: Socket.IO compression
- **Batch Position Updates**: Giảm ~80% network traffic
- **SFU Architecture**: Giảm bandwidth so với P2P mesh

---

## 10. Deployment Architecture

### 10.1. Development

- **Frontend**: Vite dev server (port 5174)
- **Backend**: Node.js + Express (port 5001)
- **Database**: MongoDB local hoặc Atlas
- **Socket.IO**: Cùng server với Express

### 10.2. Production (Recommended)

```
┌─────────────────┐
│   CDN/Static    │  → Frontend build (React + Phaser)
│   (Netlify/Vercel)│
└─────────────────┘
         │
         │ HTTPS
         ▼
┌─────────────────┐
│  Load Balancer  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼───┐
│ Node  │ │ Node │  → Backend servers (Express + Socket.IO)
│ Server│ │Server│
└───┬───┘ └──┬───┘
    │        │
    └───┬────┘
        │
┌───────▼────────┐
│   MongoDB      │  → Database cluster
│   (Atlas)      │
└────────────────┘
```

---

## 11. Technology Stack Summary

### Frontend
- **React 19** + **TypeScript**: UI framework
- **Phaser 3**: 2D game engine cho map và avatars
- **Socket.IO Client**: Real-time communication
- **Mediasoup Client**: WebRTC SFU client
- **React Router DOM**: Client-side routing
- **Tailwind CSS**: Styling
- **Framer Motion**: Animations

### Backend
- **Node.js** + **Express**: REST API server
- **Socket.IO Server**: WebSocket server cho real-time
- **MongoDB** + **Mongoose**: Database và ODM
- **JWT**: Authentication tokens
- **bcrypt**: Password hashing
- **Mediasoup**: WebRTC SFU server

### DevOps
- **Vite**: Build tool và dev server
- **TypeScript**: Type safety
- **ESLint**: Code linting

---

## 12. Key Design Decisions

### 12.1. SFU vs P2P cho WebRTC

**Quyết định**: Sử dụng SFU (Mediasoup) thay vì P2P mesh

**Lý do**:
- Scalability tốt hơn với nhiều users
- Giảm bandwidth cho mỗi client
- Server có thể điều khiển chất lượng stream
- Dễ debug và monitor

### 12.2. Batch Position Updates

**Quyết định**: Batch và gửi position updates mỗi 500ms thay vì real-time

**Lý do**:
- Giảm ~80% network traffic
- Vẫn đủ smooth cho user experience
- Giảm load trên server

### 12.3. Phaser + React Integration

**Quyết định**: Tách biệt Phaser Scene và React UI, communicate qua events

**Lý do**:
- Phaser cần full control của canvas
- React tốt cho UI overlays và modals
- EventBus pattern cho communication giữa 2 systems

---

## 13. Future Architecture Considerations

### 13.1. Scaling

- **Horizontal Scaling**: Multiple Socket.IO servers với Redis adapter
- **Database Sharding**: Shard rooms theo region hoặc size
- **CDN**: Static assets (maps, sprites) qua CDN

### 13.2. Features

- **Spatial Audio**: Implement 3D audio positioning
- **Screen Sharing**: Extend WebRTC để support screen share
- **Recording**: Record meetings và save to cloud storage
- **Mobile App**: React Native wrapper hoặc native app

---

## 14. References

- [Phaser 3 Documentation](https://phaser.io/docs)
- [Socket.IO Documentation](https://socket.io/docs)
- [Mediasoup Documentation](https://mediasoup.org/documentation)
- [React Router Documentation](https://reactrouter.com)
- [MongoDB Documentation](https://www.mongodb.com/docs)

---

**Lưu ý**: Tài liệu này mô tả kiến trúc hiện tại của project. Các thay đổi về architecture sẽ được cập nhật trong các phiên bản tiếp theo.
