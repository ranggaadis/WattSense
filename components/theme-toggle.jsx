"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ThemeToggle({ compact = false }) {
  const [theme, setTheme] = useState("light");

  const applyTheme = (value) => {
    document.documentElement.classList.toggle("dark", value === "dark");
  };

  useEffect(() => {
    let initial = "light";
    try {
      initial =
        localStorage.getItem("theme") ||
        (document.documentElement.classList.contains("dark") ? "dark" : "light");
    } catch {}
    setTheme(initial);
    applyTheme(initial);

    const onThemeChange = (e) => {
      const value = e.detail;
      setTheme(value);
      applyTheme(value);
    };
    window.addEventListener("theme-change", onThemeChange);
    return () => window.removeEventListener("theme-change", onThemeChange);
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem("theme", next);
    } catch {}
    applyTheme(next);
    window.dispatchEvent(new CustomEvent("theme-change", { detail: next }));
  };

  if (compact) {
    return (
      <Button variant="outline" size="icon" className="rounded-full dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-800" onClick={toggle} aria-label="Toggle theme">
        {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>
    );
  }

  return (
    <button
      onClick={toggle}
      className="w-full flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 border dark:border-slate-800"
    >
      <span className="text-gray-700 dark:text-slate-200">Dark Mode</span>
      <span className="inline-flex h-6 w-11 items-center rounded-full bg-gray-300 dark:bg-violet-500 p-1">
        <span
          className={`h-4 w-4 rounded-full bg-white transition-transform ${theme === "dark" ? "translate-x-5" : "translate-x-0"}`}
        />
      </span>
    </button>
  );
}
