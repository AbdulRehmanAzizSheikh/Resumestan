"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";

// ── Single connected account row ─────────────────────────────────────────────
function AccountRow({ account, onDisconnect }) {
  const [disconnecting, setDisconnecting] = useState(false);

  const handleDisconnect = async () => {
    if (!confirm(`Disconnect "${account.accountName}"?`)) return;
    setDisconnecting(true);
    try {
      const res = await fetch(`/api/canva/accounts/${account.canvaUserId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success(`"${account.accountName}" disconnected`);
        onDisconnect(account.canvaUserId);
      } else {
        const data = await res.json();
        toast.error(data.message || "Could not disconnect account");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDisconnecting(false);
    }
  };

  const connectedDate = account.connectedAt
    ? new Date(account.connectedAt).toLocaleDateString()
    : "—";

  return (
    <div className="flex items-center justify-between gap-3 border border-slate-200 bg-white px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-slate-800">
          {account.accountName}
        </p>
        <p className="text-xs text-slate-400">Connected {connectedDate}</p>
      </div>
      <button
        onClick={handleDisconnect}
        disabled={disconnecting}
        className="shrink-0 border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
      >
        {disconnecting ? "…" : "Disconnect"}
      </button>
    </div>
  );
}

// ── Main section ─────────────────────────────────────────────────────────────
export default function CanvaAccountsSection() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/canva/accounts");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
      }
    } catch (err) {
      console.error("[CanvaAccountsSection]", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Defer so setState calls land outside the synchronous effect body
    const timer = setTimeout(() => {
      void fetchAccounts();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleDisconnect = (canvaUserId) => {
    setAccounts((prev) => prev.filter((a) => a.canvaUserId !== canvaUserId));
  };

  return (
    <div className="border border-slate-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-sky-700">
            Canva accounts
          </p>
          <h2 className="mt-1 text-xl font-black">Connected accounts</h2>
        </div>
        <a
          href="/api/auth/canva"
          className="shrink-0 bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700"
        >
          + Connect Canva
        </a>
      </div>

      {/* Account list */}
      {loading ? (
        <p className="py-4 text-sm text-slate-400">Loading accounts…</p>
      ) : accounts.length === 0 ? (
        <div className="border border-dashed border-slate-200 px-4 py-6 text-center">
          <p className="text-sm text-slate-500">No Canva accounts connected yet.</p>
          <p className="mt-1 text-xs text-slate-400">
            Connect a Canva account to browse and import your resume designs.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {accounts.map((account) => (
            <AccountRow
              key={account.canvaUserId}
              account={account}
              onDisconnect={handleDisconnect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
