"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function AddResumeModal({ onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1: select account, 2: select design, 3: enter title
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [designs, setDesigns] = useState([]);
  const [loadingDesigns, setLoadingDesigns] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch connected accounts on mount
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await fetch("/api/canva/accounts");
        const data = await res.json();
        setAccounts(data.accounts || []);
      } catch {
        toast.error("Failed to load Canva accounts");
      } finally {
        setLoadingAccounts(false);
      }
    };
    fetchAccounts();
  }, []);

  // Fetch designs when account is selected
  const handleSelectAccount = async (account) => {
    setSelectedAccount(account);
    setStep(2);
    setLoadingDesigns(true);
    setDesigns([]);
    try {
      const res = await fetch(`/api/canva/designs?accountId=${account.canvaUserId}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to load designs");
        return;
      }
      setDesigns(data.designs || []);
    } catch {
      toast.error("Failed to load designs from Canva");
    } finally {
      setLoadingDesigns(false);
    }
  };

  const handleSelectDesign = (design) => {
    setSelectedDesign(design);
    setTitle(design.title || "");
    setStep(3);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Please enter a resume title");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          canvaAccountId: selectedAccount.canvaUserId,
          canvaDesignId: selectedDesign.id,
          title: title.trim(),
          canvaLink: selectedDesign.viewUrl || `https://www.canva.com/design/${selectedDesign.id}/view`,
          thumbnailUrl: selectedDesign.thumbnailUrl || "",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to add resume");
        return;
      }
      toast.success("Resume added!");
      onSuccess();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  // Close on backdrop click
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={handleBackdrop}
    >
      <div className="w-full max-w-lg bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-sky-700">
              Step {step} of 3
            </p>
            <h2 className="mt-0.5 text-lg font-black text-slate-900">
              {step === 1 && "Select Canva Account"}
              {step === 2 && "Select Design"}
              {step === 3 && "Name Your Resume"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-xl font-bold leading-none"
          >
            ×
          </button>
        </div>

        {/* Step progress bar */}
        <div className="flex h-1 bg-slate-100">
          <div
            className="bg-sky-600 transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Body */}
        <div className="p-6">

          {/* Step 1 — Account selection */}
          {step === 1 && (
            <div>
              {loadingAccounts ? (
                <div className="flex items-center justify-center py-10">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700" />
                </div>
              ) : accounts.length === 0 ? (
                <div className="rounded border border-dashed border-slate-200 p-8 text-center">
                  <p className="text-slate-500">No Canva accounts connected yet.</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Go to the dashboard and connect a Canva account first.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {accounts.map((account) => (
                    <button
                      key={account.canvaUserId}
                      onClick={() => handleSelectAccount(account)}
                      className="flex w-full items-center justify-between border border-slate-200 bg-slate-50 px-4 py-3 text-left hover:border-sky-400 hover:bg-sky-50 transition-colors"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{account.accountName}</p>
                        <p className="text-xs text-slate-400">
                          Connected {new Date(account.connectedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-slate-400">→</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2 — Design selection */}
          {step === 2 && (
            <div>
              <button
                onClick={() => setStep(1)}
                className="mb-4 text-xs font-bold text-sky-600 hover:underline"
              >
                ← Back
              </button>
              <p className="mb-3 text-sm text-slate-500">
                Showing designs from{" "}
                <strong>{selectedAccount?.accountName}</strong>
              </p>
              {loadingDesigns ? (
                <div className="flex items-center justify-center py-10">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700" />
                  <span className="ml-3 text-sm text-slate-400">Loading designs…</span>
                </div>
              ) : designs.length === 0 ? (
                <div className="rounded border border-dashed border-slate-200 p-8 text-center">
                  <p className="text-slate-500">No designs found in this account.</p>
                </div>
              ) : (
                <div className="grid max-h-72 grid-cols-2 gap-3 overflow-y-auto pr-1">
                  {designs.map((design) => (
                    <button
                      key={design.id}
                      onClick={() => handleSelectDesign(design)}
                      className="group flex flex-col overflow-hidden border border-slate-200 text-left hover:border-sky-400 transition-colors"
                    >
                      {design.thumbnailUrl ? (
                        <img
                          src={design.thumbnailUrl}
                          alt={design.title}
                          className="h-28 w-full object-cover bg-slate-100"
                        />
                      ) : (
                        <div className="flex h-28 w-full items-center justify-center bg-slate-100 text-slate-400 text-xs">
                          No preview
                        </div>
                      )}
                      <div className="p-2">
                        <p className="truncate text-xs font-bold text-slate-800 group-hover:text-sky-700">
                          {design.title || "Untitled"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3 — Title input */}
          {step === 3 && (
            <div>
              <button
                onClick={() => setStep(2)}
                className="mb-4 text-xs font-bold text-sky-600 hover:underline"
              >
                ← Back
              </button>
              {selectedDesign?.thumbnailUrl && (
                <img
                  src={selectedDesign.thumbnailUrl}
                  alt={selectedDesign.title}
                  className="mb-4 h-32 w-full rounded border border-slate-200 object-cover bg-slate-100"
                />
              )}
              <label className="block text-xs font-bold uppercase tracking-[.15em] text-slate-500 mb-2">
                Resume Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Software Engineer Resume 2026"
                className="w-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none focus:border-sky-500"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
              <p className="mt-2 text-xs text-slate-400">
                Design: <strong>{selectedDesign?.title}</strong>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 3 && (
          <div className="border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:border-slate-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !title.trim()}
              className="bg-slate-900 px-6 py-2 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {submitting ? "Adding…" : "Add Resume"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
