import * as React from 'react';
import { FaEye, FaEyeSlash, FaCheck, FaTimes } from 'react-icons/fa';
import { useToast } from '../../contexts/ToastContext';

interface Props {
  email: string;
  otp: string; // Cần OTP để gửi kèm xác thực
  onSuccess: () => void;
}

export default function ResetPassword({ email, otp, onSuccess }: Props) {
  const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:5001";
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPass, setShowPass] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  
  // Validation State (khớp backend: có ký tự đặc biệt)
  const [validations, setValidations] = React.useState({
    minLength: false,
    hasLetter: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
    hasSpecial: false,
    noSequence: true
  });
  const { showToast } = useToast();

  const specialCharRe = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;
  React.useEffect(() => {
    setValidations({
      minLength: password.length >= 8,
      hasLetter: /[a-zA-Z]/.test(password),
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: specialCharRe.test(password),
      noSequence: !/(111|12345|abcde|qwert)/i.test(password)
    });
  }, [password]);

  const isValid = Object.values(validations).every(Boolean) && password === confirmPassword;

  const handleSubmit = async () => {
    if (!isValid) return;
    try {
      const res = await fetch(`${serverUrl}/api/auth/reset-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword: password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      showToast("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.", {
        variant: "success",
      });
      onSuccess();
    } catch (err) {
      showToast((err as Error).message, { variant: "error" });
    }
  };

  return (
    <div className="login-container">
      <h1 style={{fontSize: '1.8rem', marginBottom: 10}}>Đặt lại mật khẩu</h1>
      <p style={{color: '#666', fontSize: '0.9rem', marginBottom: 20}}>
        Vui lòng đặt mật khẩu mới cho tài khoản: <b>{email}</b>
      </p>

      {/* Mật khẩu mới */}
      <div style={{marginBottom: 15}}>
        <label style={{display:'block', marginBottom: 5, fontWeight: 500}}>Mật khẩu mới</label>
        <div style={{position: 'relative'}}>
            <input 
                type={showPass ? "text" : "password"} className="email-input" 
                value={password} onChange={e=>setPassword(e.target.value)}
                style={{marginBottom: 0}}
            />
            <span onClick={()=>setShowPass(!showPass)} style={{position: 'absolute', right: 10, top: 12, cursor:'pointer'}}>
                {showPass ? <FaEyeSlash/> : <FaEye/>}
            </span>
        </div>
      </div>

      {/* Xác nhận mật khẩu */}
      <div style={{marginBottom: 20}}>
        <label style={{display:'block', marginBottom: 5, fontWeight: 500}}>Xác nhận mật khẩu mới</label>
        <div style={{position: 'relative'}}>
            <input 
                type={showConfirm ? "text" : "password"} className="email-input" 
                value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)}
                style={{marginBottom: 0}}
            />
             <span onClick={()=>setShowConfirm(!showConfirm)} style={{position: 'absolute', right: 10, top: 12, cursor:'pointer'}}>
                {showConfirm ? <FaEyeSlash/> : <FaEye/>}
            </span>
        </div>
        {password && confirmPassword && password !== confirmPassword && <small style={{color:'red'}}>Mật khẩu không khớp</small>}
      </div>

      {/* Validation List (Giống hình bạn gửi) */}
      <div style={{textAlign: 'left', fontSize: '0.85rem', color: '#555', marginBottom: 20, background: '#f5f5f5', padding: 15, borderRadius: 8}}>
        <p style={{fontWeight: 'bold', marginBottom: 5}}>Mật khẩu phải có ít nhất:</p>
        <ul style={{paddingLeft: 20, margin: 0}}>
            <li style={{color: validations.minLength ? 'green' : 'inherit'}}>8 ký tự</li>
            <li style={{color: validations.hasLetter ? 'green' : 'inherit'}}>1 chữ cái (a, b, c...)</li>
            <li style={{color: validations.hasUpper ? 'green' : 'inherit'}}>1 chữ hoa</li>
            <li style={{color: validations.hasLower ? 'green' : 'inherit'}}>1 chữ thường</li>
            <li style={{color: validations.hasNumber ? 'green' : 'inherit'}}>1 số</li>
            <li style={{color: validations.hasSpecial ? 'green' : 'inherit'}}>1 ký tự đặc biệt (!@#$...)</li>
        </ul>
        <p style={{fontWeight: 'bold', marginTop: 10, marginBottom: 5}}>Mật khẩu không được chứa:</p>
        <ul style={{paddingLeft: 20, margin: 0}}>
            <li style={{color: validations.noSequence ? 'green' : 'red'}}>4 hoặc nhiều ký tự liên tiếp (vd: 1111, 12345)</li>
        </ul>
      </div>

      <button 
        className="btn btn-email" 
        onClick={handleSubmit}
        style={{opacity: isValid ? 1 : 0.6, cursor: isValid ? 'pointer' : 'not-allowed'}}
        disabled={!isValid}
      >
        Lưu
      </button>
    </div>
  );
}