"use client";

import { useEffect, useState } from "react";
import { THEMES, DEFAULT_THEME, THEME_STORAGE_KEY } from "@/lib/themes";

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setTheme(document.documentElement.getAttribute("data-theme") || DEFAULT_THEME);
  }, []);

  const applyTheme = (id) => {
    document.documentElement.setAttribute("data-theme", id);
    try {
      document.cookie = `${THEME_STORAGE_KEY}=${id}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // ignore
    }
    setTheme(id);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        title="Theme change karein (area / regional styles)"
        className="flex items-center gap-1.5 rounded border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:border-slate-400"
      >
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "var(--app-accent)" }} />
        {theme}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-44 border border-slate-200 bg-white shadow-lg">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => applyTheme(t.id)}
              className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-slate-50 ${
                theme === t.id ? "font-black" : ""
              }`}
            >
              <span className={theme === t.id ? "font-black text-sky-700" : "text-slate-700"}>{t.name}</span>
              <span className="text-[10px] text-slate-400">{theme === t.id ? "✓" : ""}</span>
            </button>
          ))}
          <p className="px-3 py-2 text-[10px] text-slate-400">{THEMES.find(t => t.id === theme)?.description}</p>
        </div>
      )}
    </div>
  );
}
