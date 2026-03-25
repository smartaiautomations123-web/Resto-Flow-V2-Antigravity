import React, { createContext, useContext, useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme?: () => void;
  switchable: boolean;
  systemSettings?: any;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (switchable) {
      const stored = localStorage.getItem("theme");
      return (stored as Theme) || defaultTheme;
    }
    return defaultTheme;
  });

  const { data: systemSettings } = trpc.settings.getSystemSettings.useQuery();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    if (switchable) {
      localStorage.setItem("theme", theme);
    }
  }, [theme, switchable]);

  // Apply dynamic branding
  useEffect(() => {
    if (!systemSettings) return;

    const root = document.documentElement;
    
    if (systemSettings.primaryColor) {
      root.style.setProperty("--primary", systemSettings.primaryColor);
      root.style.setProperty("--ring", systemSettings.primaryColor);
    }

    if (systemSettings.borderRadius) {
      root.style.setProperty("--radius", systemSettings.borderRadius);
    }

    if (systemSettings.fontFamily) {
      // Apply to body and set as a variable if needed
      document.body.style.fontFamily = `'${systemSettings.fontFamily}', sans-serif`;
    }
  }, [systemSettings]);

  const toggleTheme = switchable
    ? () => {
        setTheme(prev => (prev === "light" ? "dark" : "light"));
      }
    : undefined;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, switchable, systemSettings }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
