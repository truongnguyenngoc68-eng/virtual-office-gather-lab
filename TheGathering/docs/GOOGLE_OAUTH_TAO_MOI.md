# Hướng dẫn tạo Google OAuth mới và cấu hình Render + Netlify

## Lỗi 401: invalid_client / The OAuth client was not found

Nếu gặp lỗi này thì **Client ID** đang dùng **không tồn tại** hoặc **sai project** (client cũ đã xóa / project khác). Cần **tạo OAuth client mới** trong Google Cloud Console (project của bạn) rồi **cập nhật đúng** `VITE_GOOGLE_CLIENT_ID` trên Netlify và trong file `.env` local.

---

## Phần 1: Tạo Google OAuth Client ID (của bạn)

### Bước 1: Vào Google Cloud Console

1. Mở trình duyệt, vào: **https://console.cloud.google.com/**
2. Đăng nhập bằng tài khoản Google của bạn.

### Bước 2: Tạo project (nếu chưa có)

1. Trên cùng trang, chọn project qua dropdown (hoặc **Select a project** → **New Project**).
2. Đặt tên (ví dụ: **Gather App**) → **Create**.

### Bước 3: Bật Google+ API / OAuth consent

1. Menu bên trái: **APIs & Services** → **OAuth consent screen**.
2. Chọn **External** (cho user bất kỳ) → **Create**.
3. Điền:
   - **App name:** The Gathering (hoặc tên bạn muốn)
   - **User support email:** email của bạn
   - **Developer contact:** email của bạn
4. **Save and Continue** → qua **Scopes** → **Save and Continue** → **Back to Dashboard**.

### Bước 4: Tạo OAuth Client ID (Web application)

1. **APIs & Services** → **Credentials**.
2. **+ Create Credentials** → **OAuth client ID**.
3. **Application type:** chọn **Web application**.
4. **Name:** đặt tên (ví dụ: **Gather Web**).
5. **Authorized JavaScript origins** – thêm từng dòng:
   - `https://thegathering1.netlify.app`
   - `http://localhost:5173`
6. **Authorized redirect URIs** – thêm từng dòng:
   - `https://thegathering1.netlify.app`
   - `http://localhost:5173`
7. **Create**.
8. Trang hiện **Client ID** và **Client secret**:
   - Copy **Client ID** (dạng `xxxxx.apps.googleusercontent.com`) → dùng cho **Netlify**.
   - Copy **Client secret** → dùng cho **Render** (backend).

---

## Phần 2: Cấu hình biến môi trường

### A. Netlify (frontend)

1. Đăng nhập **https://app.netlify.com** → chọn site **The Gathering** (hoặc site của bạn).
2. **Site configuration** (hoặc **Site settings**) → **Environment variables**.
3. **Add a variable** / **Add env var**:
   - **Key:** `VITE_GOOGLE_CLIENT_ID`
   - **Value:** dán **Client ID** vừa copy (ví dụ: `123456789-xxx.apps.googleusercontent.com`).
4. Thêm (nếu chưa có):
   - **Key:** `VITE_SERVER_URL`
   - **Value:** `https://gather-18cq.onrender.com` (đúng URL backend Render của bạn).
5. **Save**.
6. **Deploys** → **Trigger deploy** → **Deploy site** (để build lại với biến mới).

### B. Render (backend)

1. Đăng nhập **https://dashboard.render.com** → chọn service **backend** (ví dụ: gather-18cq).
2. Tab **Environment**.
3. Thêm / sửa (backend hiện chỉ cần Client ID nếu sau này bạn verify token ở server):
   - **Key:** `GOOGLE_CLIENT_ID`  
     **Value:** cùng **Client ID** như trên (ví dụ dùng sau cho verify token).
   - **Key:** `GOOGLE_CLIENT_SECRET` (tùy chọn)  
     **Value:** **Client secret** từ bước 4 phần 1 – cần nếu sau này backend tự đổi code token với Google.
4. Các biến khác giữ nguyên (MongoDB, JWT, EMAIL_USER/PASS…).
5. **Save Changes** → Render sẽ tự deploy lại.

---

## Tóm tắt biến cần có

| Biến | Đặt ở đâu | Ghi chú |
|------|-----------|--------|
| `VITE_GOOGLE_CLIENT_ID` | Netlify | **Bắt buộc** – Client ID (Web application) |
| `VITE_SERVER_URL` | Netlify | **Bắt buộc** – URL backend, ví dụ `https://gather-18cq.onrender.com` |
| `GOOGLE_CLIENT_ID` | Render | Tùy chọn – cùng Client ID (để sau dùng verify token) |
| `GOOGLE_CLIENT_SECRET` | Render | Tùy chọn – Client secret (để sau dùng verify token) |

Sau khi lưu cả Netlify và Render, đợi deploy xong rồi thử đăng nhập Google lại. Nếu vẫn lỗi redirect_uri, kiểm tra lại **Authorized JavaScript origins** và **Authorized redirect URIs** trong Google Console phải khớp từng chữ với URL site (ví dụ `https://thegathering1.netlify.app`).
