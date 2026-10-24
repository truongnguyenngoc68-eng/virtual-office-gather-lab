import { useState, useEffect } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
// global.css is removed, styles are in index.css
import { authFetch } from "./utils/authFetch";
import { useToast } from "./contexts/ToastContext";

// --- COMPONENTS ---
import Header from "./components/Header";
import EmailForm from "./features/auth/EmailForm";
import PasswordLogin from "./features/auth/PasswordLogin";
import SignUpForm from "./features/auth/SignUpForm";
import RegisterVerify from "./features/auth/RegisterVerify";
import ResetPassword from "./features/auth/ResetPassword";
import AvatarSelection from "./features/auth/AvatarSelection";

// --- PAGES ---
import LandingPage from "./pages/LandingPage";
import SettingsLayout from "./features/settings/SettingsLayout";

import bannerVideo from "./assets/banner-video.mov";

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:5001";

function deriveNameFromEmail(email: string) {
  const e = (email || "").trim();
  if (!e) return "guest";
  const at = e.indexOf("@");
  return (at > 0 ? e.slice(0, at) : e) || "guest";
}

export default function LegacyAuthFlow() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // --- STATE ---
  const [isLanding, setIsLanding] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(null);

  const [step, setStep] = useState<
    | "check_email"
    | "login_password"
    | "signup_form"
    | "register_verify"
    | "forgot_verify"
    | "reset_password"
    | "avatar_selection"
    | "settings"
  >("check_email");

  const [userEmail, setUserEmail] = useState("");
  const [regData, setRegData] = useState({ password: "", fullName: "" });
  const [otpCode, setOtpCode] = useState("");

  // --- USE EFFECT (CHECK LOGIN & THEME) ---
  useEffect(() => {
    // 1. Check Login
    const token = localStorage.getItem("token");
    if (token) {
      setAuthToken(token);
      // Kiểm tra thông tin user và điều hướng thẳng sang giao diện mới
      authFetch(`${SERVER_URL}/api/user/me`)
        .then(async (res) => {
          if (!res.ok) {
            throw new Error(`me failed (${res.status})`);
          }
          return res.json();
        })
        .then((data) => {
          if (data) {
            localStorage.setItem("user", JSON.stringify(data));
          }

          const hasAvatarConfig =
            data.avatarConfig && Object.keys(data.avatarConfig).length > 0;
          const hasDisplayName =
            data.displayName && data.displayName.trim().length > 0;

          setIsLanding(false);
          // Nếu thiếu avatar hoặc displayName thì bắt user vào trang avatar pixel mới
          if (!hasAvatarConfig || !hasDisplayName) {
            navigate("/avatar", { replace: true });
          } else {
            // Ngược lại đưa thẳng vào luồng workspace mới
            navigate("/spaces", { replace: true });
          }
        })
        .catch((err) => {
          console.error("Lỗi kiểm tra thông tin user:", err);
          // Token invalid/expired and refresh failed -> force login
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          localStorage.removeItem("userName");
          localStorage.removeItem("userAvatar");
          setAuthToken(null);
          setIsLanding(true);
          setStep("check_email");
        });
    }

    // 2. Check Theme
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- HANDLERS ---
  const handleStartSession = () => {
    setIsLanding(false);
    // Always show login form when clicking "Đăng nhập" button
    // This allows users to login with a different account if needed
    setStep("check_email");
  };

  const handleEditAvatarRequest = () => {
    setStep("avatar_selection");
  };

  const handleSettingsRequest = () => {
    setStep("settings");
  };

  const handleEmailChecked = (email: string, isNewUser: boolean) => {
    setUserEmail(email);
    setStep(isNewUser ? "signup_form" : "login_password");
  };

  const handleInfoSubmitted = (data: { password: string; fullName: string }) => {
    setRegData(data);
    setStep("register_verify");
  };

  const handleAuthSuccess = async (token: string, refreshToken?: string) => {
    console.log("Auth Success! Token:", token);
    setAuthToken(token);
    localStorage.setItem("token", token);
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);

    // Hydrate user profile, then decide next step:
    // - has avatarConfig + displayName -> dashboard
    // - else -> avatar_selection
    try {
      const res = await authFetch(`${SERVER_URL}/api/user/me`, {
        // We just stored fresh tokens; avoid refresh recursion here.
        noRefresh: true,
      });
      if (res.ok) {
        const user = await res.json();
        localStorage.setItem("user", JSON.stringify(user));
        const userName =
          user.displayName ||
          user.username ||
          deriveNameFromEmail(user.email || userEmail) ||
          "guest";
        localStorage.setItem("userName", userName);
        localStorage.setItem(
          "userAvatar",
          (user.avatar || String(userName).charAt(0) || "G").toUpperCase()
        );

        const hasAvatarConfig =
          user.avatarConfig && Object.keys(user.avatarConfig).length > 0;
        const hasDisplayName =
          user.displayName && String(user.displayName).trim().length > 0;

        setIsLanding(false);
        if (!hasAvatarConfig || !hasDisplayName) {
          navigate("/avatar", { replace: true });
        } else {
          navigate("/spaces", { replace: true });
        }
        return;
      } else {
        // Fallback to minimal user shape
        const fallbackName = deriveNameFromEmail(userEmail);
        localStorage.setItem(
          "user",
          JSON.stringify({ email: userEmail, username: fallbackName })
        );
        localStorage.setItem("userName", fallbackName);
        localStorage.setItem("userAvatar", fallbackName.charAt(0).toUpperCase());
      }
    } catch (e) {
      console.warn("Could not hydrate user profile for route-based pages:", e);
    }

    // Nếu không chắc trạng thái profile, ưu tiên đưa user sang editor avatar mới
    setIsLanding(false);
    navigate("/avatar", { replace: true });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("userName");
    localStorage.removeItem("userAvatar");
    localStorage.removeItem("roomId");
    localStorage.removeItem("roomName");
    setAuthToken(null);
    setStep("check_email");
    setIsLanding(true);
  };

  const handleForgotPassword = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast(data.message, { variant: "success" });
      setStep("forgot_verify");
    } catch (err) {
      showToast((err as Error).message, { variant: "error" });
    }
  };

  const handleVerifyForgotOtp = async (otp: string) => {
    try {
      const res = await fetch(`${SERVER_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, otp }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Mã OTP không hợp lệ hoặc đã hết hạn");
      setOtpCode(otp);
      setStep("reset_password");
    } catch (err) {
      showToast((err as Error).message, { variant: "error" });
    }
  };

  const handleEnterWorkspace = () => {
    // Sau khi đã có avatar + profile, người dùng mới vào bước setup cam/mic (Lobby)
    navigate("/lobby");
  };

  // --- RENDER ---
  // 1. LANDING
  if (isLanding) {
    return <LandingPage onJoin={handleStartSession} />;
  }

  const authContent = (
    <>
      {/* 2. SETTINGS */}
      {step === "settings" && <SettingsLayout onBack={() => setIsLanding(true)} />}

      {/* 3. AVATAR SELECTION (legacy - now handled by /avatar route) */}
      {step === "avatar_selection" && (
        <AvatarSelection token={authToken || ""} onSuccess={() => navigate("/spaces", { replace: true })} />
      )}

      {/* 4. AUTH FLOW */}
      {step !== "avatar_selection" &&
        step !== "settings" && (
          <>
            <Header />

            <div className="login-page">
              <div className="left-panel">
                <button onClick={() => setIsLanding(true)} className="back-to-landing-btn">
                  ← Trang chủ
                </button>

                <div className="banner-card">
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="banner-video"
                    src={bannerVideo}
                  />
                  <div className="banner-overlay">
                    <div className="banner-logos">
                      <span>Meeting</span>
                      <span className="text-gray-300">|</span>
                      <span className="text-[#0E71EB]">The Gathering</span>
                    </div>
                    <div className="banner-content">
                      <h2>Không gian làm việc yên tĩnh.</h2>
                      <p>Tập trung cao độ cùng cộng đồng.</p>
                      <button className="banner-cta">Khám phá ngay</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="right-panel">
                <div className="login-container">
                  {step === "check_email" && (
                    <EmailForm
                      onSuccess={handleEmailChecked}
                      onBack={() => setIsLanding(true)}
                      onAuthSuccess={handleAuthSuccess}
                    />
                  )}

                  {step === "login_password" && (
                    <PasswordLogin
                      email={userEmail}
                      onBack={() => setStep("check_email")}
                      onForgotPassword={handleForgotPassword}
                      onLoginSuccess={handleAuthSuccess}
                    />
                  )}

                  {step === "signup_form" && (
                    <SignUpForm
                      email={userEmail}
                      onSuccess={handleInfoSubmitted}
                      onBack={() => setStep("check_email")}
                    />
                  )}

                  {step === "register_verify" && (
                    <RegisterVerify
                      email={userEmail}
                      regData={regData}
                      onBack={() => setStep("signup_form")}
                      onRegisterSuccess={handleAuthSuccess}
                    />
                  )}

                  {step === "forgot_verify" && (
                    <RegisterVerify
                      email={userEmail}
                      regData={{ password: "", fullName: "" }}
                      onBack={() => setStep("login_password")}
                      customVerifyAction={handleVerifyForgotOtp}
                      title="Đặt lại mật khẩu"
                      verifyButtonText="Xác nhận mã"
                    />
                  )}

                  {step === "reset_password" && (
                    <ResetPassword
                      email={userEmail}
                      otp={otpCode}
                      onSuccess={() => setStep("login_password")}
                    />
                  )}
                </div>

                <div className="footer-links">
                  <a href="#">Trợ giúp</a>
                  <a href="#">Điều khoản</a>
                  <a href="#">Quyền riêng tư</a>
                </div>
              </div>
            </div>
          </>
        )}
    </>
  );

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID || "no-client-id-configured"}>
      {authContent}
    </GoogleOAuthProvider>
  );
}

