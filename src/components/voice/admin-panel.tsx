"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Users,
  Cpu,
  ScrollText,
  Activity,
  Shield,
  ArrowLeft,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  Sparkles,
  Brain,
  Code2,
  Globe,
  Layers,
  RefreshCw,
  Ban,
  Wallet,
  Zap,
  Gift,
} from "lucide-react";
import { VoiceWordmark } from "./logo";
import { PROVIDERS } from "@/lib/types";
import { toast } from "sonner";

interface AdminPanelProps {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: "SUPER_ADMIN" | "ADMIN" | "USER";
  };
  onLogout: () => void;
  onNavigate: (target: "workspace" | "admin" | "landing" | "auth") => void;
}

export function AdminPanel({ user, onLogout, onNavigate }: AdminPanelProps) {
  const [tab, setTab] = useState("overview");
  const [overview, setOverview] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [budget, setBudget] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/overview");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setOverview(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchBudget = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/budget");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setBudget(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/tasks");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/audit");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
    fetchUsers();
    fetchTasks();
    fetchLogs();
    fetchBudget();
  }, [fetchOverview, fetchUsers, fetchTasks, fetchLogs, fetchBudget]);

  const handleUpdateUser = async (userId: string, updates: { role?: string; status?: string }) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...updates }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }
      toast.success("User updated");
      fetchUsers();
      fetchLogs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const handleTaskAction = async (taskId: string, action: "cancel" | "retry") => {
    try {
      const res = await fetch("/api/admin/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, action }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(`Task ${action === "cancel" ? "cancelled" : "retried"}`);
      fetchTasks();
    } catch (err) {
      toast.error("Failed");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 h-14 border-b border-border/40 bg-background/60 backdrop-blur-md flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => onNavigate("workspace")}>
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to workspace
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <VoiceWordmark size={32} />
          <Badge variant="outline" className="text-[10px]">
            <Shield className="w-3 h-3 mr-1" style={{ color: "var(--voice-violet)" }} />
            Admin
          </Badge>
          <Button variant="ghost" size="sm" onClick={onLogout}>
            Sign out
          </Button>
        </div>
      </header>

      <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Admin Panel</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage users, monitor providers, inspect tasks, and review audit logs.
          </p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview" className="gap-1.5">
              <LayoutDashboard className="w-3.5 h-3.5" /> Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1.5">
              <Users className="w-3.5 h-3.5" /> Users
            </TabsTrigger>
            <TabsTrigger value="providers" className="gap-1.5">
              <Cpu className="w-3.5 h-3.5" /> Providers
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-1.5">
              <Activity className="w-3.5 h-3.5" /> Tasks
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-1.5">
              <ScrollText className="w-3.5 h-3.5" /> Audit
            </TabsTrigger>
            <TabsTrigger value="budget" className="gap-1.5">
              <Wallet className="w-3.5 h-3.5" /> Budget
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview">
            <div className="space-y-4">
              {overview?.overview && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard
                      label="Total Users"
                      value={overview.overview.totalUsers}
                      sub={`${overview.overview.activeUsers} active`}
                      icon={Users}
                      color="var(--voice-blue)"
                    />
                    <StatCard
                      label="Total Tasks"
                      value={overview.overview.totalTasks}
                      sub={`${overview.overview.runningTasks} running`}
                      icon={Activity}
                      color="var(--voice-violet)"
                    />
                    <StatCard
                      label="Completion Rate"
                      value={`${overview.overview.completionRate.toFixed(1)}%`}
                      sub={`${overview.overview.completedTasks} completed`}
                      icon={CheckCircle2}
                      color="oklch(0.7 0.18 150)"
                    />
                    <StatCard
                      label="Total Cost"
                      value={`$${overview.overview.totalCost.toFixed(4)}`}
                      sub={`${overview.overview.totalInputTokens + overview.overview.totalOutputTokens} tokens`}
                      icon={TrendingUp}
                      color="oklch(0.75 0.18 50)"
                    />
                  </div>

                  {/* Tasks by status */}
                  <Card className="glass-panel">
                    <CardHeader>
                      <CardTitle className="text-sm">Tasks by Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                        {Object.entries(overview.tasksByStatus || {}).map(([status, count]: [string, any]) => (
                          <div key={status} className="text-center">
                            <div className="text-2xl font-semibold">{count}</div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                              {status}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Provider usage */}
                  {overview.usageByProvider && (
                    <Card className="glass-panel">
                      <CardHeader>
                        <CardTitle className="text-sm">Provider Usage</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {Object.entries(overview.usageByProvider).map(([provider, data]: [string, any]) => {
                            const p = PROVIDERS[provider as keyof typeof PROVIDERS];
                            if (!p) return null;
                            return (
                              <div key={provider} className="flex items-center gap-3">
                                <div
                                  className="w-8 h-8 rounded-md flex items-center justify-center"
                                  style={{ background: `${p.color}25`, color: p.color }}
                                >
                                  <ProviderIcon provider={provider as keyof typeof PROVIDERS} />
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-medium">{p.displayName}</div>
                                  <div className="text-[10px] text-muted-foreground">
                                    {data._count} calls · {data._sum.inputTokens + data._sum.outputTokens} tokens
                                  </div>
                                </div>
                                <div className="text-sm font-mono">${data._sum.cost.toFixed(4)}</div>
                              </div>
                            );
                          })}
                          {Object.keys(overview.usageByProvider).length === 0 && (
                            <div className="text-sm text-muted-foreground text-center py-4">
                              No usage records yet. Run a task to see provider statistics.
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          {/* USERS */}
          <TabsContent value="users">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Users ({users.length})</span>
                  <Button variant="ghost" size="sm" onClick={fetchUsers}>
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[60vh]">
                  <div className="space-y-1">
                    {users.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/30"
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarFallback
                            className="text-xs"
                            style={{ background: "var(--voice-blue)", color: "white" }}
                          >
                            {(u.name || u.email)[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{u.name || u.email}</div>
                          <div className="text-[10px] text-muted-foreground">{u.email}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">
                            {u.role}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-[10px]"
                            style={{
                              color: u.status === "ACTIVE" ? "oklch(0.7 0.18 150)" : "oklch(0.65 0.22 25)",
                              borderColor: u.status === "ACTIVE" ? "oklch(0.7 0.18 150 / 40%)" : "oklch(0.65 0.22 25 / 40%)",
                            }}
                          >
                            {u.status}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {u._count?.tasks || 0} tasks
                          </span>

                          {user.role === "SUPER_ADMIN" && u.id !== user.id && (
                            <div className="flex items-center gap-1">
                              {u.status === "ACTIVE" ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => handleUpdateUser(u.id, { status: "SUSPENDED" })}
                                >
                                  <Ban className="w-3 h-3" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => handleUpdateUser(u.id, { status: "ACTIVE" })}
                                >
                                  Activate
                                </Button>
                              )}
                              <select
                                className="h-7 text-xs bg-input/50 rounded-md px-1.5"
                                value={u.role}
                                onChange={(e) => handleUpdateUser(u.id, { role: e.target.value })}
                              >
                                <option value="USER">USER</option>
                                <option value="ADMIN">ADMIN</option>
                                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {users.length === 0 && (
                      <div className="text-center py-8 text-sm text-muted-foreground">
                        No users registered yet
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PROVIDERS */}
          <TabsContent value="providers">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.values(PROVIDERS).map((p) => (
                <Card key={p.id} className="glass-panel">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ background: `${p.color}25`, color: p.color }}
                      >
                        <ProviderIcon provider={p.id} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{p.displayName}</h3>
                          <Badge
                            variant="outline"
                            className="text-[10px]"
                            style={{
                              color: "oklch(0.7 0.18 150)",
                              borderColor: "oklch(0.7 0.18 150 / 40%)",
                            }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full mr-1 status-pulse-green" style={{ background: "oklch(0.7 0.18 150)" }} />
                            Operational
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Models available</span>
                        <span className="font-mono">{p.modelCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Capabilities</span>
                        <span className="font-mono">{p.capabilities.length}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {p.capabilities.map((c) => (
                          <Badge key={c} variant="outline" className="text-[9px] py-0 h-3.5">
                            {c}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* TASKS */}
          <TabsContent value="tasks">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Recent Tasks ({tasks.length})</span>
                  <Button variant="ghost" size="sm" onClick={fetchTasks}>
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[60vh]">
                  <div className="space-y-1">
                    {tasks.map((t) => (
                      <div key={t.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/30">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{t.title}</div>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                            <span>{t.user?.email || "unknown"}</span>
                            {t.project && <span>· {t.project.name}</span>}
                            <span>· {new Date(t.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {t.workMode}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {t.status}
                        </Badge>
                        <div className="flex items-center gap-1">
                          {(t.status === "RUNNING" || t.status === "PLANNING" || t.status === "VERIFYING") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => handleTaskAction(t.id, "cancel")}
                            >
                              Cancel
                            </Button>
                          )}
                          {(t.status === "FAILED" || t.status === "CANCELLED") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => handleTaskAction(t.id, "retry")}
                            >
                              Retry
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {tasks.length === 0 && (
                      <div className="text-center py-8 text-sm text-muted-foreground">
                        No tasks yet
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AUDIT LOGS */}
          <TabsContent value="audit">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Audit Logs ({logs.length})</span>
                  <Button variant="ghost" size="sm" onClick={fetchLogs}>
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[60vh]">
                  <div className="space-y-1">
                    {logs.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 p-2 rounded-md hover:bg-accent/30 text-xs">
                        <div className="font-mono text-[10px] text-muted-foreground flex-shrink-0 w-20">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </div>
                        <div className="flex-1">
                          <span className="font-medium">{log.action}</span>
                          <span className="text-muted-foreground ml-2">by {log.user?.email || "unknown"}</span>
                          {log.target && (
                            <span className="text-muted-foreground ml-2">→ {log.target.slice(-8)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                    {logs.length === 0 && (
                      <div className="text-center py-8 text-sm text-muted-foreground">
                        No audit logs yet
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* BUDGET */}
          <TabsContent value="budget">
            <div className="space-y-4">
              {budget ? (
                <>
                  {/* Bonus banner for Super Admin */}
                  {budget.budget.isBonus && (
                    <Card
                      className="border-2"
                      style={{
                        borderColor: "oklch(0.65 0.2 250 / 50%)",
                        background: "linear-gradient(135deg, oklch(0.22 0.028 260 / 80%), oklch(0.2 0.025 290 / 80%))",
                        boxShadow: "0 0 30px oklch(0.65 0.2 250 / 20%)",
                      }}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{
                              background: "linear-gradient(135deg, #4f7dff, #8a6cf0)",
                              boxShadow: "0 8px 20px -8px rgba(79,125,255,0.55)",
                            }}
                          >
                            <Gift className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-bold">Super Admin API Bonus</h3>
                              <Badge
                                variant="outline"
                                className="text-[10px]"
                                style={{
                                  color: "oklch(0.7 0.18 150)",
                                  borderColor: "oklch(0.7 0.18 150 / 40%)",
                                }}
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full mr-1 status-pulse-green"
                                  style={{ background: "oklch(0.7 0.18 150)" }}
                                />
                                ACTIVE
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {budget.budget.bonusLabel} — full access to all 5 AI engines via OpenRouter.
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <BudgetStat
                                label="Total Budget"
                                value={`$${budget.budget.total.toFixed(2)}`}
                                sub={budget.budget.period}
                                icon={Wallet}
                                color="oklch(0.65 0.2 250)"
                              />
                              <BudgetStat
                                label="Spent"
                                value={`$${budget.budget.spent.toFixed(4)}`}
                                sub={`${budget.budget.usedPct.toFixed(2)}% used`}
                                icon={TrendingUp}
                                color="oklch(0.75 0.18 50)"
                              />
                              <BudgetStat
                                label="Remaining"
                                value={`$${budget.budget.remaining.toFixed(4)}`}
                                sub={`of $${budget.budget.total.toFixed(2)}`}
                                icon={CheckCircle2}
                                color="oklch(0.7 0.18 150)"
                              />
                              <BudgetStat
                                label="API Calls"
                                value={String(budget.usage.totalCalls)}
                                sub={`${budget.usage.totalTokens.toLocaleString()} tokens`}
                                icon={Zap}
                                color="oklch(0.65 0.22 290)"
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Usage progress bar */}
                  <Card className="glass-panel">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" style={{ color: "var(--voice-blue)" }} />
                          {budget.budget.period.charAt(0).toUpperCase() + budget.budget.period.slice(1)} Usage
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(budget.budget.periodStart).toLocaleDateString()} —{" "}
                          {new Date(budget.budget.periodEnd).toLocaleDateString()}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            ${budget.budget.spent.toFixed(4)} spent
                          </span>
                          <span className="font-mono text-xs">
                            {budget.budget.usedPct.toFixed(2)}%
                          </span>
                          <span className="text-muted-foreground">
                            ${budget.budget.remaining.toFixed(4)} remaining
                          </span>
                        </div>
                        <div
                          className="h-3 rounded-full overflow-hidden"
                          style={{ background: "oklch(0.27 0.03 260)" }}
                        >
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, budget.budget.usedPct)}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-full rounded-full"
                            style={{
                              background:
                                budget.budget.usedPct < 50
                                  ? "linear-gradient(90deg, oklch(0.65 0.2 250), oklch(0.7 0.18 150))"
                                  : budget.budget.usedPct < 80
                                  ? "linear-gradient(90deg, oklch(0.75 0.18 50), oklch(0.7 0.18 150))"
                                  : "linear-gradient(90deg, oklch(0.65 0.22 25), oklch(0.75 0.18 50))",
                            }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* OpenRouter integration status */}
                  <Card className="glass-panel">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Cpu className="w-4 h-4" style={{ color: "var(--voice-violet)" }} />
                        AI Provider Integration
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-md bg-background/30">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-md flex items-center justify-center"
                              style={{
                                background: budget.openrouter.configured
                                  ? "oklch(0.7 0.18 150 / 20%)"
                                  : "oklch(0.65 0.22 25 / 20%)",
                                color: budget.openrouter.configured
                                  ? "oklch(0.7 0.18 150)"
                                  : "oklch(0.65 0.22 25)",
                              }}
                            >
                              {budget.openrouter.configured ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                <AlertTriangle className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium">OpenRouter</div>
                              <div className="text-[11px] text-muted-foreground">
                                {budget.openrouter.configured
                                  ? `Connected · key: ${budget.openrouter.keyPrefix}`
                                  : "Not configured"}
                              </div>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-[10px]"
                            style={{
                              color: budget.openrouter.configured
                                ? "oklch(0.7 0.18 150)"
                                : "oklch(0.65 0.22 25)",
                              borderColor: budget.openrouter.configured
                                ? "oklch(0.7 0.18 150 / 40%)"
                                : "oklch(0.65 0.22 25 / 40%)",
                            }}
                          >
                            {budget.openrouter.configured ? "LIVE" : "OFFLINE"}
                          </Badge>
                        </div>

                        <div className="text-xs text-muted-foreground mb-2">
                          All 5 engines route through OpenRouter with these models:
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {budget.openrouter.engines &&
                            Object.entries(budget.openrouter.engines).map(([engine, info]: [string, any]) => (
                              <div
                                key={engine}
                                className="flex items-center gap-2 p-2 rounded-md bg-background/30"
                              >
                                <ProviderIconSmall provider={engine as keyof typeof PROVIDERS} />
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-medium">
                                    {PROVIDERS[engine as keyof typeof PROVIDERS]?.displayName || engine}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground font-mono truncate">
                                    {info.model}
                                  </div>
                                </div>
                                <CheckCircle2
                                  className="w-3 h-3 flex-shrink-0"
                                  style={{ color: "oklch(0.7 0.18 150)" }}
                                />
                              </div>
                            ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="glass-panel">
                  <CardContent className="p-8 text-center">
                    <div className="text-sm text-muted-foreground">Loading budget…</div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function BudgetStat({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  icon: any;
  color: string;
}) {
  return (
    <div
      className="rounded-lg p-3"
      style={{ background: "oklch(0.18 0.025 260 / 60%)", border: "1px solid oklch(0.3 0.025 260 / 40%)" }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className="w-3 h-3" style={{ color }} />
      </div>
      <div className="text-lg font-bold font-mono">{value}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>
    </div>
  );
}

function ProviderIconSmall({ provider }: { provider: keyof typeof PROVIDERS }) {
  const map = {
    CLAUDE: Sparkles,
    GEMINI: Eye,
    GLM: Brain,
    CODEX: Code2,
    RESEARCH: Globe,
  };
  const Icon = map[provider] || Layers;
  const color = PROVIDERS[provider]?.color || "var(--voice-blue)";
  return (
    <div
      className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
      style={{ background: `${color}25`, color }}
    >
      <Icon className="w-3.5 h-3.5" />
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: any;
  color: string;
}) {
  return (
    <Card className="glass-panel">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <div className="text-2xl font-semibold">{value}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>
      </CardContent>
    </Card>
  );
}

function ProviderIcon({ provider }: { provider: keyof typeof PROVIDERS }) {
  const map = {
    CLAUDE: Sparkles,
    GEMINI: Eye,
    GLM: Brain,
    CODEX: Code2,
    RESEARCH: Globe,
  };
  const Icon = map[provider] || Layers;
  return <Icon className="w-4 h-4" />;
}
