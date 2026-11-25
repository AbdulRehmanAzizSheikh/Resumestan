"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function VerifyEmailPage() {
  const router = useRouter();
  // Hydrate from localStorage on the client — no setState in effects.
  const [email, setEmail] = useState(
    () => (typeof window === "undefined" ? "" : localStorage.getItem("emailForVerifyOtp") || "")
  );
  const [step, setStep] = useState(() => {
    if (typeof window === "undefined") return "send";
    const savedOtpSent = localStorage.getItem("otpSent");
    return savedOtpSent === "true" && localStorage.getItem("otpExpiry") ? "verify" : "send";
  });
  const [countdown, setCountdown] = useState(() => {
    if (typeof window === "undefined") return 600;
    const savedExpiry = Number(localStorage.getItem("otpExpiry"));
    if (localStorage.getItem("otpSent") !== "true" || !savedExpiry) return 600;
    return Math.max(0, Math.ceil((savedExpiry - Date.now()) / 1000));
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (step !== "verify") return;

    if (countdown <= 0) {
      localStorage.setItem("otpSent", "false");
      localStorage.setItem("otpExpiry", "");
      toast.error("OTP expired. Please send a new one.");
      const timer = setTimeout(() => setStep("send"), 0);
      return () => clearTimeout(timer);
    }

    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [step, countdown]);

  const sendOtp = async () => {
    if (!email.trim()) {
      toast.error("Please enter your email.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/verify/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to send OTP.");
      }

      const expiry = Date.now() + 10 * 60 * 1000;
      localStorage.setItem("emailForVerifyOtp", email.trim().toLowerCase());
      localStorage.setItem("otpExpiry", String(expiry));
      localStorage.setItem("otpSent", "true");
      setCountdown(600);
      setStep("verify");
      toast.success(data.message || "OTP sent successfully.");
    } catch (error) {
      toast.error(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp.trim()) {
      toast.error("Please enter the OTP.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/verify/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Verification failed.");
      }

      localStorage.setItem("otpSent", "false");
      localStorage.setItem("otpExpiry", "");
      toast.success(data.message || "Email verified successfully.");
      router.push("/login");
    } catch (error) {
      toast.error(error.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent px-4 py-10">
      <div className="w-full max-w-md border border-slate-200 bg-white/80 p-8 shadow-[0_25px_80px_rgba(15,23,42,0.10)] backdrop-blur-sm">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex border border-indigo-200 bg-indigo-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-indigo-700">
            Security check
          </div>
          <h1 className="text-3xl font-black text-slate-900">
            {step === "send" ? "Verify your email" : "Enter OTP"}
          </h1>
        </div>

        <div className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
            />
          </div>

          {step === "verify" && (
            <div>
              <div className="mb-2 flex items-center justify-between text-sm text-slate-700">
                <label htmlFor="otp" className="font-medium">
                  One-time password
                </label>
                <span className="border border-indigo-200 bg-indigo-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-700">
                  {formatTime(countdown)}
                </span>
              </div>

              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Enter 6-digit OTP"
                className="w-full border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
              />
            </div>
          )}

          <button
            type="button"
            onClick={step === "send" ? sendOtp : verifyOtp}
            className="w-full bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 active:scale-[0.99]"
          >
            {step === "send" ? "Send OTP" : "Verify OTP"}
          </button>

          {step === "verify" && (
            <button
              type="button"
              onClick={sendOtp}
              className="w-full border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"
            >
              Resend OTP
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
