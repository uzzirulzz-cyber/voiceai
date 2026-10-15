"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type ThemeName = "midnight" | "arctic" | "indigo";
type LayoutDensity = "comfortable" | "compact";

interface Settings {
  theme: ThemeName;
  density: LayoutDensity;
  defaultWorkMode: "FAST" | "BALANCED" | "DEEP" | "CODING" | "RESEARCH";
  notifications: boolean;
}

interface SettingsContextValue {
  settings: Settings;
  setTheme: (t: ThemeName) => void;
  setDensity: (d: LayoutDensity) => void;
  setDefaultWorkMode: (m: Settings["defaultWorkMode"]) => void;
  setNotifications: (n: boolean) => void;
}

const DEFAULTS: Settings = {
  theme: "midnight",
  density: "comfortable",
  defaultWorkMode: "BALANCED",
  notifications: true,
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

const STORAGE_KEY = "voice-settings";

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(null);

  // Load from localStorage synchronously on first render (avoid effect cascade)
  if (settings === null && typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setSettings({ ...DEFAULTS, ...JSON.parse(raw) });
      } else {
        setSettings(DEFAULTS);
      }
    } catch {
      setSettings(DEFAULTS);
    }
  }

  // Apply theme to document
  useEffect(() => {
    if (settings) {
      document.documentElement.setAttribute("data-theme", settings.theme);
      document.documentElement.setAttribute("data-density", settings.density);
    }
  }, [settings?.theme, settings?.density]);

  // Persist
  useEffect(() => {
    if (settings) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch {}
    }
  }, [settings]);

  // Fall back to defaults if still null during SSR
  const currentSettings = settings || DEFAULTS;

  const value: SettingsContextValue = {
    settings: currentSettings,
    setTheme: (theme) => setSettings((s) => ({ ...(s || DEFAULTS), theme })),
    setDensity: (density) => setSettings((s) => ({ ...(s || DEFAULTS), density })),
    setDefaultWorkMode: (defaultWorkMode) => setSettings((s) => ({ ...(s || DEFAULTS), defaultWorkMode })),
    setNotifications: (notifications) => setSettings((s) => ({ ...(s || DEFAULTS), notifications })),
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}

export const THEME_OPTIONS: Array<{ id: ThemeName; name: string; description: string; preview: { bg: string; fg: string; accent: string } }> = [
  {
    id: "midnight",
    name: "Midnight Intelligence",
    description: "Deep navy with electric blue accents — the default premium experience",
    preview: { bg: "#080F1E", fg: "#F4F7FF", accent: "#4F8CFF" },
  },
  {
    id: "arctic",
    name: "Arctic Silver",
    description: "Bright, minimal, maximum readability — ideal for daylight work",
    preview: { bg: "#F5F7FA", fg: "#0E1726", accent: "#2563EB" },
  },
  {
    id: "indigo",
    name: "Royal Indigo",
    description: "Deep purple with pink accents — bold, creative, distinctive",
    preview: { bg: "#0F0820", fg: "#F0EAFF", accent: "#A78BFA" },
  },
];
