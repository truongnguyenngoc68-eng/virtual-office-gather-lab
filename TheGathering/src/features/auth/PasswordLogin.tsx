import * as React from "react";
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useToast } from '../../contexts/ToastContext';

interface Props { 
  email: string; 
  onBack: () => void; 
  onForgotPassword: () => void;
  // ▼▼▼ MỚI: Hàm để báo cho App biết đã login xong ▼▼▼
  onLoginSuccess: (token: string) => void;
}

export default function PasswordLogin({ email, onBack, onForgotPassword, onLoginSuccess }: Props) {
  const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:5001";
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = React.useState(true);
  const { showToast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${serverUrl}/api/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      // ▼▼▼ QUAN TRỌNG: Truyền token lên App để chuyển trang ▼▼▼
      if (data.refreshToken) {
        localStorage.setItem("refreshToken", data.refreshToken);
      }
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }
      onLoginSuccess(data.accessToken);
      showToast("Đăng nhập thành công", { variant: "success" });
    } catch (err) {
      showToast((err as Error).message, { variant: "error" });
    }
  };

  return (
    <div className="login-container">
      <h1>Nhập mật khẩu của bạn</h1>
      
      <p style={{ fontSize: '0.95rem', color: '#666', marginBottom: '30px' }}>
        Chào mừng, <b>{email}</b> 
        <span 
          onClick={onBack} 
          style={{ color: '#0E71EB', cursor: 'pointer', marginLeft: '8px', fontWeight: 500 }}
        >
          Thay đổi
        </span>
      </p>

      <form onSubmit={handleLogin}>
        <div style={{ position: 'relative', marginBottom: '15px' }}>
          <input 
            type={showPassword ? "text" : "password"} 
            className="email-input" 
            placeholder="Mật khẩu" 
            value={password} onChange={e=>setPassword(e.target.value)} required 
            style={{ paddingRight: '40px', marginBottom: 0 }} 
          />
          <span 
            onClick={() => setShowPassword(!showPassword)}
            style={{ position: 'absolute', right: '15px', top: '14px', cursor: 'pointer', color: '#666' }}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', fontSize: '0.9rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#232333' }}>
            <input 
              type="checkbox" 
              checked={keepLoggedIn}
              onChange={(e) => setKeepLoggedIn(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            Vẫn đăng nhập
          </label>
          <a 
            onClick={(e) => { e.preventDefault(); onForgotPassword(); }} 
            href="#" 
            style={{ color: '#0E71EB', textDecoration: 'none', cursor: 'pointer' }}
          >
            Quên mật khẩu?
          </a>
        </div>

        <button className="btn btn-email">đăNg nhập</button> 
      </form>
    </div>
  );
}