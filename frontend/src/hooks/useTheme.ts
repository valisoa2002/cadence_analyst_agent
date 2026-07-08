import { useEffect, useState } from "react";

type Theme = "kadansaLight" | "kadansaDark";

const STORAGE_KEY = "kadansa-theme";

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (stored === "kadansaLight" || stored === "kadansaDark") return stored;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "kadansaDark" : "kadansaLight";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "kadansaLight" ? "kadansaDark" : "kadansaLight"));

  return { theme, toggle, isDark: theme === "kadansaDark" };
}
