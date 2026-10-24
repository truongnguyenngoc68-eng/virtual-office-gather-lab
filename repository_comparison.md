# Báo Cáo So Sánh Nền Tảng: Gather Clone vs. TheGathering

> **Dự án:** MINI WORLD PARTY — Giai đoạn 0: Nghiên cứu Nền tảng  
> **Môi trường kiểm thử độc lập:** `d:/game/research-stage0/` (Node.js v22.14.0, Chrome Headless Desktop `1280x720` & Mobile iPhone 14 Pro `393x852`)

---

## 1. Kết Luận & Đề Xuất Chọn Nền Tảng (Answer First)

> [!IMPORTANT]
> **Quyết định kỹ thuật:** Chọn **[Gather Clone (`cc26-sudo/Gather`)](https://github.com/cc26-sudo/Gather) làm bộ khung (Core Foundation)** để khởi tạo dự án **Mini World Party**, kết hợp **học hỏi cơ chế ghép lớp Sprite Sheet (`avatarComposer.ts`) và phân tách class của [TheGathering (`PhatBanhGH/TheGathering`)](https://github.com/PhatBanhGH/TheGathering)**.

**Lý do cốt lõi:**
1. **Độ gọn nhẹ & tốc độ chạy thực tế:** `Gather Clone` chỉ gồm ~1,800 dòng code sạch (React 19 + Phaser 3.90 + Express 5 + Socket.IO 4.8), không phụ thuộc Database hay dịch vụ bên thứ ba, khởi chạy ngay trong `< 1.5s` và build production trong `1.38s`.
2. **An toàn tuyệt đối về bản quyền tài nguyên (Zero Asset Copyright Risk):** Toàn bộ map, nội thất và nhân vật trong `Gather Clone` được vẽ bằng thuật toán Canvas 2D (`textures.js`), không chứa ảnh PNG ăn cắp hay thiếu giấy phép ghi công. Ngược lại, `TheGathering` chứa nhiều sprite LPC (`public/assets/avatar/`, `public/assets/objects/`) theo giấy phép **CC-BY-SA 3.0 / GPL 3.0** nhưng không kèm file `CREDITS.TXT` bắt buộc và chứa file video `banner-video.mov` nặng **57 MB**.
3. **Server Authoritative sẵn có:** `Gather Clone` đã kiểm tra va chạm (collision) trên cả Client lẫn Server (`server/socket/handlers.js` & `server/game/map.js`), rất phù hợp để mở rộng thành bản đồ Thị trấn (Town Map) và cổng vào Cửa hàng (Shop/Mini-game Portals).

---

## 2. Bảng So Sánh Tổng Quan

| Tiêu chí | Gather Clone (`cc26-sudo/Gather`) | TheGathering (`PhatBanhGH/TheGathering`) | Đánh giá cho Mini World Party |
| :--- | :--- | :--- | :--- |
| **Tech Stack Frontend** | React 19.2 + Vite 8 + Phaser 3.90 (JS/JSX) | React 18.2 + Vite 7 + Phaser 3.80 + Tailwind v4 (TS/TSX) | Gather Clone mới hơn, cực gọn; nên thêm TypeScript khi mở rộng |
| **Tech Stack Backend** | Node.js + Express 5 + Socket.IO 4.8 (In-memory) | Node.js + Express 4 + Socket.IO 4.7 + MongoDB + Mediasoup SFU + JWT/OAuth | Gather Clone dễ tách module; TheGathering bị dính chặt vào hệ thống họp văn phòng |
| **Giấy phép Mã nguồn** | **MIT** (`README.md`) / **ISC** (`server/package.json`) | **ISC** (`README.md`, `backend/package.json`) | Cả hai đều là giấy phép mở (Permissive), cho phép thương mại hóa và sửa đổi |
| **Giấy phép Tài nguyên (Assets)** | **100% Procedural Canvas 2D** (`textures.js`) — Tự do toàn quyền | Sprite LPC 64×64 (`public/assets/avatar/`) & Tileset văn phòng (**CC-BY-SA 3.0 / GPLv3**, thiếu file ghi công tác giả) | **Gather Clone an toàn 100%**; tài nguyên của TheGathering phải thay mới nếu phát hành thương mại |
| **Cơ chế Di chuyển & Va chạm** | Grid-based (theo ô 32×32px), **Server-authoritative validation** | Free-movement (Arcade Physics velocity), **Client-authoritative** (Server chỉ nhận `{x,y}` rồi phát lại) | Gather Clone chống gian lận vị trí tốt hơn; cần nâng cấp lên di chuyển mượt (Sub-tile / Arcade Physics) |
| **Hệ thống Nhân vật & Trang phục** | Chibi RPG vẽ bằng code (`drawAvatar`), 8 bộ màu (`AVATAR_STYLES`), 4 hướng | Ghép lớp ảnh PNG 64×64 theo thứ tự `LAYER_ORDER` (`avatarComposer.ts`) | Lấy kiến trúc ghép lớp Canvas (`avatarComposer.ts`) của TheGathering kết hợp phong cách Chibi của Gather Clone |
| **Cơ chế Tương tác Vật thể / Cửa hàng** | Chưa có vùng tương tác cửa hàng (chỉ có đặt/xóa nội thất và proximity) | Có `ObjectInteraction.tsx` (bấm `X` mở modal iframe/game khi cách `< 50px`) và `Zone` trong `PlayerController.ts` (bấm `E`) | Tham khảo trực tiếp cơ chế `Zone` + Modal Overlay của TheGathering để làm Cửa hàng Mini-game |
| **Thời gian Build Production** | **1.38 giây** (Bundle: 1.64 MB, gzip 452 KB) | **5.85 giây** (Kèm `banner-video.mov` nặng **57.06 MB**) | Gather Clone nhẹ hơn ~35 lần |

---

## 3. Phân Tích Cấu Trúc Source Code Chi Tiết

### 3.1. Gather Clone (`cc26-sudo/Gather`)
Cấu trúc phân tách rõ ràng giữa `client` và `server`, giao tiếp giữa React và Phaser thông qua cầu nối toàn cục `window.__GATHER__`:
* **Backend (`server/`):**
  * `server/server.js`: Khởi tạo Express + Socket.IO trên cổng `3001`, tạo bản đồ qua `generateOfficeMap()`.
  * `server/socket/handlers.js`: Xử lý toàn bộ sự kiện real-time (`player:join`, `player:move`, `player:reaction`, `furniture:place`, `conv:*`, `webrtc:*`).
  * `server/game/map.js`: Ma trận 2D `24x18` (kích thước mỗi ô `32px`), hàm `isWalkable(tile)` và `getRandomSpawn(map)`.
  * `server/shared/constants.js`: Định nghĩa `MAP_COLS`, `MAP_ROWS`, `TILE_SIZE`, `ALLOWED_REACTIONS`, `AVATAR_STYLES`.
* **Frontend (`client/src/`):**
  * `client/src/App.jsx`: Quản lý trạng thái đăng nhập tên, danh sách người chơi, Zen Mode, Builder Mode và HUD.
  * `client/src/game/PhaserGame.jsx`: Khởi tạo `Phaser.Game` với `Phaser.Scale.RESIZE` và `pixelArt: true`.
  * `client/src/game/OfficeScene.js`: Scene chính xử lý render bản đồ, nội suy di chuyển (`tweens.add` 100ms), hiển thị tên, vòng tròn proximity, bong bóng hội thoại và đặt đồ đạc.
  * `client/src/game/textures.js`: Bộ sinh texture procedural bằng Canvas 2D cho 19 loại tile và hàm `generateAvatarTexture()` vẽ nhân vật Chibi 4 hướng.

### 3.2. TheGathering (`PhatBanhGH/TheGathering`)
Ứng dụng quy mô lớn (Capstone Project "Gather 2.0") hướng tới nền tảng họp trực tuyến doanh nghiệp:
* **Backend (`backend/`):**
  * `backend/server.ts`: Hơn 1,149 dòng code tích hợp MongoDB, JWT Auth, Google OAuth, OTP Email, RBAC, Admin Portal, Chat Channels, Events Calendar và Mediasoup SFU.
* **Frontend (`src/`):**
  * Điểm sáng giá nhất cho Mini World Party nằm ở thư mục `src/components/game/` và `src/utils/avatarComposer.ts`:
    * `avatarComposer.ts` & `avatarAssets.ts`: Ghép nhiều lớp ảnh PNG (`skin`, `shoes`, `bottom`, `top`, `head`, `hair`, `glasses`, `hat`, `other`) thành một `HTMLCanvasElement` duy nhất lúc runtime rồi nạp vào Phaser qua `textures.addSpriteSheet()`.
    * `AnimationManager.ts`: Tự động cắt frame theo dòng/cột để tạo animation `walk-*` và `idle-*` cho 4 hướng.
    * `ObjectInteraction.tsx`: Khi nhân vật đi vào bán kính `< 50px` của một object có `type === "game"`, hiển thị gợi ý bấm phím để mở popup Modal chứa game bên trên canvas Phaser.

---

## 4. Kiểm Tra Giấy Phép Code, Hình Ảnh & Tài Nguyên

| Hạng mục | Gather Clone (`cc26-sudo/Gather`) | TheGathering (`PhatBanhGH/TheGathering`) |
| :--- | :--- | :--- |
| **Giấy phép Code** | **MIT** (trong `README.md`) & **ISC** (trong `server/package.json`). Cho phép sao chép, chỉnh sửa, phân phối và thương mại hóa. | **ISC** (trong `README.md` & `backend/package.json`). Cho phép sao chép, chỉnh sửa và thương mại hóa. |
| **Hình ảnh Nhân vật** | Vẽ bằng code Canvas 2D trong `textures.js` (`drawAvatar`). **Không vướng bản quyền bên thứ ba.** | Sử dụng bộ sprite **Liberated Pixel Cup (LPC)** trong `public/assets/avatar/`. Giấy phép gốc của LPC là **CC-BY-SA 3.0 / GPLv3** (bắt buộc giữ nguyên giấy phép ShareAlike và đính kèm danh sách tác giả). |
| **Hình ảnh Bản đồ & Đồ vật** | Vẽ bằng code Canvas 2D (`drawCarpet`, `drawWood`, `drawDesk`...). **Không vướng bản quyền.** | File `public/assets/objects/__Liberated_Palette_Ramps.png` và `public/assets/tiles/office.png` lấy từ bộ LPC/OpenGameArt. |
| **Kết luận Pháp lý** | **Sử dụng trực tiếp an toàn 100%.** | **Chỉ tham khảo thuật toán/kiến trúc code**; tuyệt đối **không dùng lại** thư mục `public/assets/` cho sản phẩm thương mại nếu không muốn bị ràng buộc bởi CC-BY-SA / GPL. |

---

## 5. Kết Quả Chạy Thử & Kiểm Thử Thực Tế (2 Trình Duyệt & Điện Thoại)

Chúng tôi đã thiết lập môi trường chạy thử độc lập tại `d:/game/research-stage0/` và thực hiện 2 bài kiểm thử tự động:

### 5.1. Kiểm thử Đồng bộ Multiplayer Real-time (2 Client cùng lúc)
* **Kịch bản:** Khởi chạy `Gather/server/server.js` trên cổng `3001`, kết nối đồng thời `PlayerA_Desktop` và `PlayerB_Mobile`.
* **Kết quả thực nghiệm:**
  * `game:init` trả về bản đồ `24x18` và vị trí spawn hợp lệ trong **< 15ms**.
  * Khi `PlayerA_Desktop` di chuyển (`down`, `up`, `left`), `PlayerB_Mobile` nhận tức thì sự kiện `player:moved` kèm tọa độ và hướng mặt.
  * Khi `PlayerA_Desktop` thả biểu cảm `👋` (`player:reaction`), cả màn hình Phaser và khay thông báo của `PlayerB_Mobile` hiển thị ngay lập tức.
  * Khi `PlayerA_Desktop` đặt chậu cây tại ô `(5, 7)` (`furniture:place`), `PlayerB_Mobile` nhận `furniture:placed` và ô `(5, 7)` bị khóa va chạm trên Server.

### 5.2. Kiểm thử Đa thiết bị: Desktop (`1280x720`) vs. Điện thoại (`393x852` - iPhone 14 Pro Touch)
Chạy đồng thời 2 ngữ cảnh trình duyệt Chrome độc lập kết nối vào `http://localhost:5173`:
* **Hiển thị & Co giãn màn hình (Responsive Canvas):**
  * Nhờ cấu hình `Phaser.Scale.RESIZE` trong `PhaserGame.jsx`, canvas tự động co giãn khít `1280x720` trên Desktop và `393x852` trên Mobile mà không bị vỡ hạt (`pixelArt: true`).
  * Các nút HUD trên Mobile (`🧘 Zen` tại `x:329, y:788`, `😊 React` tại `x:281, y:800`, `Builder` tại `x:316, y:72`) nằm gọn trong khung hình `393px`, không bị tràn lề.
* **Các điểm nghẽn trên Điện thoại (Mobile Blockers phát hiện qua kiểm thử):**
  1. **Không thể di chuyển nhân vật trên màn hình cảm ứng:** Cả `Gather Clone` (`OfficeScene.js`) lẫn `TheGathering` (`PlayerController.ts`) chỉ kiểm tra `cursors` và `WASD` (bàn phím cứng). Trên điện thoại không có Virtual Joystick hay Tap-to-Move.
  2. **Không có nút tương tác cảm ứng:** Trong `TheGathering`, để vào cửa hàng/tương tác vật thể phải bấm phím cứng `E` hoặc `X` trên bàn phím.
  3. **Màn hình kiểm tra Camera/Mic đầu game (`LoginScreen.jsx`):** Tự động gọi `navigator.mediaDevices.getUserMedia({ video: true, audio: true })` ngay khi mở trang. Với một game thị trấn giải trí (**Mini World Party**), việc đòi quyền Camera/Mic ngay ở màn hình đăng nhập sẽ làm rớt (drop-off) người chơi trên trình duyệt di động.
  4. **Chưa hỗ trợ Pinch-to-Zoom:** Zoom hiện chỉ bắt sự kiện con lăn chuột (`wheel`).

---

## 6. Phân Loại: Tái Sử Dụng vs. Tham Khảo vs. Viết Lại

### 6.1. Giữ lại & Tái sử dụng trực tiếp từ `Gather Clone`
* **Cầu nối React ↔ Phaser & Cấu trúc Khởi tạo:** `PhaserGame.jsx` (nâng cấp từ biến toàn cục `window.__GATHER__` lên `EventBus` có định kiểu).
* **Khung Socket.IO Server & Quản lý Trạng thái:** `server/server.js` và `server/socket/handlers.js`.
* **Hệ thống Biểu cảm (Emoji Reactions) & Bong bóng Hội thoại:** `ReactionOverlay.jsx`, `useReactions.js` và hiệu ứng tween bay lên trên đầu nhân vật trong `OfficeScene.js`.

### 6.2. Trích xuất & Tham khảo từ `TheGathering`
* **Bộ ghép lớp Trang phục (`Avatar Composer`):** Logic ghép nhiều layer sprite sheet trên một Offscreen Canvas trong `src/utils/avatarComposer.ts` và cấu trúc danh mục `src/data/avatarAssets.ts`.
* **Kiến trúc Tách lớp trong Phaser:** Cách chia nhỏ Scene thành `AnimationManager`, `PlayerManager`, `PlayerController`, `MapRenderer` trong `src/components/game/`.
* **Cơ chế Zone Tương tác & Modal Overlay:** Cách `MapRenderer.ts` đọc layer `Interactions` từ JSON bản đồ để tạo vùng kích hoạt (Trigger Zone) mở cửa hàng.

### 6.3. Những phần CẦN VIẾT LẠI hoặc XÂY MỚI cho Mini World Party
1. **Loại bỏ/Tắt mặc định WebRTC Video Call (`useProximityChat.js`, `MediaTest`):** Chuyển game sang trọng tâm **Thị trấn & Mini-game**; không ép bật Camera/Mic khi vào game.
2. **Nâng cấp Hệ thống Bản đồ (`Map System`):** Thay ma trận cứng `24x18` văn phòng trong `server/game/map.js` bằng bản đồ **Thị trấn (Town Map)** định dạng chuẩn **Tiled JSON** (hỗ trợ nhiều lớp: mặt đất, đường phố, quảng trường, tòa nhà cửa hàng, lớp vật cản và lớp `Portal/Shop Zones`).
3. **Nâng cấp Hệ thống Nhân vật & Hoạt ảnh (`Character & Animation System`):** Thay sprite tĩnh 4 frame (1 frame/hướng) của `Gather Clone` bằng hệ thống **Chibi 2D tối giản nét mượt** hỗ trợ đủ 5 trạng thái: `idle`, `walk` (đi bộ), `run` (chạy lon ton), `jump` (nhảy), `sit` (ngồi), `wave` (vẫy tay) kết hợp ghép lớp trang phục.
4. **Xây mới Bộ điều khiển Điện thoại (`Mobile Input Controller`):** Bổ sung Virtual Joystick / Tap-to-move và nút tương tác cảm ứng ("Vào cửa hàng") ngay trên màn hình khi đứng gần cửa hàng.
5. **Xây mới `Mini Game Engine` (Plugin Architecture):** Hệ thống Room/Lobby 2–4 người, Matchmaking, Ready check và cơ chế nạp/đóng module mini-game độc lập không chạm vào lõi multiplayer của thị trấn.
