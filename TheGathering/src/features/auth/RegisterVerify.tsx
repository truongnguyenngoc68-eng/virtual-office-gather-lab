import * as React from "react";
import { useToast } from '../../contexts/ToastContext';

interface Props { 
  email: string; 
  regData: { password: string; fullName: string }; 
  onBack: () => void; 
  customVerifyAction?: (otp: string) => void;
  onRegisterSuccess?: (token: string) => void;
  /** Khi dùng cho quên mật khẩu: title và nút hiển thị khác */
  title?: string;
  verifyButtonText?: string;
}

export default function RegisterVerify({ email, regData, onBack, customVerifyAction, onRegisterSuccess, title, verifyButtonText }: Props) {
  const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:5001";
  const [otp, setOtp] = React.useState("");
  const { showToast } = useToast();
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Trường hợp dùng cho Quên Mật Khẩu
    if (customVerifyAction) {
        customVerifyAction(otp);
        return;
    }

    // 2. Trường hợp Đăng Ký Mới
    try {
      const res = await fetch(`${serverUrl}/api/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            email, 
            password: regData.password, 
            fullName: regData.fullName, 
            otp 
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      showToast("Đăng ký thành công! Chào mừng " + regData.fullName, {
        variant: "success",
      });
      
      // ▼▼▼ QUAN TRỌNG: Truyền token lên App để chuyển sang bước chọn Avatar ▼▼▼
      if (onRegisterSuccess) {
        if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
        if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
        onRegisterSuccess(data.accessToken);
      } else {
        // Fallback nếu không truyền hàm (reload trang)
        localStorage.setItem('token', data.accessToken);
        if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
        if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
        window.location.reload();
      }

    } catch (err) {
      showToast((err as Error).message, { variant: "error" });
    }
  };

  const displayTitle = title ?? "Kiểm tra Email";
  const displayButtonText = verifyButtonText ?? "Xác minh";

  return (
    <div className="login-container">
      <h1>{displayTitle}</h1>
      <p className="verify-subtitle">
        Mã xác minh đã được gửi đến <b>{email}</b>
      </p>
      
      <form onSubmit={handleRegister}>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px' }}>
            <input 
                className="email-input" 
                style={{ textAlign: 'center', letterSpacing: '5px', fontSize: '1.2rem', fontWeight: 'bold' }}
                placeholder="MÃ OTP" 
                value={otp} 
                onChange={e => setOtp(e.target.value)} 
                required 
                maxLength={6} 
                autoFocus
            />
        </div>
        
        <button className="btn btn-email">{displayButtonText}</button>
      </form>
      
      <button className="cancel-button" onClick={onBack} type="button">
          Quay lại / Gửi lại mã
      </button>
    </div>
  );
}