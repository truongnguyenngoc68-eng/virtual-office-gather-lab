import nodemailer from "nodemailer";

const APP_NAME = "The Gathering";

function getTransporter() {
  const user = (process.env.EMAIL_USER || "").trim().replace(/^["']|["']$/g, "");
  const pass = (process.env.EMAIL_PASS || "").trim().replace(/^["']|["']$/g, "");
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Send OTP email. Uses Gmail SMTP if EMAIL_USER/EMAIL_PASS are set.
 * Otherwise logs to console (dev) and returns false.
 */
export async function sendOtpEmail(to: string, code: string, purpose: "register" | "reset"): Promise<boolean> {
  const transporter = getTransporter();
  const subject =
    purpose === "register"
      ? `[${APP_NAME}] Mã xác thực đăng ký`
      : `[${APP_NAME}] Mã đặt lại mật khẩu`;
  const text =
    purpose === "register"
      ? `Mã xác thực đăng ký của bạn là: ${code}. Mã có hiệu lực 10 phút.`
      : `Mã đặt lại mật khẩu của bạn là: ${code}. Mã có hiệu lực 10 phút.`;

  if (!transporter) {
    console.log(`[Email] OTP không gửi mail – chưa cấu hình EMAIL_USER/EMAIL_PASS trong .env. Mã OTP cho ${to}: ${code}`);
    return false;
  }

  try {
    await transporter.sendMail({
      from: `"${APP_NAME}" <${(process.env.EMAIL_USER || "").trim().replace(/^["']|["']$/g, "")}>`,
      to,
      subject,
      text,
      html: `
        <p>Xin chào,</p>
        <p>Mã xác thực của bạn là: <strong style="font-size:20px;letter-spacing:2px;">${code}</strong></p>
        <p>Mã có hiệu lực trong 10 phút.</p>
        <p>Nếu bạn không yêu cầu mã này, hãy bỏ qua email này.</p>
        <p>— ${APP_NAME}</p>
      `,
    });
    console.log(`[Email] Đã gửi OTP đến ${to}`);
    return true;
  } catch (err) {
    console.error("[Email] Gửi thất bại:", err);
    return false;
  }
}
