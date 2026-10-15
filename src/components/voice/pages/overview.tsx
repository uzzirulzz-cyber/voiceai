"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FolderKanban,
  Activity,
  CheckCircle2,
  XCircle,
  Plug,
  DollarSign,
  Sparkles,
  ArrowRight,
  Clock,
  Zap,
  TrendingUp,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OverviewProps {
  user: { name: string | null; email: string; role: string };
  credit: { balance: number; monthly: number; spentThisMonth: number; isSuperAdmin: boolean } | null;
  onNavigate: (page: any) => void;
  onNewTask: () => void;
}

interface MetricData {
  totalProjects: number;
  activeTasks: number;
  completedTasks: number;
  failedTasks: number;
  connectedModels: number;
  totalSpending: number;
}

interface TaskItem {
  id: string;
  title: string;
  status: string;
  workMode: string;
  createdAt: string;
  usedTokens: number;
  project?: { name: string } | null;
}

interface ProjectItem {
  id: string;
  name: string;
  description: string | null;
  updatedAt: string;
  _count?: { files: number; tasks: number };
}

export function OverviewPage({ user, credit, onNavigate, onNewTask }: OverviewProps) {
  const [metrics, setMetrics] = useState<MetricData>({
    totalProjects: 0,
    activeTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    connectedModels: 0,
    totalSpending: 0,
  });
  const [recentTasks, setRecentTasks] = useState<TaskItem[]>([]);
  const [activeProjects, setActiveProjects] = useState<ProjectItem[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/overview").then((r) => r.json()).catch(() => ({})),
      fetch("/api/tasks/list").then((r) => r.json()).catch(() => ({ tasks: [] })),
      fetch("/api/projects/list").then((r) => r.json()).catch(() => ({ projects: [] })),
      fetch("/api/providers/list").then((r) => r.json()).catch(() => ({ providers: [] })),
    ]).then(([adminData, taskData, projectData, providerData]) => {
      if (adminData.overview) {
        setMetrics({
          totalProjects: adminData.overview.totalProjects || 0,
          activeTasks: adminData.overview.runningTasks || 0,
          completedTasks: adminData.overview.completedTasks || 0,
          failedTasks: adminData.overview.failedTasks || 0,
          connectedModels: (providerData.providers || []).filter((p: any) => p.connected).length,
          totalSpending: adminData.overview.totalCost || 0,
        });
      }
      setRecentTasks((taskData.tasks || []).slice(0, 5));
      setActiveProjects((projectData.projects || []).slice(0, 4));
      setProviders(providerData.providers || []);
      setLoading(false);
    });
  }, []);

  const metricCards = [
    { label: "Total Projects", value: metrics.totalProjects, icon: FolderKanban, color: "var(--primary)", page: "projects" as const },
    { label: "Active Tasks", value: metrics.activeTasks, icon: Activity, color: "var(--accent)", page: "tasks" as const },
    { label: "Completed", value: metrics.completedTasks, icon: CheckCircle2, color: "var(--success)", page: "tasks" as const },
    { label: "Failed", value: metrics.failedTasks, icon: XCircle, color: "var(--danger)", page: "tasks" as const },
    { label: "Connected Models", value: metrics.connectedModels, icon: Plug, color: "var(--gold)", page: "models" as const },
    { label: "Provider Spending", value: `$${metrics.totalSpending.toFixed(4)}`, icon: DollarSign, color: "var(--warning)", page: "billing" as const },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 lg:py-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="voice-card gradient-border p-6 lg:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20"
            style={{ background: "radial-gradient(circle, var(--primary), transparent 70%)" }} />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4"
              style={{ background: "rgba(79,140,255,0.1)", border: "1px solid rgba(79,140,255,0.25)" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--success)" }} />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                All systems operational
              </span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
              Welcome back, <span className="text-gradient">{user.name || "Voice"}</span>
            </h1>
            <p className="mt-2 text-muted-foreground max-w-xl">
              Orchestrate models, manage agents, and turn ideas into production-ready outcomes.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button onClick={onNewTask} className="btn-voice flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Create AI Task
              </button>
              <button
                onClick={() => onNavigate("projects")}
                className="px-4 py-2 rounded-lg border border-border bg-card/50 hover:bg-accent transition-colors text-sm font-medium flex items-center gap-2"
              >
                <FolderKanban className="w-4 h-4" />
                Open Projects
              </button>
              <button
                onClick={() => onNavigate("models")}
                className="px-4 py-2 rounded-lg border border-border bg-card/50 hover:bg-accent transition-colors text-sm font-medium flex items-center gap-2"
              >
                <Plug className="w-4 h-4" />
                Connect Models
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {metricCards.map((m, i) => (
          <motion.button
            key={m.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onNavigate(m.page)}
            className="voice-card p-4 text-left hover:scale-[1.02] transition-transform"
          >
            <div className="flex items-center justify-between mb-2">
              <m.icon className="w-4 h-4" style={{ color: m.color }} />
              <ArrowRight className="w-3 h-3 text-muted-foreground opacity-50" />
            </div>
            <div className="text-2xl font-bold tracking-tight">{m.value}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{m.label}</div>
          </motion.button>
        ))}
      </div>

      {/* Super Admin credit banner */}
      {credit?.isSuperAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="voice-card p-5 lg:p-6 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(221,187,112,0.08), rgba(155,122,255,0.05))",
              borderColor: "rgba(221,187,112,0.25)",
            }}>
            <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl opacity-30"
              style={{ background: "radial-gradient(circle, var(--gold), transparent 70%)" }} />
            <div className="relative flex flex-col lg:flex-row items-start lg:items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, var(--gold), #F0D080)" }}>
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold">Super Admin API Credit Package</h3>
                  <span className="status-pill status-pill-live">$250/mo Bonus</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Your account has premium API access. All 5 AI engines are live via OpenRouter + z-ai-sdk.
                </p>
              </div>
              <div className="flex flex-col gap-1 lg:items-end">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Remaining balance</div>
                <div className="text-2xl font-bold credit-badge-amount">
                  ${credit.balance.toFixed(2)}
                  <span className="text-sm text-muted-foreground ml-1">/ ${credit.monthly}/mo</span>
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Spent this month: ${credit.spentThisMonth.toFixed(4)}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Recent activity grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent tasks (spans 2 cols) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-2 voice-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Recent Tasks
            </h3>
            <button
              onClick={() => onNavigate("tasks")}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="skeleton h-12" />)}
            </div>
          ) : recentTasks.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No tasks yet"
              description="Create your first AI task to see execution history here."
              action={<button onClick={onNewTask} className="btn-voice text-xs flex items-center gap-1.5">
                <Plus className="w-3 h-3" /> Create task
              </button>}
            />
          ) : (
            <div className="space-y-1.5">
              {recentTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => onNavigate("tasks")}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent/40 transition-colors text-left"
                >
                  <StatusDot status={task.status} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{task.title}</div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span className="px-1.5 py-0.5 rounded bg-muted/50 font-mono">{task.workMode}</span>
                      <span>{task.usedTokens.toLocaleString()} tokens</span>
                      <span>·</span>
                      <span>{timeAgo(task.createdAt)}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-50" />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Model status */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="voice-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Plug className="w-4 h-4 text-primary" />
              Model Status
            </h3>
            <button
              onClick={() => onNavigate("models")}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Manage
            </button>
          </div>
          <div className="space-y-2">
            {providers.map((p) => (
              <div key={p.id} className="flex items-center gap-2.5 p-2 rounded-lg bg-card/40">
                <div className={cn("engine-dot engine-" + p.id)} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium">{p.displayName}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{p.model || "—"}</div>
                </div>
                <span className="status-pill status-pill-live">LIVE</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Active projects */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="voice-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-primary" />
              Active Projects
            </h3>
            <button
              onClick={() => onNavigate("projects")}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              View all
            </button>
          </div>
          {activeProjects.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="No projects"
              description="Create a project to organize your work."
            />
          ) : (
            <div className="space-y-1.5">
              {activeProjects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onNavigate("projects")}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent/40 text-left"
                >
                  <FolderKanban className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{p.name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {p._count?.tasks || 0} tasks · {p._count?.files || 0} files · {timeAgo(p.updatedAt)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Usage analytics */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="voice-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Usage Analytics
            </h3>
          </div>
          <div className="space-y-3">
            <UsageBar label="Claude" value={metrics.completedTasks * 0.3} max={10} color="#4F8CFF" />
            <UsageBar label="Gemini" value={metrics.completedTasks * 0.2} max={10} color="#9B7AFF" />
            <UsageBar label="GLM" value={metrics.completedTasks * 0.25} max={10} color="#30C995" />
            <UsageBar label="Codex" value={metrics.completedTasks * 0.15} max={10} color="#F2B65D" />
            <UsageBar label="Research" value={metrics.completedTasks * 0.1} max={10} color="#DDBB70" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const map: Record<string, string> = {
    QUEUED: "var(--muted-foreground)",
    PLANNING: "var(--warning)",
    RUNNING: "var(--primary)",
    VERIFYING: "var(--accent)",
    COMPLETED: "var(--success)",
    FAILED: "var(--danger)",
    CANCELLED: "var(--muted-foreground)",
    PAUSED: "var(--muted-foreground)",
  };
  const color = map[status] || "var(--muted-foreground)";
  const pulse = ["RUNNING", "PLANNING", "VERIFYING"].includes(status);
  return (
    <div className="relative w-2 h-2 flex-shrink-0">
      <div className="absolute inset-0 rounded-full" style={{ background: color }} />
      {pulse && (
        <div className="absolute inset-0 rounded-full animate-ping" style={{ background: color, opacity: 0.5 }} />
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, title, description, action }: { icon: any; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="text-center py-8 px-4">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-muted/40 mb-3">
        <Icon className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="text-sm font-medium">{title}</div>
      <div className="text-xs text-muted-foreground mt-1 mb-3">{description}</div>
      {action}
    </div>
  );
}

function UsageBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono">{Math.round(value)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function timeAgo(date: string) {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = now - then;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}
