import Link from "next/link";

export default function StatCard({ label, value, accent, action }) {
  const palette = {
    sky: "bg-sky-50 text-sky-800 border-sky-200",
    emerald: "bg-emerald-50 text-emerald-800 border-emerald-200",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    violet: "bg-violet-50 text-violet-800 border-violet-200",
  };

  const content = (
    <div className={`rounded-xl border p-4 ${palette[accent] || palette.sky}`}>
      <p className="text-xs font-bold uppercase tracking-[0.2em]">{label}</p>
      <p className="mt-4 text-2xl font-black">{value}</p>
    </div>
  );

  if (action) {
    return <Link href={action}>{content}</Link>;
  }

  return content;
}
