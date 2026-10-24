import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

declare global {
  interface Window {
    google: any;
  }
}

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Mật khẩu không khớp");
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_SERVER_URL || "http://localhost:5001"
        }/api/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, email, password }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/lobby");
      } else {
        setError(data.message || "Đăng ký thất bại");
      }
    } catch (err) {
      setError("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError("");
    setLoading(true);

    try {
      // Load Google Identity Services
      if (!window.google) {
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);

        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }

      // Initialize Google Sign-In
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
        callback: async (response: any) => {
          try {
            // Decode JWT token
            const base64Url = response.credential.split(".")[1];
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const jsonPayload = decodeURIComponent(
              atob(base64)
                .split("")
                .map(
                  (c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
                )
                .join("")
            );
            const credential = JSON.parse(jsonPayload);

            // Send to backend
            const authResponse = await fetch(
              `${
                import.meta.env.VITE_SERVER_URL || "http://localhost:5001"
              }/api/auth/google`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  googleId: credential.sub,
                  email: credential.email,
                  username: credential.name || credential.email.split("@")[0],
                  avatar: credential.picture,
                }),
              }
            );

            const data = await authResponse.json();

            if (authResponse.ok) {
              localStorage.setItem("token", data.token);
              localStorage.setItem("user", JSON.stringify(data.user));
              navigate("/lobby");
            } else {
              setError(data.message || "Đăng ký Google thất bại");
            }
          } catch (err) {
            setError("Lỗi xử lý đăng ký Google");
          } finally {
            setLoading(false);
          }
        },
      });

      // Prompt sign-in
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          window.google.accounts.id.renderButton(
            document.getElementById("google-signin-button") as HTMLElement,
            {
              theme: "outline",
              size: "large",
              width: "100%",
            }
          );
        }
      });
    } catch (err) {
      setError("Không thể tải Google Sign-In. Vui lòng thử lại.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0e13] p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-violet-600/20 blur-[120px] animate-float" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-fuchsia-600/20 blur-[100px] animate-float" style={{ animationDelay: "-3s" }} />
      </div>

      <div className="w-full max-w-[420px] glass-panel rounded-2xl p-8 md:p-10 shadow-2xl relative z-10 animate-scaleIn">
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-3 text-2xl font-bold text-white no-underline mb-6 font-display"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-violet-500/20">
              G
            </div>
            <span>Gather</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2 font-display tracking-tight">Create Account</h1>
          <p className="text-slate-400 text-sm font-light">
            Start your journey in the virtual workspace
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label
              htmlFor="username"
              className="text-xs font-semibold text-slate-300 uppercase tracking-wide"
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              required
              className="px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all"
            />
          </div>

          <div className="flex flex-col gap-2">
             <label
              htmlFor="email"
              className="text-xs font-semibold text-slate-300 uppercase tracking-wide"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              autoComplete="email"
              required
              className="px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="password"
              className="text-xs font-semibold text-slate-300 uppercase tracking-wide"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              className="px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all"
            />
          </div>

          <div className="flex flex-col gap-2">
             <label
              htmlFor="confirmPassword"
              className="text-xs font-semibold text-slate-300 uppercase tracking-wide"
            >
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              className="px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-xl font-semibold shadow-lg shadow-violet-500/25 transition-all transform hover:translate-y-[-1px] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-2"
            disabled={loading}
          >
            {loading ? (
                <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                </span>
            ) : "Create Account"}
          </button>
        </form>

        <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#15141b] px-3 text-slate-500 font-medium tracking-wide">Or join with</span>
            </div>
        </div>

        <button
          type="button"
          className="w-full px-4 py-3 bg-white text-gray-800 rounded-xl font-semibold transition-all hover:bg-gray-100 flex items-center justify-center gap-3 text-sm"
          onClick={handleGoogleRegister}
          disabled={loading}
        >
          <svg className="w-5 h-5" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853" />
            <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.712s.102-1.172.282-1.712V4.956H.957C.348 6.174 0 7.55 0 9s.348 2.826.957 4.044l3.007-2.332z" fill="#FBBC05" />
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.956L3.964 7.288C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
          </svg>
          Sign up with Google
        </button>
        <div id="google-signin-button"></div>

        <div className="mt-8 text-center text-sm text-slate-400">
          <p>
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-violet-400 no-underline font-semibold hover:text-violet-300 transition-colors"
            >
               Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
