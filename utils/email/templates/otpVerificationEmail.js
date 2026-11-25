export default function otpVerificationEmail({ otp = "123456", name = "User" }) {
  return `
    <div style="font-family: Arial, sans-serif; background:#f8fafc; padding:32px 16px;">
      <div style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:20px; overflow:hidden; border:1px solid #e2e8f0; box-shadow:0 18px 48px rgba(15,23,42,.08);">
        <div style="background:linear-gradient(135deg,#0f172a,#1d4ed8); color:#fff; padding:28px 24px; text-align:center;">
          <div style="font-size:12px; letter-spacing:2px; text-transform:uppercase; opacity:.8; margin-bottom:8px;">Verify your account</div>
          <h1 style="margin:0; font-size:28px; font-weight:700;">Verify your email</h1>
        </div>

        <div style="padding:28px 24px; color:#0f172a;">
          <p style="margin:0 0 18px; font-size:15px; line-height:1.7; color:#334155;">
            Hello <strong>${name}</strong>,
          </p>
          <p style="margin:0 0 22px; font-size:15px; line-height:1.7; color:#334155;">
            Your OTP for email verification is below. Please use it within 10 minutes to complete your account setup.
          </p>

          <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:14px; text-align:center; padding:24px 16px; margin:18px 0 22px;">
            <div style="font-size:12px; color:#1d4ed8; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:10px;">Your OTP</div>
            <div style="font-size:38px; letter-spacing:10px; font-weight:800; color:#0f172a;">${otp}</div>
          </div>

          <p style="margin:0; font-size:14px; line-height:1.7; color:#475569;">
            If you did not request this code, you can safely ignore this email.
          </p>
        </div>

        <div style="background:#f8fafc; padding:18px 24px; text-align:center; color:#64748b; font-size:12px; border-top:1px solid #e2e8f0;">
          Secure account verification</div>
        </div>
      </div>
    </div>
  `;
}
