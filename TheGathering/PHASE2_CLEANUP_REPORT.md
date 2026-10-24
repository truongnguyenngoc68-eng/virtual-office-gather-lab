# Phase 2: Code Cleanup Report

**Ngày:** 2026-02-16  
**Mục tiêu:** Dọn code dead, xóa file không dùng, tối ưu imports

---

## ✅ Đã hoàn thành

### 1. Xóa file không sử dụng

- ✅ **`src/pages/Homepage.tsx`** - Đã xóa
  - Lý do: Không được import ở đâu cả trong codebase
  - Kích thước: ~7.4 KB

### 2. Dọn code dead trong LegacyAuthFlow.tsx

#### **Đã xóa:**
- ✅ Import `DashboardLayout` (không còn dùng)
- ✅ Block render `step === "dashboard"` (không bao giờ được trigger)
- ✅ Type `"dashboard"` trong union type của `step`

#### **Đã sửa:**
- ✅ `SettingsLayout` callback: `onBack={() => setStep("dashboard")}` → `onBack={() => setIsLanding(true)}`
  - Giờ khi back từ settings sẽ về landing page thay vì dashboard (không tồn tại)
- ✅ `AvatarSelection` callback: `onSuccess={() => setStep("dashboard")}` → `onSuccess={() => navigate("/spaces", { replace: true })}`
  - Giờ khi hoàn thành avatar sẽ đi thẳng vào spaces (luồng mới)
- ✅ Comment số thứ tự: "5. AUTH FLOW" → "4. AUTH FLOW" (sau khi xóa dashboard)

### 3. Tối ưu imports

- ✅ **`src/App.tsx`**: Bỏ import `Library` 
  - Lý do: Route `/library` đã redirect về `/spaces`, không cần component này nữa
  - File `Library.tsx` vẫn tồn tại nhưng không được import (có thể xóa sau nếu không cần)

---

## 📊 Thống kê

- **Files đã xóa:** 1 (`Homepage.tsx`)
- **Code dead đã dọn:** ~15 dòng (import + render block + type)
- **Imports đã tối ưu:** 1 (Library trong App.tsx)

---

## ⚠️ Files còn lại cần đánh giá (Phase 3)

### **`src/pages/Library.tsx`**
- ⚠️ Không còn được import ở đâu
- ⚠️ Route `/library` đã redirect
- 💡 **Đề xuất:** Xóa file này nếu không có kế hoạch dùng lại, hoặc merge logic vào `LibraryApp.tsx`

### **`src/pages/DashboardLayout.tsx`**
- ⚠️ Không còn được import ở đâu sau khi cleanup
- ⚠️ Component legacy của UI cũ
- 💡 **Đề xuất:** Xóa file này nếu chắc chắn không cần (có thể giữ lại nếu muốn reference sau này)

---

## ✅ Kết quả

- ✅ Code sạch hơn, không còn dead code
- ✅ Imports được tối ưu
- ✅ Luồng điều hướng rõ ràng hơn (không còn reference đến dashboard cũ)
- ✅ File không dùng đã được xóa

**Trạng thái:** ✅ Phase 2 hoàn thành, sẵn sàng cho Phase 3 (Tối ưu code structure & components)
