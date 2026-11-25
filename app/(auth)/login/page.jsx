"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

function SimpleLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
    </div>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const login = async () => {
    if (!email.trim() || !password.trim()) {
      toast.error("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Unverified email — store email and redirect to verify-email page
        if (res.status === 403 && data.unverified) {
          toast.error("Please verify your email first.");
          router.push("/verify-email");
          return;
        }
        throw new Error(data.message || "Login failed");
      }

      toast.success(data.message || "Login successful");
      router.push("/dashboard");
    } catch (error) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <SimpleLoader />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent px-4 py-10">
      <div className="w-full max-w-md border border-slate-200 bg-white/80 p-8 shadow-[0_25px_80px_rgba(15,23,42,0.10)] backdrop-blur-sm">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex border border-sky-200 bg-sky-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-sky-700">
            Welcome back
          </div>
          <h1 className="text-3xl font-black text-slate-900">Login</h1>
        </div>

        <div className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white"
              type="email"
              id="email"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white"
              type="password"
              id="password"
              placeholder="Enter your password"
            />
          </div>

          <button
            onClick={login}
            className="w-full bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 active:scale-[0.99]"
            type="button"
          >
            Login
          </button>

          <p className="text-center text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <Link className="font-semibold text-sky-700 hover:text-sky-600" href="/create-account">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
