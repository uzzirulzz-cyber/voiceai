"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sparkles,
  Brain,
  Eye,
  Code2,
  Globe,
  Layers,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  RefreshCw,
  X,
  Play,
  Pause,
  ChevronRight,
  CircleDot,
  AlertCircle,
  Shield,
  Cpu,
  TrendingUp,
} from "lucide-react";
import { PROVIDERS, TASK_STATUS_META, type Provider, type TaskStatus } from "@/lib/types";
import type { ActiveTask } from "./workspace";

interface FusionPanelProps {
  activeTask: ActiveTask | null;
  onRetry: (taskId: string) => void;
  onCancel: (taskId: string) => void;
}

const PROVIDER_ICONS: Record<Provider, any> = {
  CLAUDE: Sparkles,
  GEMINI: Eye,
  GLM: Brain,
  CODEX: Code2,
  RESEARCH: Globe,
};

export function FusionPanel({ activeTask, onRetry, onCancel }: FusionPanelProps) {
  if (!activeTask) {
    return (
      <div className="h-full flex flex-col bg-card/30 border-l border-border/40">
        <PanelHeader />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="inline-block mb-3"
            >
              <Layers className="w-8 h-8 text-muted-foreground" style={{ color: "var(--voice-violet)" }} />
            </motion.div>
            <h3 className="font-medium text-sm">Voice Fusion Engine</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
              Active task details, agent assignments, and verification findings will appear here.
            </p>
          </div>
        </div>
        <ProvidersLegend />
      </div>
    );
  }

  const status = activeTask.status as TaskStatus;
  const statusMeta = TASK_STATUS_META[status];
  const isRunning = ["PLANNING", "RUNNING", "VERIFYING"].includes(status);
  const isTerminal = ["COMPLETED", "FAILED", "CANCELLED"].includes(status);

  const plan: any[] = activeTask.plan || [];
  const completedSubtasks = plan.filter((s) => s.status === "COMPLETED").length;
  const progressPct = plan.length > 0 ? (completedSubtasks / plan.length) * 100 : 0;

  return (
    <div className="h-full flex flex-col bg-card/30 border-l border-border/40">
      <PanelHeader />

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {/* Current task summary */}
          <Card className="glass-panel">
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-xs flex items-center justify-between">
                <span className="uppercase tracking-wider text-muted-foreground">
                  Current Task
                </span>
                <Badge
                  variant="outline"
                  className="text-[9px] py-0 h-4"
                  style={{
                    color: statusMeta.color,
                    borderColor: `${statusMeta.color}50`,
                  }}
                >
                  {isRunning && (
                    <CircleDot
                      className="w-2.5 h-2.5 mr-1 animate-pulse"
                      style={{ color: statusMeta.color }}
                    />
                  )}
                  {statusMeta.label}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <h4 className="text-sm font-medium leading-snug mb-2">{activeTask.title}</h4>

              {isRunning && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Progress</span>
                    <span>
                      {completedSubtasks}/{plan.length} subtasks
                    </span>
                  </div>
                  <Progress value={progressPct} className="h-1.5" />
                </div>
              )}

              {/* Budget / usage */}
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                <Stat
                  icon={Cpu}
                  label="Tokens"
                  value={`${activeTask.usedTokens.toLocaleString()} / ${activeTask.budgetTokens.toLocaleString()}`}
                  color="var(--voice-blue)"
                />
                <Stat
                  icon={TrendingUp}
                  label="Est. cost"
                  value={`$${activeTask.estimatedCost.toFixed(4)}`}
                  color="var(--voice-violet)"
                />
              </div>

              {/* Action buttons */}
              {isRunning && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2 h-7 text-xs"
                  onClick={() => onCancel(activeTask.id)}
                >
                  <X className="w-3 h-3 mr-1" /> Cancel task
                </Button>
              )}
              {status === "FAILED" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2 h-7 text-xs"
                  onClick={() => onRetry(activeTask.id)}
                >
                  <RefreshCw className="w-3 h-3 mr-1" /> Retry task
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Subtask timeline */}
          {plan.length > 0 && (
            <Card className="glass-panel">
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Activity className="w-3 h-3" />
                  Subtask Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3 space-y-2">
                {plan.map((subtask: any, i: number) => (
                  <SubtaskRow key={subtask.idx ?? i} subtask={subtask} />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Verification findings */}
          {activeTask.verification?.checks && (
            <Card className="glass-panel">
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Shield className="w-3 h-3" />
                  Verification
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3 space-y-1.5">
                {activeTask.verification.checks.map((check: any, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    {check.passed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "oklch(0.7 0.18 150)" }} />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "oklch(0.65 0.22 25)" }} />
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{check.name}</div>
                      {check.details && (
                        <div className="text-[10px] text-muted-foreground">{check.details}</div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Artifacts list */}
          {activeTask.artifacts && activeTask.artifacts.length > 0 && (
            <Card className="glass-panel">
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Code2 className="w-3 h-3" />
                  Artifacts ({activeTask.artifacts.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3 space-y-1">
                {activeTask.artifacts.map((art: any) => (
                  <div
                    key={art.id}
                    className="flex items-center gap-2 text-xs px-2 py-1 rounded-md bg-background/30"
                  >
                    <FileIcon language={art.language} />
                    <span className="flex-1 truncate">{art.name}</span>
                    <span className="text-[9px] text-muted-foreground">{art.createdBy}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Task meta */}
          <Card className="glass-panel">
            <CardContent className="p-3">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Updated {timeAgo(activeTask.updatedAt)}
                </span>
                <span className="font-mono">{activeTask.id.slice(-6)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      <ProvidersLegend />
    </div>
  );
}

function PanelHeader() {
  return (
    <div className="flex-shrink-0 px-3 py-2.5 border-b border-border/40 flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <Layers className="w-3.5 h-3.5" style={{ color: "var(--voice-violet)" }} />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Voice Fusion
        </span>
      </div>
      <Badge variant="outline" className="text-[9px] py-0 h-4">
        v2
      </Badge>
    </div>
  );
}

function SubtaskRow({ subtask }: { subtask: any }) {
  const Icon = PROVIDER_ICONS[subtask.provider as Provider] || Brain;
  const providerColor = PROVIDERS[subtask.provider as Provider]?.color || "var(--voice-blue)";

  const statusIcon = () => {
    switch (subtask.status) {
      case "COMPLETED":
        return <CheckCircle2 className="w-3 h-3" style={{ color: "oklch(0.7 0.18 150)" }} />;
      case "RUNNING":
        return <CircleDot className="w-3 h-3 animate-pulse" style={{ color: providerColor }} />;
      case "FAILED":
        return <XCircle className="w-3 h-3" style={{ color: "oklch(0.65 0.22 25)" }} />;
      case "SKIPPED":
        return <Pause className="w-3 h-3 text-muted-foreground" />;
      default:
        return <div className="w-3 h-3 rounded-full border border-muted-foreground" />;
    }
  };

  return (
    <div className="relative pl-4">
      {/* Timeline line */}
      <div className="absolute left-1.5 top-0 bottom-0 w-px bg-border/60" />
      <div
        className="absolute left-0 top-1.5 w-3 h-3 rounded-full flex items-center justify-center"
        style={{ background: `${providerColor}20` }}
      >
        {statusIcon()}
      </div>

      <div className="pb-2">
        <div className="flex items-center gap-1.5 mb-0.5">
          <Icon className="w-3 h-3 flex-shrink-0" style={{ color: providerColor }} />
          <span className="text-xs font-medium flex-1 truncate">{subtask.title}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge
            variant="outline"
            className="text-[9px] py-0 h-3.5"
            style={{ color: providerColor, borderColor: `${providerColor}40` }}
          >
            {PROVIDERS[subtask.provider as Provider]?.displayName}
          </Badge>
          <span className="text-[10px] text-muted-foreground truncate">
            {subtask.capability}
          </span>
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-md bg-background/30 p-1.5">
      <div className="flex items-center gap-1 mb-0.5">
        <Icon className="w-2.5 h-2.5" style={{ color }} />
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="text-[11px] font-mono">{value}</div>
    </div>
  );
}

function FileIcon({ language }: { language?: string }) {
  if (language === "html") return <Code2 className="w-3 h-3 text-muted-foreground" />;
  if (language === "markdown") return <Sparkles className="w-3 h-3 text-muted-foreground" />;
  if (language === "json") return <Code2 className="w-3 h-3 text-muted-foreground" />;
  return <Code2 className="w-3 h-3 text-muted-foreground" />;
}

function ProvidersLegend() {
  return (
    <div className="flex-shrink-0 border-t border-border/40 p-2.5">
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1.5">
        Engines
      </div>
      <div className="grid grid-cols-5 gap-1">
        {Object.values(PROVIDERS).map((p) => {
          const Icon = PROVIDER_ICONS[p.id];
          return (
            <div
              key={p.id}
              className="flex flex-col items-center gap-0.5 p-1 rounded"
              title={`${p.displayName}: ${p.description}`}
            >
              <Icon className="w-3 h-3" style={{ color: p.color }} />
              <span className="text-[8px] text-muted-foreground">{p.displayName}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function timeAgo(date: string | Date) {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = now - then;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}
