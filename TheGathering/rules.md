OK 👍 mình đề xuất cho bạn **một bộ “luật hệ thống” chuẩn cho app chat/voice giống Discord**, **thực tế – dễ triển khai – ghi vào README hoặc dùng làm validation backend**.

Mình chia theo **nhóm chức năng**, mỗi luật có **ý nghĩa + gợi ý triển khai ngắn** (đúng với kiến trúc hiện tại của bạn).

---

# 📜 SYSTEM RULES – CHAT & VOICE APP

## 1️⃣ TÀI KHOẢN & ĐĂNG NHẬP

### 1. Không được trùng **username**

* Username là **unique toàn hệ thống**
* Không phân biệt hoa/thường

**Triển khai**

```ts
username.toLowerCase()
unique index trong DB
```

---

### 2. 1 tài khoản chỉ đăng nhập **1 thời điểm**

* Login mới → **kick session cũ**
* Tránh spam + tránh ghost user

**Triển khai**

```ts
Map<userId, socketId>
login mới → disconnect socket cũ
```

---

### 3. Username không được:

* Rỗng
* Toàn ký tự đặc biệt
* Dài quá 20 ký tự

---

### 4. Không cho đổi username quá thường xuyên

* Tối đa **1 lần / 24h**
* Tránh spam đổi tên

---

## 2️⃣ PHÒNG (ROOM / SERVER)

### 5. 1 user chỉ ở **1 room tại 1 thời điểm**

* Join room mới → leave room cũ

---

### 6. Không được join room không tồn tại

* Validate roomId trước khi join

---

### 7. Room phải có **ít nhất 1 admin**

* Admin cuối cùng rời → chuyển quyền cho user khác

---

## 3️⃣ CHANNEL (TEXT / VOICE)

### 8. Channel name **không được trùng trong cùng room**

* `#general` chỉ có **1**

---

### 9. Channel name:

* Không chứa space đầu/cuối
* Không ký tự đặc biệt nguy hiểm
* Tối đa 30 ký tự

---

### 10. Không được xóa channel mặc định

* `#general`
* `Voice: Lobby`

---

### 11. Voice channel có giới hạn người

* Ví dụ: **max 20 users**
* Full → không cho join

**Triển khai**

```ts
if (voiceUsers.length >= 20) reject()
```

---

## 4️⃣ CHAT MESSAGE

### 12. Message không được rỗng

* Trim trước khi gửi

---

### 13. Giới hạn độ dài message

* Text: **≤ 2000 ký tự**
* Emoji reaction: max 20/user/message

---

### 14. Spam protection

* 1 user:

  * ≤ 5 message / 3 giây
* Vi phạm → mute tạm

---

### 15. Không được chỉnh sửa message của người khác

---

### 16. Xóa message:

* User thường: xóa message của mình
* Admin: xóa tất cả

---

### 17. Message đã xóa:

* Không được react
* Không được reply

---

## 5️⃣ DIRECT MESSAGE (DM)

### 18. Không được DM chính mình

---

### 19. DM chỉ tồn tại giữa **2 user**

* Không có DM nhóm (trừ khi tạo Group Chat riêng)

---

### 20. Không thể gửi DM nếu user offline *(optional)*

* Hoặc lưu queue

---

## 6️⃣ VOICE / CALL (20 NGƯỜI)

### 21. Mỗi user chỉ được join **1 voice channel**

* Join channel mới → auto leave channel cũ

---

### 22. Voice channel tối đa 20 người

* SFU bắt buộc
* Reject nếu full

---

### 23. Mic / audio state là per-user

* Không ảnh hưởng user khác

---

### 24. User bị disconnect → auto leave voice

* Cleanup producer / consumer

---

## 7️⃣ FILE & MEDIA

### 25. Giới hạn upload

* Size: ≤ 10MB
* Type: image / pdf / text

---

### 26. Không cho upload executable

* `.exe`, `.bat`, `.sh`

---

### 27. File không được đổi tên trùng trong cùng message

---

## 8️⃣ ONLINE STATUS

### 28. User chỉ có 1 trạng thái

* online / offline / in-voice

---

### 29. Disconnect socket → offline sau 5s

* Tránh reconnect nháy trạng thái

---

## 9️⃣ BẢO MẬT & HỆ THỐNG

### 30. Không trust client

* Tất cả validate ở server

---

### 31. Rate limit socket event

* `send-message`
* `join-voice`
* `react`

---

### 32. Log các hành động quan trọng

* login
* kick
* delete channel
* join voice

---

## 🧠 Ghi chú DEV/DEMO (hay gặp khi test nhiều browser)

### 33. “Too many requests” khi mở Edge + Chrome cùng lúc **không phải bug browser**

**Bản chất**: backend rate-limit theo **IP** (và/hoặc auth endpoint).

**Tình huống**:
- Edge login/register
- Chrome login/register gần như đồng thời
- Cùng **1 IP** → vượt ngưỡng → server trả 429: `Too many requests, please try again later`

**Cách làm đúng**:
- Rate limit theo **IP + endpoint** (không gom tất cả endpoint chung một bucket)
- Ở local/demo: nới limit cho `/api/auth/*` (hoặc disable rate limit trong dev)

(Trong production vẫn giữ auth limit chặt để chống brute-force.)

# 🔥 GỢI Ý DÙNG THỰC TẾ

👉 Bạn có thể:

* Copy nguyên danh sách này vào:

  * `README.md`
  * `docs/rules.md`
* Hoặc map thành:

```ts
rules.ts
validateJoinRoom()
validateSendMessage()
```

