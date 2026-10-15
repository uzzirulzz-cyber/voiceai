"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";

import { SettingsProvider } from "@/components/voice/settings-context";
import { Sidebar, type PageKey } from "@/components/voice/sidebar";
import { TopBar } from "@/components/voice/top-bar";
import { OverviewPage } from "@/components/voice/pages/overview";
import { WorkspacePage } from "@/components/voice/pages/workspace";
import { ModelsPage } from "@/components/voice/pages/models";
import { ProjectsPage } from "@/components/voice/pages/projects";
import { TasksPage } from "@/components/voice/pages/tasks";
import { ArtifactsPage } from "@/components/voice/pages/artifacts";
import { AgentsPage } from "@/components/voice/pages/agents";
import { BillingPage } from "@/components/voice/pages/billing";
import { AnalyticsPage } from "@/components/voice/pages/analytics";
import { SettingsPage } from "@/components/voice/pages/settings";
import { AuthScreen } from "@/components/voice/auth-screen";
import { LandingHero } from "@/components/voice/landing-hero";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: "SUPER_ADMIN" | "ADMIN" | "USER";
  status: string;
  creditBalanceUsd?: number;
  creditMonthlyUsd?: number;
}

interface Credit {
  balance: number;
  monthly: number;
  spentThisMonth: number;
  isSuperAdmin: boolean;
}

const PAGE_TITLES: Record<PageKey, string> = {
  overview: "Overview",
  workspace: "AI Workspace",
  projects: "Projects",
  agents: "Agent Studio",
  tasks: "Task History",
  artifacts: "Artifacts",
  models: "Model Connections",
  billing: "Usage & Billing",
  analytics: "Analytics",
  settings: "Settings",
};

export default function Home() {
  return (
    <SettingsProvider>
      <App />
    </SettingsProvider>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authView, setAuthView] = useState(false);
  const [page, setPage] = useState<PageKey>("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [credit, setCredit] = useState<Credit | null>(null);
  const [connectedModels, setConnectedModels] = useState(5);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setAuthView(false);
        fetchCredits();
        fetchProviders();
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCredits = useCallback(async () => {
    try {
      const res = await fetch("/api/credits");
      const data = await res.json();
      if (data.credit) setCredit(data.credit);
    } catch {}
  }, []);

  const fetchProviders = useCallback(async () => {
    try {
      const res = await fetch("/api/providers/list");
      const data = await res.json();
      const live = (data.providers || []).filter((p: any) => p.connected).length;
      setConnectedModels(live);
    } catch {}
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Refresh credit when page changes
  useEffect(() => {
    if (user) fetchCredits();
  }, [page, user, fetchCredits]);

  const handleAuthSuccess = (u: User) => {
    setUser(u);
    setAuthView(false);
    setPage("overview");
    fetchCredits();
    fetchProviders();
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setCredit(null);
  };

  const handleNavigate = (target: PageKey) => {
    setPage(target);
  };

  const handleNewTask = () => {
    setPage("workspace");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <Sparkles className="w-10 h-10" style={{ color: "var(--primary)" }} />
            <motion.div
              className="absolute inset-0 blur-xl"
              style={{ background: "radial-gradient(circle, var(--primary) 0%, transparent 70%)" }}
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="text-xs">Initializing Voice AI…</span>
          </div>
        </motion.div>
      </div>
    );
  }

  // Landing page (when logged out)
  if (!user && !authView) {
    return (
      <LandingHero
        onGetStarted={() => setAuthView(true)}
        onSignIn={() => setAuthView(true)}
      />
    );
  }

  // Auth screen
  if (!user && authView) {
    return <AuthScreen onSuccess={handleAuthSuccess} onBack={() => setAuthView(false)} />;
  }

  // Main app shell
  return (
    <div className="min-h-screen flex">
      <Sidebar
        current={page}
        onNavigate={handleNavigate}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        user={user}
        onLogout={handleLogout}
        credit={credit}
        connectedModels={connectedModels}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          onMenuClick={() => setMobileNavOpen(true)}
          onExpandSidebar={() => setSidebarCollapsed(false)}
          sidebarCollapsed={sidebarCollapsed}
          pageTitle={PAGE_TITLES[page]}
          onNewTask={handleNewTask}
          connectedModels={connectedModels}
        />

        <main className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {page === "overview" && (
                <OverviewPage user={user} credit={credit} onNavigate={handleNavigate} onNewTask={handleNewTask} />
              )}
              {page === "workspace" && (
                <WorkspacePage user={user} onTaskCreated={() => fetchCredits()} />
              )}
              {page === "projects" && <ProjectsPage />}
              {page === "agents" && <AgentsPage />}
              {page === "tasks" && <TasksPage />}
              {page === "artifacts" && <ArtifactsPage />}
              {page === "models" && <ModelsPage />}
              {page === "billing" && <BillingPage user={user} />}
              {page === "analytics" && <AnalyticsPage />}
              {page === "settings" && <SettingsPage />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
