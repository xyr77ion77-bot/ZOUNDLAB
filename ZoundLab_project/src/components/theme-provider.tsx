"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type ThemeId =
  | "light"
  | "dark"
  | "sepia"
  | "high-contrast"
  | "amber"
  | "slate";

interface ThemeCtx {
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeCtx | null>(null);

const STORAGE_KEY = "zoundlab-theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>("light");
  const [isDark, setIsDark] = useState(false);

  // Cargar tema persistido
  useEffect(() => {
    const saved = (typeof window !== "undefined"
      ? localStorage.getItem(STORAGE_KEY)
      : null) as ThemeId | null;
    if (saved && isValidTheme(saved)) {
      setThemeState(saved);
    } else if (typeof window !== "undefined") {
      // Material You fallback: usar prefers-color-scheme
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setThemeState(prefersDark ? "dark" : "light");
    }
  }, []);

  // Aplicar tema a <html>
  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    // Quitar todos los data-theme y dark class
    root.removeAttribute("data-theme");
    root.classList.remove("dark");
    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme !== "light") {
      root.setAttribute("data-theme", theme);
    }
    setIsDark(theme === "dark" || theme === "high-contrast");
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = useCallback((t: ThemeId) => {
    setThemeState(t);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

function isValidTheme(t: string): t is ThemeId {
  return ["light", "dark", "sepia", "high-contrast", "amber", "slate"].includes(t);
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
