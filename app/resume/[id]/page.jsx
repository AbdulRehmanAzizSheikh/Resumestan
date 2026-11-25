"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";

function Section({ title, subtitle, children }) {
  return (
    <section className="border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-xl font-black text-slate-900">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function Badge({ children, color }) {
  const palettes = {
    high: "bg-rose-50 text-rose-700 border-rose-200",
    medium: "bg-amber-50 text-amber-700 border-amber-200",
    low: "bg-emerald-50 text-emerald-700 border-emerald-200",
    neutral: "bg-slate-50 text-slate-500 border-slate-200",
  };
  return (
    <span className={`rounded border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${palettes[color] || palettes.neutral}`}>
      {children}
    </span>
  );
}

export default function ResumeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedIssues, setSelectedIssues] = useState([]);
  const [recLoading, setRecLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);

  const [savedRecLoading, setSavedRecLoading] = useState(false);
  const [selectedSavedRecs, setSelectedSavedRecs] = useState([]);
  const [guideLoading, setGuideLoading] = useState(false);
  const [guide, setGuide] = useState(null);

  const [editGuideLoading, setEditGuideLoading] = useState(false);
  const [editGuide, setEditGuide] = useState(null);
  const [editGuideSaving, setEditGuideSaving] = useState(false);

  const [analyzing, setAnalyzing] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  const refreshResume = useCallback(async () => {
    try {
      const res = await fetch(`/api/resumes/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load resume");
      setResume(data.resume);
      return data.resume;
    } catch (err) {
      console.error("[resume page] fetch:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    (async () => {
      const data = await refreshResume();
      if (!data && typeof window !== "undefined") {
        // 401 = login chahiye
        const res = await fetch(`/api/resumes/${id}`).catch(() => null);
        if (res && res.status === 401) router.push("/login");
      }
    })();
  }, [id, refreshResume, router]);

  const analysis = resume?.analysis;
  const issues = analysis?.issues || [];
  const savedRecommendations = resume?.savedRecommendations || [];
  const savedGuides = resume?.savedGuides || [];

  const toggleIssue = (title) => {
    setSelectedIssues((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const toggleSavedRec = (recId) => {
    setSelectedSavedRecs((prev) =>
      prev.includes(recId) ? prev.filter((i) => i !== recId) : [...prev, recId]
    );
  };

  // ── Analysis ─────────────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch(`/api/resumes/${id}/analyze`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Analysis failed");
        return;
      }
      setResume(data.resume);
      toast.success("Resume analyzed!");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setAnalyzing(false);
    }
  };

  // ── Recommendations ──────────────────────────────────────────────────────
  const handleGetRecommendations = async () => {
    if (!selectedIssues.length) {
      toast.warning("Select at least one issue");
      return;
    }
    setRecLoading(true);
    try {
      const res = await fetch(`/api/resumes/${id}/recommendations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issues: issues.filter((i) => selectedIssues.includes(i.title)) }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to get recommendations");
        return;
      }
      setRecommendations(data.recommendations || []);
      toast.success(`${data.recommendations?.length || 0} recommendations fetched`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setRecLoading(false);
    }
  };

  const handleSaveRecommendations = async () => {
    if (!recommendations.length) {
      toast.warning("No recommendations to save yet");
      return;
    }
    setSavedRecLoading(true);
    try {
      const res = await fetch(`/api/resumes/${id}/recommendations/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendations }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to save recommendations");
        return;
      }
      toast.success(data.message || "Recommendations saved");
      setSelectedSavedRecs([]);
      await refreshResume();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSavedRecLoading(false);
    }
  };

  const handleDeleteRec = async (recId) => {
    try {
      const res = await fetch(`/api/resumes/${id}/recommendations/${recId}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        toast.success("Recommendation deleted");
        await refreshResume();
      } else {
        toast.error(data.message || "Failed to delete");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  // ── Guides (saved) ───────────────────────────────────────────────────────
  const handleGetGuide = async () => {
    const selected = savedRecommendations.filter((r) => selectedSavedRecs.includes(r._id));
    if (!selected.length) {
      toast.warning("Select at least one saved recommendation");
      return;
    }
    setGuideLoading(true);
    try {
      const res = await fetch(`/api/resumes/${id}/guide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendations: selected }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to generate guide");
        return;
      }
      setGuide(data.guide);
      toast.success("Guide generated");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setGuideLoading(false);
    }
  };

  const handleSaveGuide = async () => {
    if (!guide?.title) {
      toast.warning("Generate a guide first");
      return;
    }
    setSavedRecLoading(true);
    try {
      const res = await fetch(`/api/resumes/${id}/guide/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guide }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Guide saved");
        setGuide(null);
        await refreshResume();
      } else {
        toast.error(data.message || "Failed to save guide");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSavedRecLoading(false);
    }
  };

  const handleDeleteGuide = async (guideId) => {
    try {
      const res = await fetch(`/api/resumes/${id}/guide/${guideId}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        toast.success("Guide deleted");
        await refreshResume();
      } else {
        toast.error(data.message || "Failed to delete guide");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  // ── AI Edit Guide (Canva mein edit karein) ───────────────────────────────
  const handleGenerateEditGuide = async () => {
    setEditGuideLoading(true);
    setEditGuide(null);
    try {
      const res = await fetch(`/api/resumes/${id}/edit-guide`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to generate edit guide");
        return;
      }
      setEditGuide(data.guide || null);
      if (!data.guide) toast.info("AI aik default guide likh raha hai — kuch wazahat diye hain");
      else toast.success("Edit guide generated");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setEditGuideLoading(false);
    }
  };

  const handleSaveEditGuide = async () => {
    if (!editGuide?.title) {
      toast.warning("Generate the edit guide first");
      return;
    }
    setEditGuideSaving(true);
    try {
      const res = await fetch(`/api/resumes/${id}/guide/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guide: editGuide }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Edit guide saved to your guides");
        setEditGuide(null);
        await refreshResume();
      } else {
        toast.error(data.message || "Failed to save");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setEditGuideSaving(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  if (loading && !resume) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
          <p className="text-slate-500">Loading resume…</p>
        </div>
      </main>
    );
  }

  if (!resume) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <p className="mb-4 text-slate-500">{error || "Resume not found"}</p>
          <button onClick={() => router.push("/dashboard")} className="bg-slate-900 px-4 py-2 text-sm font-bold text-white">
            Back to dashboard
          </button>
        </div>
      </main>
    );
  }

  const editUrl = resume.canvaDesignId
    ? `https://www.canva.com/design/${resume.canvaDesignId}/edit`
    : resume.canvaLink;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-8">

        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-sky-700">Resume detail</p>
            <h1 className="mt-1 text-3xl font-black">{resume.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/dashboard")}
              className="border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 hover:border-sky-400"
            >
              ← Dashboard
            </button>
            <a
              href={editUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-900 px-5 py-2 text-sm font-bold text-white hover:bg-slate-700"
              title={editUrl ? "Canva mein edit karein" : "Canva link mojud nahi hai"}
            >
              Edit in Canva ↗
            </a>
            <button
              onClick={() => setPreviewKey((k) => k + 1)}
              className="border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 hover:border-sky-400"
              title="Preview refresh karein"
            >
              Reload Preview
            </button>
          </div>
        </div>

        {/* Canva preview */}
        <Section title="Canva Preview" subtitle="Canva se direct view">
          {resume.canvaLink || resume.canvaDesignId ? (
            <iframe
              key={previewKey}
              src={`${resume.canvaLink || `https://www.canva.com/design/${resume.canvaDesignId}`}?embed`}
              title={`${resume.title} preview`}
              className="w-full rounded-lg border border-slate-100 bg-slate-50 shadow-sm"
              style={{ height: "62vh", minHeight: 420 }}
              allowFullScreen
            />
          ) : (
            <p className="text-sm text-slate-500">Is resume ke liye koi Canva link save nahi hai.</p>
          )}
        </Section>

        {/* Analyze */}
        <Section
          title="AI Analysis"
          subtitle={analysis?.analyzedAt ? `Last analyzed ${new Date(analysis.analyzedAt).toLocaleDateString("en-IN")}` : "Abhi analyze nahi hua"}
        >
          <div className="mb-4">
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="bg-sky-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-sky-500 disabled:opacity-60"
            >
              {analyzing ? "Analyzing…" : "Analyze Resume"}
            </button>
            {analysis?.score > 0 && (
              <span className="ml-3 text-2xl font-black text-emerald-700">
                Score: {analysis.score}/100
              </span>
            )}
          </div>

          {analysis?.summary && (
            <div className="mb-4 rounded border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm leading-relaxed text-slate-700">{analysis.summary}</p>
            </div>
          )}

          {analysis?.goodAspects?.length > 0 && (
            <div className="mb-5">
              <h3 className="mb-2 text-sm font-black uppercase tracking-wide text-emerald-700">Strengths</h3>
              <ul className="space-y-1">
                {analysis.goodAspects.map((a, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-700">
                    <span className="mt-0.5 text-emerald-500">✓</span>
                    <span>
                      <strong>{a.title}</strong> — {a.detail}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {issues.length > 0 && (
            <>
              <h3 className="mb-2 text-sm font-black uppercase tracking-wide text-rose-700">Issues</h3>
              <div className="mb-4 space-y-2">
                {issues.map((issue) => {
                  const checked = selectedIssues.includes(issue.title);
                  return (
                    <label
                      key={issue.title}
                      className="flex cursor-pointer items-start gap-3 border border-slate-200 bg-white p-3 hover:border-sky-300"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleIssue(issue.title)}
                        className="mt-1 h-4 w-4"
                      />
                      <span className="flex-1">
                        <span className="block text-sm font-bold text-slate-800">{issue.title}</span>
                        <span className="block text-xs text-slate-500">{issue.detail}</span>
                        <span className="mt-1 inline-block"><Badge color={issue.severity}>{issue.severity}</Badge></span>
                      </span>
                    </label>
                  );
                })}
              </div>

              <button
                onClick={handleGetRecommendations}
                disabled={recLoading || !selectedIssues.length}
                className="bg-sky-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-sky-500 disabled:opacity-50"
              >
                {recLoading ? "Getting recommendations…" : "Get Recommendations"}
              </button>
            </>
          )}
        </Section>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <Section
            title="Recommendations"
            subtitle="Canva mein kya apply karna hai — yahan se save kar sakte hain"
          >
            <div className="space-y-3">
              {recommendations.map((rec, i) => (
                <div key={i} className="border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-800">{rec.issueTitle}</p>
                  {rec.before && <p className="mt-1 text-xs text-slate-400"><span className="font-semibold">Before:</span> {rec.before}</p>}
                  {rec.after && <p className="mt-1 text-xs text-slate-600"><span className="font-semibold">After:</span> {rec.after}</p>}
                  {rec.canvaSteps?.length > 0 && (
                    <ol className="mt-2 list-inside list-decimal text-xs text-slate-500">
                      {rec.canvaSteps.map((step, j) => <li key={j} className="mb-0.5">{step}</li>)}
                    </ol>
                  )}
                  {rec.whyItWorks && <p className="mt-1 text-xs italic text-slate-400">{rec.whyItWorks}</p>}
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSaveRecommendations}
                disabled={savedRecLoading}
                className="bg-slate-900 px-5 py-2 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {savedRecLoading ? "Saving…" : "Save Recommendations"}
              </button>
            </div>
          </Section>
        )}

        {/* Saved Recommendations -> Full Guide */}
        {savedRecommendations.length > 0 && (
          <Section title="Saved Recommendations" subtitle="Inhone save kiye hain — guide le sakte hain">
            <div className="space-y-2">
              {savedRecommendations.map((rec) => (
                <label key={rec._id} className="flex cursor-pointer items-center gap-3 border border-slate-200 bg-white p-3 hover:border-sky-300">
                  <input
                    type="checkbox"
                    checked={selectedSavedRecs.includes(rec._id)}
                    onChange={() => toggleSavedRec(rec._id)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-slate-700">{rec.issueTitle}</span>
                  <button
                    onClick={() => handleDeleteRec(rec._id)}
                    className="ml-auto text-xs font-bold text-rose-600 hover:underline"
                  >
                    Delete
                  </button>
                </label>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleGetGuide}
                disabled={guideLoading || !selectedSavedRecs.length}
                className="bg-sky-600 px-5 py-2 text-sm font-bold text-white hover:bg-sky-500 disabled:opacity-50"
              >
                {guideLoading ? "Generating Guide…" : "Get Full Guide"}
              </button>
            </div>
          </Section>
        )}

        {/* Guide */}
        {guide && (
          <Section title={guide.title || "Full Guide"} subtitle={guide.overview}>
            <ol className="space-y-3">
              {(guide.steps || []).map((step) => (
                <li key={step.stepNumber || step.title} className="border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-bold text-slate-800">{step.stepNumber || ""} {step.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{step.instruction}</p>
                  {step.tip && <p className="mt-1 text-xs italic text-slate-400">💡 {step.tip}</p>}
                </li>
              ))}
            </ol>
            <div className="mt-4 flex justify-end">
              <button onClick={handleSaveGuide} disabled={savedRecLoading} className="bg-slate-900 px-5 py-2 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50">
                {savedRecLoading ? "Saving…" : "Save Guide"}
              </button>
            </div>
          </Section>
        )}

        {/* AI Edit Guide (Canva mein edit karo) */}
        <Section title="AI Edit Guide — Canva mein Edit Karte Hue">
          <p className="mb-4 text-sm text-slate-500">
            Gemini AI se ek chota sa step-by-step guide le sakte hain ki Canva mein resume mein kya edit karein.
          </p>
          <div className="flex justify-end">
            <button
              onClick={handleGenerateEditGuide}
              disabled={editGuideLoading}
              className="bg-emerald-700 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-50"
            >
              {editGuideLoading ? "Generating…" : "Generate Edit Guide"}
            </button>
          </div>

          {editGuide && (
            <div className="mt-5 space-y-3">
              <p className="text-base font-black text-slate-800">{editGuide.title}</p>
              {editGuide.overview && <p className="text-sm text-slate-500">{editGuide.overview}</p>}
              <ol className="space-y-2">
                {(editGuide.steps || []).map((step) => (
                  <li key={step.stepNumber || step.title} className="border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm font-bold text-slate-800">{step.stepNumber || ""} {step.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{step.instruction}</p>
                    {step.tip && <p className="mt-1 text-xs italic text-slate-400">💡 {step.tip}</p>}
                  </li>
                ))}
              </ol>
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setEditGuide(null)} className="border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600">
                  Discard
                </button>
                <button onClick={handleSaveEditGuide} disabled={editGuideSaving} className="bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50">
                  {editGuideSaving ? "Saving…" : "Save Edit Guide"}
                </button>
              </div>
            </div>
          )}
        </Section>

        {/* Saved Guides */}
        {savedGuides.length > 0 && (
          <Section title="Saved Guides" subtitle="Apne save kiye guides">
            <div className="space-y-3">
              {savedGuides.map((g) => (
                <div key={g._id} className="rounded border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-800">{g.title}</p>
                    <button onClick={() => handleDeleteGuide(g._id)} className="text-xs font-bold text-rose-600 hover:underline">
                      Delete
                    </button>
                  </div>
                  {g.steps?.slice(0, 3).map((step) => (
                    <p key={step.stepNumber || step.title} className="text-xs text-slate-500">
                      {step.stepNumber || ""} {step.title}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </main>
  );
}
