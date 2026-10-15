"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Zap,
  Scale,
  Brain,
  Code2,
  Globe,
  Paperclip,
  X,
  ArrowUp,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
  Settings2,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PROVIDERS, type Provider, type WorkMode } from "@/lib/types";
import { toast } from "sonner";

interface WorkspacePageProps {
  user: { id: string; name: string | null };
  defaultWorkMode?: WorkMode;
  onTaskCreated?: (taskId: string) => void;
}

const WORK_MODES: Array<{ id: WorkMode; label: string; icon: any; description: string; routing: string }> = [
  { id: "BALANCED", label: "Balanced", icon: Scale, description: "Optimal mix of speed and depth", routing: "Routes to all capable engines" },
  { id: "FAST", label: "Fast", icon: Zap, description: "Quick routing, fewer agents", routing: "Single-engine routing, minimal verification" },
  { id: "DEEP", label: "Deep Reasoning", icon: Brain, description: "Maximum agents, thorough verification", routing: "All reasoning engines engaged" },
  { id: "CODING", label: "Coding", icon: Code2, description: "Code-focused with Codex priority", routing: "Routes to Codex + Claude for verification" },
  { id: "RESEARCH", label: "Research", icon: Globe, description: "Web research and synthesis", routing: "Routes to Research + GLM for analysis" },
];

const PROVIDER_SELECTION: Array<{ id: Provider; label: string }> = [
  { id: "CLAUDE", label: "Claude" },
  { id: "GEMINI", label: "Gemini" },
  { id: "GLM", label: "GLM" },
  { id: "CODEX", label: "Codex" },
  { id: "RESEARCH", label: "Research" },
];

const PROMPT_HISTORY_KEY = "voice-prompt-history";

export function WorkspacePage({ user, defaultWorkMode = "BALANCED", onTaskCreated }: WorkspacePageProps) {
  const [prompt, setPrompt] = useState("");
  const [workMode, setWorkMode] = useState<WorkMode>(defaultWorkMode);
  const [selectedProviders, setSelectedProviders] = useState<Set<Provider>>(new Set(["CLAUDE", "GEMINI", "GLM", "CODEX", "RESEARCH"]));
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTask, setActiveTask] = useState<any>(null);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Load prompt history
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROMPT_HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }, []);

  // Load projects
  useEffect(() => {
    fetch("/api/projects/list")
      .then((r) => r.json())
      .then((d) => setProjects(d.projects || []))
      .catch(() => {});
  }, []);

  // Autosizing textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 320)}px`;
    }
  }, [prompt]);

  const toggleProvider = (p: Provider) => {
    setSelectedProviders((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      if (next.size === 0) next.add(p); // never empty
      return next;
    });
  };

  const handleAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files].slice(0, 5));
  };

  const handleSubmit = async () => {
    if (!prompt.trim() || submitting) return;
    setSubmitting(true);

    const title = prompt.trim().split("\n")[0].slice(0, 80);
    try {
      const createRes = await fetch("/api/tasks/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: prompt.trim(),
          workMode,
          projectId: selectedProject || null,
          providers: Array.from(selectedProviders),
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error);

      // Save to history
      const newHistory = [prompt.trim(), ...history.filter((h) => h !== prompt.trim())].slice(0, 10);
      setHistory(newHistory);
      try { localStorage.setItem(PROMPT_HISTORY_KEY, JSON.stringify(newHistory)); } catch {}

      // Mark task as started (execution happens via /api/tasks/step polling)
      await fetch("/api/tasks/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: createData.task.id }),
      });

      setActiveTask({ ...createData.task, plan: JSON.parse(createData.task.planJson || "[]"), events: [] });
      setPrompt("");
      setAttachments([]);
      toast.success("Task queued — execution started");
      onTaskCreated?.(createData.task.id);

      // Start polling
      pollTask(createData.task.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setSubmitting(false);
    }
  };

  const pollTask = useCallback((taskId: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        // Call step endpoint to process ONE subtask, then fetch state
        await fetch("/api/tasks/step", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskId }),
        });
        const res = await fetch(`/api/tasks/execute?id=${taskId}`);
        const data = await res.json();
        if (data.task) {
          setActiveTask({
            ...data.task,
            plan: data.task.plan || [],
            events: data.task.events || [],
            artifacts: data.task.artifacts || [],
            verification: data.task.verification || {},
          });
          if (["COMPLETED", "FAILED", "CANCELLED"].includes(data.task.status)) {
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
          }
        }
      } catch {}
    }, 1500);
  }, []);

  useEffect(() => () => { if (pollingRef.current) clearInterval(pollingRef.current); }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-6 py-6 lg:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">AI Workspace</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Compose a task — the Voice Fusion Engine routes it to the right engines.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Composer (center) */}
        <div className="lg:col-span-2">
          <div className="voice-card p-1.5 gradient-border">
            {/* Prompt editor */}
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="What would you like Voice AI to build today?"
                className="w-full bg-transparent resize-none outline-none p-4 text-sm placeholder:text-muted-foreground min-h-[120px]"
                style={{ maxHeight: "320px" }}
              />
            </div>

            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                {attachments.map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-card/60 text-xs">
                    <Paperclip className="w-3 h-3 text-muted-foreground" />
                    <span className="max-w-[120px] truncate">{f.name}</span>
                    <button
                      onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Toolbar */}
            <div className="flex items-center gap-1.5 p-2 border-t border-border">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleAttach}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title="Attach files"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title="Prompt history"
              >
                <History className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={cn(
                  "p-2 rounded-md transition-colors",
                  showAdvanced ? "text-primary bg-accent/50" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
                title="Advanced settings"
              >
                <Settings2 className="w-4 h-4" />
              </button>
              <div className="flex-1" />
              <span className="text-[10px] text-muted-foreground hidden sm:inline">
                ⌘+Enter to submit
              </span>
              <button
                onClick={handleSubmit}
                disabled={!prompt.trim() || submitting}
                className="btn-voice flex items-center gap-1.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ArrowUp className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">{submitting ? "Submitting…" : "Run Task"}</span>
              </button>
            </div>
          </div>

          {/* Prompt history */}
          <AnimatePresence>
            {showHistory && history.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 voice-card p-3 overflow-hidden"
              >
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                  Prompt History
                </div>
                <div className="space-y-1">
                  {history.map((h, i) => (
                    <button
                      key={i}
                      onClick={() => { setPrompt(h); setShowHistory(false); }}
                      className="w-full text-left p-2 rounded-md hover:bg-accent/40 text-xs truncate"
                    >
                      {h.slice(0, 100)}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active task progress */}
          <AnimatePresence>
            {activeTask && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 voice-card p-4"
              >
                <div className="flex items-start gap-3 mb-3">
                  <StatusIcon status={activeTask.status} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold">{activeTask.title}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-muted/50 font-mono">{activeTask.workMode}</span>
                      <span>{activeTask.usedTokens?.toLocaleString() || 0} / {activeTask.budgetTokens?.toLocaleString()} tokens</span>
                      {activeTask.estimatedCost ? <span>· ${activeTask.estimatedCost.toFixed(4)}</span> : null}
                    </div>
                  </div>
                </div>

                {/* Subtask progress */}
                {activeTask.plan && activeTask.plan.length > 0 && (
                  <div className="space-y-1.5 mt-3">
                    {activeTask.plan.map((sub: any, i: number) => (
                      <SubtaskProgress key={sub.idx ?? i} subtask={sub} />
                    ))}
                  </div>
                )}

                {/* Events */}
                {activeTask.events && activeTask.events.length > 0 && (
                  <div className="mt-3 space-y-1 max-h-40 overflow-y-auto">
                    {activeTask.events.slice(-8).map((e: any, i: number) => (
                      <div key={e.id || i} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                        <span className="font-mono opacity-50">{new Date(e.timestamp).toLocaleTimeString()}</span>
                        <span className="flex-1">{e.message}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Completion + artifacts */}
                {activeTask.status === "COMPLETED" && activeTask.artifacts?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "var(--success)" }} />
                      {activeTask.artifacts.length} Artifacts Produced
                    </div>
                    <div className="space-y-1">
                      {activeTask.artifacts.map((a: any) => (
                        <div key={a.id} className="flex items-center gap-2 p-2 rounded-md bg-card/40 text-xs">
                          <Code2 className="w-3 h-3 text-muted-foreground" />
                          <span className="flex-1 truncate font-mono">{a.name}</span>
                          <button
                            onClick={() => downloadArtifact(a)}
                            className="text-primary hover:underline text-[11px]"
                          >
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right sidebar — work modes + model selector */}
        <div className="space-y-4">
          <div className="voice-card p-4">
            <div className="text-xs font-semibold mb-3 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-primary" />
              Work Mode
            </div>
            <div className="space-y-1">
              {WORK_MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setWorkMode(m.id)}
                  className={cn(
                    "w-full flex items-start gap-2 p-2 rounded-lg text-left transition-colors",
                    workMode === m.id ? "bg-accent/40 ring-1 ring-primary/30" : "hover:bg-accent/40"
                  )}
                >
                  <m.icon className={cn("w-3.5 h-3.5 flex-shrink-0 mt-0.5", workMode === m.id ? "text-primary" : "text-muted-foreground")} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium">{m.label}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{m.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Advanced settings */}
          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="voice-card p-4 overflow-hidden"
              >
                <div className="text-xs font-semibold mb-3">Project</div>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-md bg-input border border-border text-xs"
                >
                  <option value="">No project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>

                <div className="text-xs font-semibold mt-4 mb-3">Engines</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {PROVIDER_SELECTION.map((p) => {
                    const info = PROVIDERS[p.id];
                    const selected = selectedProviders.has(p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => toggleProvider(p.id)}
                        className={cn(
                          "flex items-center gap-1.5 p-2 rounded-md text-xs transition-colors",
                          selected ? "bg-accent/40 ring-1 ring-primary/30" : "bg-card/40 opacity-50"
                        )}
                      >
                        <div className={cn("engine-dot engine-" + p.id)} />
                        <span className="flex-1 text-left">{p.label}</span>
                        {selected && <CheckCircle2 className="w-3 h-3 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* All models live banner */}
          <div className="voice-card p-4"
            style={{ background: "linear-gradient(135deg, rgba(48,201,149,0.06), rgba(79,140,255,0.04))" }}>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "var(--success)" }} />
              <span className="text-xs font-semibold">All 5 Engines Live</span>
            </div>
            <div className="text-[10px] text-muted-foreground">
              Real API calls via OpenRouter. No mocks.
            </div>
          </div>
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
    FAILED: { icon: AlertCircle, color: "var(--danger)" },
    CANCELLED: { icon: AlertCircle, color: "var(--muted-foreground)" },
  };
  const s = map[status] || map.QUEUED;
  const Icon = s.icon;
  const spinning = ["PLANNING", "RUNNING", "VERIFYING"].includes(status);
  return <Icon className={cn("w-4 h-4 flex-shrink-0 mt-0.5", spinning && "animate-spin")} style={{ color: s.color }} />;
}

function SubtaskProgress({ subtask }: { subtask: any }) {
  const statusColor: Record<string, string> = {
    PENDING: "var(--muted-foreground)",
    RUNNING: "var(--primary)",
    COMPLETED: "var(--success)",
    FAILED: "var(--danger)",
    SKIPPED: "var(--muted-foreground)",
  };
  const color = statusColor[subtask.status] || "var(--muted-foreground)";
  const Icon = subtask.status === "COMPLETED" ? CheckCircle2 : subtask.status === "RUNNING" ? Loader2 : Clock;
  return (
    <div className="flex items-center gap-2 p-2 rounded-md bg-card/30">
      <Icon className={cn("w-3.5 h-3.5 flex-shrink-0", subtask.status === "RUNNING" && "animate-spin")} style={{ color }} />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium truncate">{subtask.title}</div>
        <div className="text-[10px] text-muted-foreground">{subtask.provider} · {subtask.capability}</div>
      </div>
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
