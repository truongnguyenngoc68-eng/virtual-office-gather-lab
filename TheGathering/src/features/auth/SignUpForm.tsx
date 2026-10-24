import * as React from "react";
import { FaEye, FaEyeSlash, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { useToast } from '../../contexts/ToastContext';

interface Props { 
  email: string; 
  onSuccess: (data: { password: string; fullName: string }) => void; 
  onBack: () => void; 
}

export default function SignUpForm({ email, onSuccess, onBack }: Props) {
  const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:5001";
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);

  // Khớp với backend: 8 ký tự, hoa, thường, số, ký tự đặc biệt
  const [passValidations, setPassValidations] = React.useState({
    minLength: false,
    hasNumber: false,
    hasUpper: false,
    hasLower: false,
    hasSpecial: false,
    noSequence: true,
  });
  const [showTooltip, setShowTooltip] = React.useState(false);
  const { showToast } = useToast();

  const specialCharRegex = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

  React.useEffect(() => {
    setPassValidations({
      minLength: password.length >= 8,
      hasNumber: /\d/.test(password),
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasSpecial: specialCharRegex.test(password),
      noSequence: !/(123|abc|qwerty)/i.test(password),
    });
  }, [password]);

  const isPasswordStrong = Object.values(passValidations).every(Boolean);
  const isFormValid = isPasswordStrong && firstName.trim() && lastName.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      showToast("Vui lòng nhập đầy đủ họ và tên.", { variant: "error" });
      return;
    }
    if (!isPasswordStrong) {
      showToast("Mật khẩu chưa đủ mạnh. Vui lòng xem yêu cầu bên dưới.", { variant: "error" });
      setShowTooltip(true);
      return;
    }

    try {
      const res = await fetch(`${serverUrl}/api/auth/send-otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      showToast(`Mã xác thực đã gửi đến ${email}`, { variant: "success" });
      const fullName = `${firstName} ${lastName}`.trim();
      onSuccess({ password, fullName }); 

    } catch (err) {
      showToast((err as Error).message, { variant: "error" });
    }
  };

  return (
    <div className="login-container">
      <h1 style={{ textAlign: 'left', marginBottom: '10px', fontSize: '1.8rem' }}>Tạo Tài Khoản</h1>
      <p style={{ textAlign: 'left', fontSize: '0.9rem', color: '#666', marginBottom: '20px' }}>
        Vui lòng nhập tên đầy đủ của bạn và mật khẩu.
      </p>

      <form onSubmit={handleSubmit}>
        {/* HỌ TÊN */}
        <input 
          className="email-input" placeholder="Tên" 
          value={firstName} onChange={e=>setFirstName(e.target.value)} required 
        />
        <input 
          className="email-input" placeholder="Họ" 
          value={lastName} onChange={e=>setLastName(e.target.value)} required 
        />

        {/* MẬT KHẨU + TOOLTIP */}
        <div style={{ position: 'relative' }}>
          <input 
            type={showPassword ? "text" : "password"} 
            className={`email-input ${showTooltip && !isPasswordStrong ? 'input-error' : ''}`}
            placeholder="Mật khẩu" 
            value={password} 
            onChange={e=>setPassword(e.target.value)}
            onFocus={() => setShowTooltip(true)}
            onBlur={() => setShowTooltip(false)}
            required 
            style={{ paddingRight: '40px' }}
          />
          <span 
            onClick={() => setShowPassword(!showPassword)}
            style={{ position: 'absolute', right: '15px', top: '15px', cursor: 'pointer', color: '#666' }}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>

          {/* TOOLTIP VALIDATION – khớp backend, hiện khi focus hoặc khi bấm Tiếp tục mà pass yếu */}
          {showTooltip && (
            <div className="password-tooltip">
              <p style={{fontWeight: 'bold', marginBottom: 5}}>Mật khẩu phải bao gồm ít nhất:</p>
              <ul>
                <li className={passValidations.minLength ? 'valid' : 'invalid'}>
                  {passValidations.minLength ? <FaCheckCircle/> : <FaTimesCircle/>} 8 ký tự
                </li>
                <li className={passValidations.hasNumber ? 'valid' : 'invalid'}>
                  {passValidations.hasNumber ? <FaCheckCircle/> : <FaTimesCircle/>} 1 số
                </li>
                <li className={passValidations.hasUpper ? 'valid' : 'invalid'}>
                  {passValidations.hasUpper ? <FaCheckCircle/> : <FaTimesCircle/>} 1 chữ cái viết hoa
                </li>
                <li className={passValidations.hasLower ? 'valid' : 'invalid'}>
                  {passValidations.hasLower ? <FaCheckCircle/> : <FaTimesCircle/>} 1 chữ cái viết thường
                </li>
                <li className={passValidations.hasSpecial ? 'valid' : 'invalid'}>
                  {passValidations.hasSpecial ? <FaCheckCircle/> : <FaTimesCircle/>} 1 ký tự đặc biệt (!@#$%^&*...)
                </li>
              </ul>
              <p style={{fontWeight: 'bold', marginTop: 10, marginBottom: 5}}>Không được có:</p>
              <ul>
                <li className={passValidations.noSequence ? 'valid' : 'invalid'}>
                  {passValidations.noSequence ? <FaCheckCircle/> : <FaTimesCircle/>} Chuỗi dễ đoán (123, abc, qwerty...)
                </li>
              </ul>
            </div>
          )}
        </div>

        <button 
          className="btn btn-email" 
          style={{ marginTop: '20px', opacity: isFormValid ? 1 : 0.6, cursor: isFormValid ? 'pointer' : 'not-allowed' }}
          disabled={!isFormValid}
        >
          Tiếp tục
        </button>
      </form>
      
      <button className="cancel-button" onClick={onBack} type="button">Quay lại</button>
    </div>
  );
}