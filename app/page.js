"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const features = [
  {
    title: "Connect Canva",
    body: "Connect your Canva account and import any resume design in one click.",
  },
  {
    title: "AI Analysis",
    body: "Get an ATS score, strengths, and issues found in your resume.",
  },
  {
    title: "Smart Recommendations",
    body: "Pick issues you want to fix and get ready-to-paste ATS-friendly suggestions.",
  },
  {
    title: "Guides & Edit in Canva",
    body: "Save full guides and edit your resume directly in Canva with AI help.",
  },
];

export default function PublicLandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    async function checkLogin() {
      try {
        const response = await fetch("/api/auth/check-login", { method: "POST" });
        const data = await response.json();
        setIsLoggedIn(Boolean(data.isLoggedIn));
      } catch {
        setIsLoggedIn(false);
      }
    }
    checkLogin();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="App logo" className="h-10 w-10 object-contain" />
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Resumestan</div>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
            <a href="#features" className="hover:text-slate-900">Features</a>
            <a href="#about" className="hover:text-slate-900">About</a>
          </nav>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link href="/dashboard" className="bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300">
                  Login
                </Link>
                <Link href="/create-account" className="bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-2 md:items-center">
          <div>
            <div className="mb-4 inline-flex border border-sky-200 bg-sky-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-sky-700">
              AI-Powered Career Growth
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 md:text-6xl">
              Resumes that get you noticed.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-600">
              Connect your Canva resumes, get AI analysis with an ATS score, improve them with ready-to-paste
              recommendations, and edit them in Canva — with AI guidance.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {isLoggedIn ? (
                <Link href="/dashboard" className="bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800">
                  Open Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/create-account" className="bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800">
                    Start for Free
                  </Link>
                  <Link href="/login" className="border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:border-slate-300">
                    Login
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_25px_60px_rgba(15,23,42,0.08)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Your resume snapshot</p>
                <h2 className="mt-2 text-2xl font-black text-slate-900">ATS-ready feedback, fast.</h2>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">ATS Ready</span>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>ATS Score</span>
                  <span className="text-lg font-black text-emerald-700">92/100</span>
                </div>
                <div className="mt-3 h-2.5 bg-slate-200">
                  <div className="h-full w-[92%] bg-emerald-500" />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <StatBox label="Keywords match" value="Strong" tone="emerald" />
                <StatBox label="Fixable issues" value="3-5" tone="amber" />
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">AI summary</p>
                <p className="mt-2">Add clearer result-oriented metrics and keyword alignment to maximize recruiter impact.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="bg-white py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-10 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Why it works</p>
              <h2 className="mt-3 text-3xl font-black text-slate-900">Everything you need to improve your resume</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center bg-slate-900 text-lg font-black text-white">✓</div>
                  <h3 className="text-xl font-bold text-slate-900">{feature.title}</h3>
                  <p className="mt-3 text-slate-600">{feature.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="bg-slate-900 py-16 text-white">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <h2 className="mb-4 text-3xl font-black">How to get started</h2>
            <ol className="space-y-3 text-left">
              <li className="flex gap-3 text-sm text-slate-300">
                <span className="mt-0.5 rounded-full bg-white/10 px-2 py-0.5 text-xs font-black">1</span>
                Create an account (or log in)
              </li>
              <li className="flex gap-3 text-sm text-slate-300">
                <span className="mt-0.5 rounded-full bg-white/10 px-2 py-0.5 text-xs font-black">2</span>
                Connect your Canva account and add a resume
              </li>
              <li className="flex gap-3 text-sm text-slate-300">
                <span className="mt-0.5 rounded-full bg-white/10 px-2 py-0.5 text-xs font-black">3</span>
                Open the resume and click Analyze
              </li>
              <li className="flex gap-3 text-sm text-slate-300">
                <span className="mt-0.5 rounded-full bg-white/10 px-2 py-0.5 text-xs font-black">4</span>
                Get recommendations, save guides, and edit in Canva
              </li>
            </ol>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatBox({ label, value, tone }) {
  const palette = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
  };
  return (
    <div className={`rounded-xl border p-3 ${palette[tone]}`}>
      <p className="text-xs font-bold uppercase tracking-[0.18em]">{label}</p>
      <p className="mt-2 text-sm font-bold">{value}</p>
    </div>
  );
}
