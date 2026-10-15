"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  History,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Filter,
  Download,
  Code2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PROVIDERS, type Provider } from "@/lib/types";
import { toast } from "sonner";

interface TaskItem {
  id: string;
  title: string;
  description: string;
  status: string;
  workMode: string;
  usedTokens: number;
  budgetTokens: number;
  estimatedCost: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  project?: { id: string; name: string } | null;
}

export function TasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [taskDetail, setTaskDetail] = useState<any>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    fetch("/api/tasks/list")
      .then((r) => r.json())
      .then((d) => {
        setTasks(d.tasks || []);
        setLoading(false);
      });
  }, []);

  // Initial load
  if (tasks.length === 0 && loading) {
    refresh();
  }

  const selectTask = async (task: TaskItem) => {
    setSelectedTask(task);
    try {
      const res = await fetch(`/api/tasks/execute?id=${task.id}`);
      const data = await res.json();
      if (data.task) {
        setTaskDetail({
          ...data.task,
          plan: data.task.plan || [],
          events: data.task.events || [],
          artifacts: data.task.artifacts || [],
          verification: data.task.verification || {},
        });
      }
    } catch {}
  };

  const handleRetry = async (taskId: string) => {
    try {
      await fetch("/api/tasks/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });
      toast.success("Task re-queued");
      refresh();
    } catch {
      toast.error("Retry failed");
    }
  };

  const filtered = tasks.filter((t) => statusFilter === "all" || t.status === statusFilter);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 lg:py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Task History</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {tasks.length} tasks · {tasks.filter((t) => t.status === "COMPLETED").length} completed · {tasks.filter((t) => t.status === "FAILED").length} failed
          </p>
        </div>
        <button onClick={refresh} className="px-3 py-1.5 rounded-md border border-border bg-card/50 hover:bg-accent text-xs flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Task list */}
        <div className="lg:col-span-2 space-y-2">
          {/* Filter */}
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 py-1 rounded-md bg-card border border-border text-xs"
            >
              <option value="all">All status</option>
              <option value="QUEUED">Queued</option>
              <option value="PLANNING">Planning</option>
              <option value="RUNNING">Running</option>
              <option value="VERIFYING">Verifying</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {loading ? (
            <div className="space-y-2">{[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-16" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 voice-card">
              <History className="w-10 h-10 mx-auto text-muted-foreground mb-3 opacity-50" />
              <div className="text-sm font-medium">No tasks yet</div>
              <div className="text-xs text-muted-foreground mt-1">Submit a task from AI Workspace to see it here</div>
            </div>
          ) : (
            filtered.map((task, i) => (
              <motion.button
                key={task.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => selectTask(task)}
                className={cn(
                  "voice-card p-3 w-full text-left",
                  selectedTask?.id === task.id && "ring-1 ring-primary"
                )}
              >
                <div className="flex items-start gap-3">
                  <StatusIcon status={task.status} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{task.title}</div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span className="px-1.5 py-0.5 rounded bg-muted/50 font-mono">{task.workMode}</span>
                      <span>{task.usedTokens.toLocaleString()} tokens</span>
                      {task.estimatedCost ? <span>· ${task.estimatedCost.toFixed(4)}</span> : null}
                      {task.project && <span>· {task.project.name}</span>}
                      <span>· {timeAgo(task.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </motion.button>
            ))
          )}
        </div>

        {/* Task detail panel */}
        <div>
          {selectedTask && taskDetail ? (
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              className="voice-card p-4 sticky top-20"
            >
              <div className="flex items-start gap-2 mb-3">
                <StatusIcon status={selectedTask.status} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">{selectedTask.title}</div>
                  <div className="text-[10px] text-muted-foreground">{selectedTask.id.slice(-8)}</div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mb-3 line-clamp-3">{selectedTask.description}</p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <Stat label="Tokens" value={`${selectedTask.usedTokens.toLocaleString()} / ${selectedTask.budgetTokens.toLocaleString()}`} />
                <Stat label="Cost" value={`$${selectedTask.estimatedCost.toFixed(4)}`} />
              </div>

              {/* Subtasks */}
              {taskDetail.plan && taskDetail.plan.length > 0 && (
                <div className="mb-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Execution Timeline</div>
                  <div className="space-y-1">
                    {taskDetail.plan.map((sub: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 p-1.5 rounded-md bg-card/40">
                        <div className={cn("engine-dot engine-" + sub.provider)} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-medium truncate">{sub.title}</div>
                          <div className="text-[9px] text-muted-foreground">{sub.provider} · {sub.capability}</div>
                        </div>
                        <SubtaskStatus status={sub.status} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Verification */}
              {taskDetail.verification?.checks && (
                <div className="mb-3 pt-3 border-t border-border">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Verification</div>
                  <div className="space-y-1">
                    {taskDetail.verification.checks.map((c: any, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-[11px]">
                        {c.passed ? <CheckCircle2 className="w-3 h-3 mt-0.5" style={{ color: "var(--success)" }} /> : <XCircle className="w-3 h-3 mt-0.5" style={{ color: "var(--danger)" }} />}
                        <span className="flex-1">{c.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Artifacts */}
              {taskDetail.artifacts && taskDetail.artifacts.length > 0 && (
                <div className="mb-3 pt-3 border-t border-border">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Artifacts ({taskDetail.artifacts.length})</div>
                  <div className="space-y-1">
                    {taskDetail.artifacts.map((a: any) => (
                      <div key={a.id} className="flex items-center gap-2 p-1.5 rounded-md bg-card/40">
                        <Code2 className="w-3 h-3 text-muted-foreground" />
                        <span className="flex-1 text-[11px] truncate font-mono">{a.name}</span>
                        <button
                          onClick={() => downloadArtifact(a)}
                          className="text-primary hover:text-primary/80"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Retry button */}
              {(selectedTask.status === "FAILED" || selectedTask.status === "CANCELLED") && (
                <button
                  onClick={() => handleRetry(selectedTask.id)}
                  className="btn-voice text-xs w-full flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3" /> Retry task
                </button>
              )}
            </motion.div>
          ) : (
            <div className="voice-card p-8 text-center text-xs text-muted-foreground">
              Select a task to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  const map: Record<string, { icon: any; color: string }> = {
    QUEUED: { icon: Clock, color: "var(--muted-foreground)" },
    PLANNING: { icon: Loader2, color: "var(--warning)" },
    RUNNING: { icon: Loader2, color: "var(--primary)" },
    VERIFYING: { icon: Loader2, color: "var(--accent)" },
    COMPLETED: { icon: CheckCircle2, color: "var(--success)" },
    FAILED: { icon: XCircle, color: "var(--danger)" },
    CANCELLED: { icon: AlertCircle, color: "var(--muted-foreground)" },
  };
  const s = map[status] || map.QUEUED;
  const Icon = s.icon;
  const spinning = ["PLANNING", "RUNNING", "VERIFYING"].includes(status);
  return <Icon className={cn("w-4 h-4 flex-shrink-0 mt-0.5", spinning && "animate-spin")} style={{ color: s.color }} />;
}

function SubtaskStatus({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    PENDING: { color: "var(--muted-foreground)", label: "Pending" },
    RUNNING: { color: "var(--primary)", label: "Running" },
    COMPLETED: { color: "var(--success)", label: "Done" },
    FAILED: { color: "var(--danger)", label: "Failed" },
    SKIPPED: { color: "var(--muted-foreground)", label: "Skipped" },
  };
  const s = map[status] || map.PENDING;
  return <span className="text-[9px] font-mono" style={{ color: s.color }}>{s.label}</span>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2 rounded-md bg-card/40">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-xs font-mono mt-0.5">{value}</div>
    </div>
  );
}

function downloadArtifact(artifact: any) {
  const blob = new Blob([artifact.content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = artifact.name;
  a.click();
  URL.revokeObjectURL(url);
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
