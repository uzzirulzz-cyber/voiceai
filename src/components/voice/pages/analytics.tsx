"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  Activity,
  Zap,
} from "lucide-react";

export function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/overview")
      .then((r) => r.json())
      .then((d) => {
        setStats(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-64" />)}
        </div>
      </div>
    );
  }

  const o = stats.overview || {};
  const completionRate = o.completionRate || 0;
  const failureRate = o.failureRate || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 lg:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Insights from your AI workspace activity</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Task status chart */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="voice-card p-5"
        >
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Tasks by Status
          </h3>
          {stats.tasksByStatus && Object.keys(stats.tasksByStatus).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(stats.tasksByStatus).map(([status, count]: [string, any]) => {
                const total = o.totalTasks || 1;
                const pct = (count / total) * 100;
                const colorMap: Record<string, string> = {
                  COMPLETED: "var(--success)",
                  FAILED: "var(--danger)",
                  RUNNING: "var(--primary)",
                  QUEUED: "var(--muted-foreground)",
                  PLANNING: "var(--warning)",
                  VERIFYING: "var(--accent)",
                };
                const color = colorMap[status] || "var(--muted-foreground)";
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{status}</span>
                      <span className="font-mono">{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6 }}
                        className="h-full rounded-full"
                        style={{ background: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-muted-foreground">
              No tasks yet. Run a task to populate analytics.
            </div>
          )}
        </motion.div>

        {/* Provider usage */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="voice-card p-5"
        >
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Provider Usage
          </h3>
          {stats.usageByProvider && Object.keys(stats.usageByProvider).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(stats.usageByProvider).map(([provider, data]: [string, any]) => {
                const colorMap: Record<string, string> = {
                  CLAUDE: "#4F8CFF",
                  GEMINI: "#9B7AFF",
                  GLM: "#30C995",
                  CODEX: "#F2B65D",
                  RESEARCH: "#DDBB70",
                };
                const color = colorMap[provider] || "var(--primary)";
                const tokens = (data._sum.inputTokens || 0) + (data._sum.outputTokens || 0);
                const maxTokens = Math.max(...Object.values(stats.usageByProvider).map((p: any) => (p._sum.inputTokens || 0) + (p._sum.outputTokens || 0)));
                const pct = (tokens / maxTokens) * 100;
                return (
                  <div key={provider}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                        {provider}
                      </span>
                      <span className="text-muted-foreground font-mono">{data._count} calls · {tokens.toLocaleString()} tok</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6 }}
                        className="h-full rounded-full"
                        style={{ background: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-muted-foreground">
              No usage data yet.
            </div>
          )}
        </motion.div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Completion Rate" value={`${completionRate.toFixed(1)}%`} icon={CheckCircle2} color="var(--success)" />
        <KPI label="Failure Rate" value={`${failureRate.toFixed(1)}%`} icon={Activity} color="var(--danger)" />
        <KPI label="Avg Task Cost" value={`$${o.totalTasks ? (o.totalCost / o.totalTasks).toFixed(4) : "0.0000"}`} icon={Zap} color="var(--gold)" />
        <KPI label="Total Tokens" value={(o.totalInputTokens + o.totalOutputTokens).toLocaleString()} icon={Clock} color="var(--accent)" />
      </div>
    </div>
  );
}

function KPI({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="voice-card p-4"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </div>
      <div className="text-xl font-bold">{value}</div>
    </motion.div>
  );
}
