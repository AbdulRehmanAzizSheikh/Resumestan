"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function ResumeCard({ resume, onUpdate }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const score = resume.analysis?.score || 0;
  const hasAnalysis = !!resume.analysis?.analyzedAt;

  const scoreColor =
    score >= 80
      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
      : score >= 60
      ? "text-amber-700 bg-amber-50 border-amber-200"
      : score > 0
      ? "text-rose-700 bg-rose-50 border-rose-200"
      : "text-slate-500 bg-slate-100 border-slate-200";

  const handleAnalyze = async () => {
    setAnalyzing(true);
    // Redirect to resume page immediately; analysis runs there
    router.push(`/resume/${resume._id}`);
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `Delete "${resume.title}"?\n\nThis will permanently delete the resume and all its analysis, recommendations, and guides.`
      )
    )
      return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/resumes/${resume._id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Resume deleted");
        if (onUpdate) onUpdate();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to delete resume");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      {/* Thumbnail */}
      {resume.thumbnailUrl ? (
        <div className="relative mb-4 h-28 w-full overflow-hidden rounded-lg border border-slate-100 bg-slate-100">
          <Image
            src={resume.thumbnailUrl}
            alt={resume.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
          />
        </div>
      ) : (
        <div className="mb-4 flex h-28 w-full items-center justify-center rounded-lg bg-slate-100 text-slate-400 text-xs">
          No preview
        </div>
      )}

      {/* Title + account */}
      <div className="mb-3 flex-1">
        <h2 className="text-base font-bold text-slate-900 line-clamp-2 leading-snug">
          {resume.title}
        </h2>
        <p className="mt-1 text-xs text-slate-400 truncate">
          Account: {resume.canvaAccountId}
        </p>
      </div>

      {/* Score badge */}
      <div className="mb-4">
        {hasAnalysis ? (
          <span
            className={`inline-block border px-2 py-0.5 text-xs font-black rounded ${scoreColor}`}
          >
            {score}/100
          </span>
        ) : (
          <span className="inline-block border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-400 rounded">
            Not analyzed
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="flex-1 bg-sky-600 px-3 py-2 text-xs font-bold text-white hover:bg-sky-500 transition-colors disabled:opacity-60"
        >
          {analyzing ? "Opening…" : "Analyze"}
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors disabled:opacity-50"
          title="Delete resume"
        >
          {deleting ? "…" : "Delete"}
        </button>
      </div>
    </div>
  );
}
