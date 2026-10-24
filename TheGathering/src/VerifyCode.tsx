// src/VerifyCode.tsx
import React, { useState, useRef } from 'react';
import { useToast } from './contexts/ToastContext';

// Định nghĩa kiểu cho props
interface VerifyCodeProps {
  email: string;
  onCancel: () => void;
}

function VerifyCode({ email, onCancel }: VerifyCodeProps) {
  const [code, setCode] = useState<string[]>(Array(6).fill(''));
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const { showToast } = useToast();

  // Hàm xử lý khi nhập/xóa trong ô OTP
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const { value } = e.target;
    if (value.length > 1 || !/^[0-9]?$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
    
    const fullCode = newCode.join('');
    if (fullCode.length === 6) {
      handleSubmitCode(fullCode);
    }
  };

  // Hàm xử lý phím Backspace
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  // ▼▼▼ HÀM NÀY ĐƯỢC CẬP NHẬT ▼▼▼
  // Gửi mã 6 số về backend để xác thực
  const handleSubmitCode = async (fullCode: string) => {
    try {
      // 1. Gọi API mới để XÁC THỰC MÃ
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:5001'}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, otp: fullCode }), // Gửi email và mã OTP
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Xác thực mã thất bại.');
      
      // 2. ĐĂNG NHẬP THÀNH CÔNG (luồng cũ, hiện tại không dùng chính)
      showToast(data.message || "Đã xác thực mã", { variant: "success" });
      
      // 3. Lưu token JWT nếu backend trả (giữ lại để không phá luồng cũ)
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

    } catch (error) {
      showToast((error as Error).message, { variant: "error" });
      // Reset ô nhập nếu sai
      setCode(Array(6).fill(''));
      inputsRef.current[0]?.focus();
    }
  };

  return (
    <div className="login-container">
      <div className="logo"></div>
      <h1>Enter your code</h1>
      <p className="verify-subtitle">
        We just emailed <span className="verify-email">{email}</span> with a 6-digit code.
        If you don't see it, please check your spam folder.
      </p>
      
      <div className="otp-container">
        {code.map((digit, index) => (
          <input
            key={index}
            type="tel"
            className="otp-input"
            maxLength={1}
            value={digit}
            onChange={(e) => handleInputChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            ref={(el) => { inputsRef.current[index] = el; }}
          />
        ))}
      </div>
      
      <button type="button" className="cancel-button" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}

export default VerifyCode;