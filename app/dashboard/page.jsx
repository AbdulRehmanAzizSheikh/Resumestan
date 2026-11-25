"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { Suspense } from "react";
import { StatCard, CanvaAccountsSection, ResumeCard } from "@/components/dashboard";
import AddResumeModal from "@/components/dashboard/AddResumeModal";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [resumes, setResumes] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Show Canva OAuth result toast
  useEffect(() => {
    const canvaStatus = searchParams.get("canva");
    if (canvaStatus === "connected") {
      toast.success("Canva account connected!");
      const url = new URL(window.location.href);
      url.searchParams.delete("canva");
      window.history.replaceState(null, "", url.toString());
    } else if (canvaStatus === "failed") {
      toast.error("Canva connection failed. Please try again.");
      const url = new URL(window.location.href);
      url.searchParams.delete("canva");
      window.history.replaceState(null, "", url.toString());
    }
  }, [searchParams]);

  const fetchResumes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/resumes");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setResumes(data.resumes || []);
    } catch (err) {
      console.error("[dashboard fetchResumes]", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // Defer so setState calls land outside the synchronous effect body
    const timer = setTimeout(() => {
      void fetchResumes();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchResumes]);

  const bestScore = useMemo(() => {
    if (resumes.length === 0) return 0;
    return Math.max(...resumes.map((r) => r.analysis?.score || 0));
  }, [resumes]);

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-8">

        {/* Page heading */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-sky-700">
              Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-black">Your resume workspace</h1>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-700 transition-colors"
          >
            + Add Resume
          </button>
        </div>

        {/* Stats — only 2 */}
        <div className="grid gap-4 md:grid-cols-2 max-w-md">
          <StatCard label="Total Resumes" value={String(resumes.length)} accent="sky" />
          <StatCard
            label="Best Score"
            value={`${bestScore}/100`}
            accent="emerald"
          />
        </div>

        {/* Connected Canva Accounts */}
        <CanvaAccountsSection onAccountDisconnect={fetchResumes} />

        {/* Resume list */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black">Resumes</h2>
            <span className="text-sm text-slate-500">{resumes.length} total</span>
          </div>

          {loading ? (
            <div className="border border-slate-200 bg-white p-10 text-center text-slate-500">
              <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700" />
              Loading resumes…
            </div>
          ) : resumes.length === 0 ? (
            <div className="border border-dashed border-slate-300 bg-white p-12 text-center">
              <p className="text-slate-500">No resumes yet.</p>
              <p className="mt-1 text-sm text-slate-400">
                Connect a Canva account then click{" "}
                <button
                  onClick={() => setShowAddModal(true)}
                  className="font-bold text-sky-600 underline"
                >
                  + Add Resume
                </button>
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {resumes.map((resume) => (
                <ResumeCard
                  key={resume._id}
                  resume={resume}
                  onUpdate={fetchResumes}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Resume Modal */}
      {showAddModal && (
        <AddResumeModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchResumes();
          }}
        />
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-100">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
            <p className="text-slate-500">Loading dashboard…</p>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
