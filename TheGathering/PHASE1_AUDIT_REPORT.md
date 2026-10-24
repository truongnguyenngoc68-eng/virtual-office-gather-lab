# Phase 1: Router & Legacy UI Audit Report

**Ngày:** 2026-02-16  
**Mục tiêu:** Rà soát router, xác định UI mới vs UI cũ, chuẩn hóa điều hướng

---

## ✅ Đã hoàn thành

### 1. Router Audit & Cleanup

#### **Router chính (`src/App.tsx`)**
- ✅ Xác nhận entry point: `LegacyAuthFlow` tại `/`
- ✅ Sau login luôn điều hướng:
  - Thiếu avatar/displayName → `/avatar` (pixel avatar mới)
  - Đã có avatar + displayName → `/spaces` → game/office UI mới
- ✅ Route `/library` đã được redirect về `/spaces` (không còn standalone page)

#### **Auth Flow (`src/LegacyAuthFlow.tsx`)**
- ✅ Đã xác nhận: `step === "dashboard"` **KHÔNG BAO GIỜ** được set sau khi login
- ✅ Luồng mới: Login → `/avatar` hoặc `/spaces` → không bao giờ vào dashboard cũ
- ⚠️ **Lưu ý:** Code vẫn còn import `DashboardLayout` và có logic render `step === "dashboard"`, nhưng không bao giờ được trigger trong luồng bình thường

### 2. Link Cleanup

- ✅ Sửa link `/dashboard` trong `Lobby.tsx` → `/spaces`
- ✅ Route `/library` redirect về `/spaces` (giữ `RequireAuth` wrapper)

---

## 📋 Danh sách File Legacy (Cần xử lý ở Phase 2)

### **Files KHÔNG được sử dụng (Có thể xóa an toàn)**

1. **`src/pages/Homepage.tsx`**
   - ❌ Không được import ở đâu cả
   - ✅ **An toàn để xóa** (sau khi verify không có dynamic import)

### **Files Legacy nhưng VẪN được import (Cần đánh giá kỹ)**

2. **`src/pages/DashboardLayout.tsx`**
   - ⚠️ Được import trong `LegacyAuthFlow.tsx`
   - ⚠️ Có logic render `step === "dashboard"` nhưng không bao giờ được trigger
   - 🔍 **Cần kiểm tra:** Có thể có admin/internal route nào đó vẫn dùng không?
   - 💡 **Đề xuất:** Comment out hoặc xóa code render dashboard trong `LegacyAuthFlow`, giữ file để sau nếu cần

3. **`src/pages/Library.tsx`**
   - ⚠️ Được import trong `App.tsx` nhưng route đã redirect
   - ⚠️ Có thể được dùng trong portal/admin (`AdminLibrary.tsx` - cần verify)
   - 💡 **Đề xuất:** Giữ lại nếu admin portal cần, hoặc merge logic vào `LibraryApp.tsx`

4. **`src/pages/LandingPage.tsx`**
   - ✅ Đang được dùng trong `LegacyAuthFlow` khi `isLanding === true`
   - ✅ **GIỮ LẠI** - đây là trang landing chính thức

### **Files Portal/Admin (Giữ lại - không phải legacy)**

- `src/portal/dashboard/PortalDashboard.tsx` - Portal dashboard riêng
- `src/portal/admin/AdminDashboard.tsx` - Admin dashboard
- `src/portal/admin/AdminLibrary.tsx` - Admin quản lý library
- Các file khác trong `src/portal/` - hệ thống portal riêng biệt

---

## 🔍 Routes hiện tại (Sau cleanup)

### **Public Routes**
- `/` → `LegacyAuthFlow` (landing/login)
- `/login` → redirect `/`
- `*` → redirect `/`

### **Protected Routes (RequireAuth)**
- `/lobby` → Camera/mic setup
- `/spaces` → Chọn room
- `/setup/:roomId` → Setup page
- `/avatar` → Pixel avatar editor
- `/app/:roomId` → Main game/app shell (UI mới)
- `/app/chat` → Chat page
- `/app/events` → Events page (trong app shell)
- `/app/library` → Library page (trong app shell)
- `/library` → **REDIRECT** → `/spaces` (legacy route)
- `/dashboard` → Portal dashboard (riêng biệt, không phải legacy UI)
- `/admin` → Admin dashboard (riêng biệt)

---

## ⚠️ Vấn đề còn lại

1. **`DashboardLayout` vẫn được import nhưng không dùng**
   - Code dead trong `LegacyAuthFlow.tsx` (dòng 260-267)
   - Có thể xóa hoặc comment out để code sạch hơn

2. **`Library.tsx` import nhưng route redirect**
   - Import trong `App.tsx` nhưng route redirect, có thể bỏ import

3. **Cần verify portal/admin có dùng `Library.tsx` không**
   - `AdminLibrary.tsx` có thể import component khác, không phải `Library.tsx`

---

## 📝 Đề xuất Phase 2

1. **Xóa `Homepage.tsx`** (không được dùng)
2. **Dọn code dead trong `LegacyAuthFlow.tsx`**:
   - Xóa hoặc comment out `step === "dashboard"` render block
   - Xóa import `DashboardLayout` nếu không cần
3. **Đánh giá `Library.tsx`**:
   - Kiểm tra `AdminLibrary.tsx` có dùng không
   - Nếu không → xóa hoặc merge vào `LibraryApp.tsx`
4. **Tối ưu imports**:
   - Bỏ import `Library` trong `App.tsx` nếu route đã redirect

---

## ✅ Kết luận Phase 1

- ✅ Router đã được chuẩn hóa, không còn route nào dẫn vào UI cũ sau login
- ✅ Link `/dashboard` trong Lobby đã được sửa
- ✅ Route `/library` đã redirect về flow mới
- ⚠️ Còn một số file legacy cần đánh giá kỹ trước khi xóa (Phase 2)

**Trạng thái:** ✅ Phase 1 hoàn thành, sẵn sàng cho Phase 2 (Code cleanup chi tiết)
