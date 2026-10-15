"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Sparkles,
  FolderKanban,
  Bot,
  History,
  FileCode2,
  Plug,
  CreditCard,
  BarChart3,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Search,
  Bell,
  Plus,
  Sun,
  Moon,
  Check,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings, THEME_OPTIONS } from "./settings-context";

export type PageKey =
  | "overview"
  | "workspace"
  | "projects"
  | "agents"
  | "tasks"
  | "artifacts"
  | "models"
  | "billing"
  | "analytics"
  | "settings";

interface SidebarProps {
  current: PageKey;
  onNavigate: (page: PageKey) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  user: { name: string | null; email: string; role: string };
  onLogout: () => void;
  credit: { balance: number; monthly: number; isSuperAdmin: boolean } | null;
  connectedModels: number;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const NAV_ITEMS: Array<{ key: PageKey; label: string; icon: any; group: string }> = [
  { key: "overview", label: "Overview", icon: LayoutDashboard, group: "Main" },
  { key: "workspace", label: "AI Workspace", icon: Sparkles, group: "Main" },
  { key: "projects", label: "Projects", icon: FolderKanban, group: "Work" },
  { key: "agents", label: "Agent Studio", icon: Bot, group: "Work" },
  { key: "tasks", label: "Task History", icon: History, group: "Work" },
  { key: "artifacts", label: "Artifacts", icon: FileCode2, group: "Work" },
  { key: "models", label: "Model Connections", icon: Plug, group: "System" },
  { key: "billing", label: "Usage & Billing", icon: CreditCard, group: "System" },
  { key: "analytics", label: "Analytics", icon: BarChart3, group: "System" },
  { key: "settings", label: "Settings", icon: Settings, group: "System" },
];

export function Sidebar({
  current,
  onNavigate,
  collapsed,
  onToggleCollapse,
  user,
  onLogout,
  credit,
  connectedModels,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { settings, setTheme } = useSettings();

  // Group items
  const groups = Array.from(new Set(NAV_ITEMS.map((n) => n.group)));

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn("flex items-center gap-3 px-4 h-16 border-b border-sidebar-border flex-shrink-0")}>
        <div className="relative flex-shrink-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, var(--primary), var(--accent))",
              boxShadow: "0 4px 12px rgba(79,140,255,0.4)"
            }}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold tracking-tight">Voice AI</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Enterprise Workspace</div>
          </div>
        )}
        {!collapsed && (
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {groups.map((group) => (
          <div key={group} className="mb-4">
            {!collapsed && (
              <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                {group}
              </div>
            )}
            <div className="space-y-0.5">
              {NAV_ITEMS.filter((n) => n.group === group).map((item) => {
                const Icon = item.icon;
                const active = current === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      onNavigate(item.key);
                      onMobileClose();
                    }}
                    className={cn("nav-item w-full text-left", collapsed && "justify-center px-0")}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className={cn("w-4 h-4 flex-shrink-0", active && "text-primary")} />
                    {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                    {!collapsed && active && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Connected models badge */}
      {!collapsed && (
        <div className="px-3 py-2 border-t border-sidebar-border">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-sidebar-accent/50">
            <div className="w-2 h-2 rounded-full bg-success status-pill-live::before" style={{ background: "var(--success)" }} />
            <span className="text-[11px] text-muted-foreground">{connectedModels} models live</span>
          </div>
        </div>
      )}

      {/* Super Admin credit badge */}
      {!collapsed && credit?.isSuperAdmin && (
        <div className="px-3 py-2">
          <div className="credit-badge">
            <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, var(--gold), #F0D080)" }}>
              <CreditCard className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground">API Credit</div>
              <div className="text-sm font-bold credit-badge-amount">
                ${credit.balance.toFixed(2)} <span className="text-[10px] opacity-70">/ ${credit.monthly}/mo</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Panel link (only for admins) */}
      {(user.role === "SUPER_ADMIN" || user.role === "ADMIN") && (
        <div className="px-2 pb-2">
          <a
            href="/admin"
            className={cn("nav-item", collapsed && "justify-center px-0")}
            style={{
              background: "linear-gradient(90deg, rgba(221,187,112,0.12), transparent)",
              borderColor: "rgba(221,187,112,0.2)",
            }}
            title={collapsed ? "Admin Panel" : undefined}
          >
            <Shield className="w-4 h-4 flex-shrink-0" style={{ color: "var(--gold)" }} />
            {!collapsed && (
              <>
                <span className="flex-1">Admin Panel</span>
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
              </>
            )}
          </a>
        </div>
      )}

      {/* User menu */}
      <div className="relative border-t border-sidebar-border p-2">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className={cn("w-full flex items-center gap-2 p-2 rounded-lg hover:bg-sidebar-accent transition-colors", collapsed && "justify-center")}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
            style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}>
            {(user.name || user.email)[0].toUpperCase()}
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 text-left min-w-0">
                <div className="text-xs font-medium truncate">{user.name || user.email}</div>
                <div className="text-[10px] text-muted-foreground">{user.role}</div>
              </div>
              <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground" />
            </>
          )}
        </button>

        <AnimatePresence>
          {showUserMenu && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="absolute bottom-full left-2 right-2 mb-2 voice-card-elevated rounded-lg p-1 z-50"
            >
              <button
                onClick={() => {
                  setShowThemeMenu(!showThemeMenu);
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent text-xs"
              >
                <Sun className="w-3.5 h-3.5" />
                <span className="flex-1 text-left">Theme</span>
                <ChevronRight className="w-3 h-3" />
              </button>
              <AnimatePresence>
                {showThemeMenu && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    {THEME_OPTIONS.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setTheme(t.id);
                          setShowThemeMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent text-xs"
                      >
                        <div className="w-4 h-4 rounded border border-border"
                          style={{ background: t.preview.bg }}>
                          <div className="w-1 h-1 rounded-full m-0.5" style={{ background: t.preview.accent }} />
                        </div>
                        <span className="flex-1 text-left truncate">{t.name}</span>
                        {settings.theme === t.id && <Check className="w-3 h-3 text-primary" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="my-1 h-px bg-border" />
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent text-xs text-destructive"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign out</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-shrink-0 flex-col bg-sidebar border-r border-sidebar-border transition-all duration-200",
          collapsed ? "w-16" : "w-60"
        )}
        style={{ position: "sticky", top: 0, height: "100vh" }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              className="lg:hidden fixed inset-0 bg-black/60 z-40"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed inset-y-0 left-0 w-72 bg-sidebar border-r border-sidebar-border z-50"
            >
              <button
                onClick={onMobileClose}
                className="absolute top-4 right-4 p-1 rounded-md text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
