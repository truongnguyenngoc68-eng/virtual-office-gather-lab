# Cấu hình Google OAuth (đăng nhập Google)

Nếu gặp lỗi **400: redirect_uri_mismatch** khi đăng nhập Google, cần thêm đúng URL vào Google Cloud Console.

## Bước 1: Mở OAuth client

1. Vào [Google Cloud Console](https://console.cloud.google.com/)
2. Chọn project của app
3. **APIs & Services** → **Credentials**
4. Mở OAuth 2.0 Client ID (loại **Web application**)

## Bước 2: Thêm URI

### Authorized JavaScript origins

Thêm **đúng** các URL sau (không dấu `/` cuối, trừ khi có):

- Production: `https://thegathering1.netlify.app`
- Local: `http://localhost:5173`

### Authorized redirect URIs

Thêm **đúng** các URL sau:

- Production: `https://thegathering1.netlify.app`
- Local: `http://localhost:5173`

(Lưu ý: app dùng `window.location.origin` làm redirect URI, nên origin phải khớp với URI đã thêm.)

## Bước 3: Lưu và chờ vài phút

Sau khi **Save**, đợi 1–2 phút rồi thử đăng nhập Google lại.

## Netlify / custom domain

Nếu dùng domain khác (ví dụ `https://myapp.netlify.app`), thêm **cả hai** (origins và redirect URIs) cho đúng domain đó.
