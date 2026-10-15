"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Bell,
  Plus,
  Menu,
  PanelLeftOpen,
  Command,
  Sparkles,
  Sun,
  Moon,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings, THEME_OPTIONS } from "./settings-context";

interface TopBarProps {
  onMenuClick: () => void;
  onExpandSidebar: () => void;
  sidebarCollapsed: boolean;
  pageTitle: string;
  breadcrumb?: string[];
  onNewTask: () => void;
  connectedModels: number;
}

export function TopBar({
  onMenuClick,
  onExpandSidebar,
  sidebarCollapsed,
  pageTitle,
  breadcrumb = [],
  onNewTask,
  connectedModels,
}: TopBarProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const { settings, setTheme } = useSettings();
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch(true);
        setTimeout(() => searchRef.current?.focus(), 100);
      }
      if (e.key === "Escape") {
        setShowSearch(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-14 flex items-center gap-3 px-4 lg:px-6 border-b border-border bg-background/80 backdrop-blur-md">
      {/* Mobile menu */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Expand sidebar (desktop) */}
      {sidebarCollapsed && (
        <button
          onClick={onExpandSidebar}
          className="hidden lg:flex p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
          title="Expand sidebar"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <h1 className="text-base font-semibold tracking-tight truncate">{pageTitle}</h1>
        {breadcrumb.length > 0 && (
          <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground ml-2">
            {breadcrumb.map((b, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <span className="text-muted-foreground/40">/</span>
                <span>{b}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Search trigger */}
      <button
        onClick={() => {
          setShowSearch(true);
          setTimeout(() => searchRef.current?.focus(), 100);
        }}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card/50 text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors text-sm min-w-[200px]"
      >
        <Search className="w-4 h-4" />
        <span className="text-xs">Search…</span>
        <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-muted border border-border text-muted-foreground font-mono">
          ⌘K
        </kbd>
      </button>

      <button
        onClick={() => {
          setShowSearch(true);
          setTimeout(() => searchRef.current?.focus(), 100);
        }}
        className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
      >
        <Search className="w-4 h-4" />
      </button>

      {/* Models live indicator */}
      <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-md bg-card/50 border border-border">
        <span className="w-1.5 h-1.5 rounded-full status-pill-live::before" style={{ background: "var(--success)" }} />
        <span className="text-[11px] text-muted-foreground">{connectedModels} models live</span>
      </div>

      {/* Theme switcher */}
      <div className="relative">
        <button
          onClick={() => setShowTheme(!showTheme)}
          className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title="Switch theme"
        >
          {settings.theme === "arctic" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
        <AnimatePresence>
          {showTheme && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowTheme(false)} />
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute right-0 top-full mt-1 w-64 voice-card-elevated rounded-xl p-2 z-50"
              >
                <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Theme
                </div>
                {THEME_OPTIONS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTheme(t.id);
                      setShowTheme(false);
                    }}
                    className={cn(
                      "w-full flex items-start gap-3 p-2 rounded-lg hover:bg-accent transition-colors text-left",
                      settings.theme === t.id && "bg-accent/50"
                    )}
                  >
                    <div className="w-10 h-10 rounded-lg border border-border overflow-hidden flex-shrink-0 relative"
                      style={{ background: t.preview.bg }}>
                      <div className="absolute top-1 left-1 w-2 h-2 rounded-full" style={{ background: t.preview.accent }} />
                      <div className="absolute bottom-1 left-1 right-1 h-1 rounded" style={{ background: t.preview.fg, opacity: 0.6 }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium flex items-center gap-1.5">
                        {t.name}
                        {settings.theme === t.id && <Check className="w-3 h-3 text-primary" />}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{t.description}</div>
                    </div>
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => setShowNotifs(!showNotifs)}
          className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors relative"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: "var(--primary)" }} />
        </button>
        <AnimatePresence>
          {showNotifs && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute right-0 top-full mt-1 w-80 voice-card-elevated rounded-xl p-3 z-50"
              >
                <div className="text-xs font-semibold mb-2">Notifications</div>
                <div className="space-y-1.5">
                  <div className="p-2 rounded-md bg-card/50 text-xs">
                    <div className="font-medium">All 5 models live</div>
                    <div className="text-muted-foreground mt-0.5">Claude, Gemini, GLM, Codex, Research connected via OpenRouter</div>
                    <div className="text-[10px] text-muted-foreground mt-1">just now</div>
                  </div>
                  <div className="p-2 rounded-md bg-card/50 text-xs">
                    <div className="font-medium">$250/mo API credit active</div>
                    <div className="text-muted-foreground mt-0.5">Super Admin package — resets monthly</div>
                    <div className="text-[10px] text-muted-foreground mt-1">1m ago</div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* New Task */}
      <button
        onClick={onNewTask}
        className="btn-voice flex items-center gap-1.5 text-xs"
      >
        <Plus className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">New Task</span>
      </button>

      {/* Command palette search modal */}
      <AnimatePresence>
        {showSearch && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSearch(false)}
              className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center pt-[20vh] px-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -10 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-xl voice-card-elevated rounded-2xl overflow-hidden"
              >
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <input
                    ref={searchRef}
                    placeholder="Search tasks, projects, settings…"
                    className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                  />
                  <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-muted border border-border text-muted-foreground font-mono">
                    ESC
                  </kbd>
                </div>
                <div className="p-2 max-h-80 overflow-y-auto">
                  <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Quick Actions
                  </div>
                  <button className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent text-sm text-left">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span>Create new AI task</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent text-sm text-left">
                    <Plus className="w-4 h-4 text-muted-foreground" />
                    <span>New project</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent text-sm text-left">
                    <Command className="w-4 h-4 text-muted-foreground" />
                    <span>Open command palette</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
