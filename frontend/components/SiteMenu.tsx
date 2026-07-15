"use client";

import { useState } from "react";
import { useTheme } from "@/lib/theme";

export function SiteMenu() {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-sm px-1.5 py-1 border border-line rounded-md"
        aria-label="Menu"
      >
        ⚙
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-paper border border-line rounded-lg shadow-lg z-50 p-3">
          <p className="text-xs font-mono uppercase tracking-widest text-ink-light mb-2">Theme</p>
          <div className="flex gap-2">
            <button
              onClick={() => setTheme("light")}
              className={`flex-1 text-xs font-mono uppercase tracking-widest px-2 py-1.5 rounded-md border ${
                theme === "light" ? "border-terracotta text-terracotta" : "border-line text-ink-light"
              }`}
            >
              Light
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`flex-1 text-xs font-mono uppercase tracking-widest px-2 py-1.5 rounded-md border ${
                theme === "dark" ? "border-terracotta text-terracotta" : "border-line text-ink-light"
              }`}
            >
              Dark
            </button>
          </div>
        </div>
      )}
    </div>
  );
}