# Đăng nhập Admin

## Cách gán quyền admin cho một user

1. User đã đăng ký (có email trong MongoDB).
2. Trong thư mục `backend`, chạy:
   ```bash
   npx tsx scripts/set-admin.ts <email_của_user>
   ```
   Ví dụ:
   ```bash
   npx tsx scripts/set-admin.ts phatdeptrai@gmail.com
   ```
3. User đó đăng xuất rồi đăng nhập lại (hoặc tải lại trang Dashboard). Sidebar sẽ hiện mục **Admin** và có thể vào `/admin` để quản lý rooms, xem tin nhắn, v.v.

## Gán admin bằng MongoDB shell

```javascript
db.users.updateOne(
  { email: "email_cua_ban@example.com" },
  { $set: { role: "admin" } }
)
```

Sau khi đổi role, cần đăng nhập lại (hoặc refresh) để frontend lấy lại `user.role` từ `/api/user/me`.
