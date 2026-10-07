"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sun, Moon, Laptop, ChevronDown } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";

export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center space-x-1.5 p-2 rounded-xl border transition-all duration-150 text-xs font-semibold
          bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border-color)] hover:bg-[var(--bg-surface-hover)] shadow-sm"
        title="Switch Color Theme"
      >
        {resolvedTheme === "dark" ? (
          <Moon className="w-4 h-4 text-blue-400" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500" />
        )}
        <span className="capitalize hidden sm:inline text-[11px] font-medium text-[var(--text-secondary)]">
          {theme}
        </span>
        <ChevronDown className="w-3 h-3 text-[var(--text-muted)] hidden sm:inline" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-36 glass-panel rounded-xl shadow-xl border border-[var(--border-color)] p-1.5 z-50 space-y-1 text-xs font-medium">
          <button
            onClick={() => {
              setTheme("light");
              setOpen(false);
            }}
            className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg transition text-left ${
              theme === "light"
                ? "bg-blue-600/15 text-blue-600 dark:text-blue-400 font-semibold"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
            }`}
          >
            <Sun className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Light</span>
          </button>

          <button
            onClick={() => {
              setTheme("dark");
              setOpen(false);
            }}
            className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg transition text-left ${
              theme === "dark"
                ? "bg-blue-600/15 text-blue-600 dark:text-blue-400 font-semibold"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
            }`}
          >
            <Moon className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Dark</span>
          </button>

          <button
            onClick={() => {
              setTheme("system");
              setOpen(false);
            }}
            className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg transition text-left ${
              theme === "system"
                ? "bg-blue-600/15 text-blue-600 dark:text-blue-400 font-semibold"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
            }`}
          >
            <Laptop className="w-4 h-4 text-slate-400 shrink-0" />
            <span>System</span>
          </button>
        </div>
      )}
    </div>
  );
}
