"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import {
  MessageSquare,
  Code2,
  Eye,
  FileText,
  Search,
  Send,
  Zap,
  Scale,
  Layers,
  Copy,
  Download,
  Check,
  Loader2,
  Sparkles,
  Brain,
  Globe,
  FileCode2,
  AlertCircle,
} from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { Project, ProjectFile, ActiveTask, TaskSummary } from "./workspace";
import { WORK_MODES, PROVIDERS, type WorkMode } from "@/lib/types";
import { toast } from "sonner";

interface WorkAreaProps {
  activeProject: Project | null;
  activeFile: ProjectFile | null;
  activeTask: ActiveTask | null;
  tasks: TaskSummary[];
  onSaveFile: (fileId: string, content: string) => void;
  onCreateTask: (data: { title: string; description: string; workMode: string }) => void;
  onSelectTask: (taskId: string) => void;
}

export function WorkArea({
  activeProject,
  activeFile,
  activeTask,
  tasks,
  onSaveFile,
  onCreateTask,
  onSelectTask,
}: WorkAreaProps) {
  const [activeTab, setActiveTab] = useState("chat");
  const [prompt, setPrompt] = useState("");
  const [workMode, setWorkMode] = useState<WorkMode>("BALANCED");
  const [editorContent, setEditorContent] = useState("");
  const [copied, setCopied] = useState(false);
  const [lastFileId, setLastFileId] = useState<string | null>(null);
  const [lastTaskId, setLastTaskId] = useState<string | null>(null);

  // Sync editor content when active file changes
  if (activeFile && activeFile.id !== lastFileId) {
    setLastFileId(activeFile.id);
    setEditorContent(activeFile.content);
    if (activeTab !== "code") setActiveTab("code");
  }
  if (!activeFile && lastFileId !== null) {
    setLastFileId(null);
  }

  // Switch to chat tab when task is selected
  if (activeTask && activeTask.id !== lastTaskId) {
    setLastTaskId(activeTask.id);
    setActiveTab("chat");
  }
  if (!activeTask && lastTaskId !== null) {
    setLastTaskId(null);
  }

  const handleSubmit = () => {
    if (!prompt.trim()) return;
    const title = prompt.trim().split("\n")[0].slice(0, 80);
    onCreateTask({ title, description: prompt.trim(), workMode });
    setPrompt("");
  };

  const handleSaveFile = () => {
    if (activeFile && editorContent !== activeFile.content) {
      onSaveFile(activeFile.id, editorContent);
    }
  };

  const handleCopy = async () => {
    if (activeFile) {
      await navigator.clipboard.writeText(editorContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleDownload = () => {
    if (activeFile) {
      const blob = new Blob([editorContent], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = activeFile.path.split("/").pop() || "file.txt";
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const fileIsHtml = activeFile?.path.endsWith(".html") || activeFile?.path.endsWith(".htm");
  const fileIsMarkdown = activeFile?.path.endsWith(".md");

  return (
    <div className="h-full flex flex-col bg-background/40">
      {/* Tabs */}
      <div className="flex-shrink-0 border-b border-border/40 bg-card/20">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-2 pt-1">
            <TabsList className="bg-transparent p-0 h-9 gap-1">
              <TabsTrigger value="chat" className="data-[state=active]:bg-accent/60 gap-1.5 text-xs">
                <MessageSquare className="w-3.5 h-3.5" /> Chat
              </TabsTrigger>
              <TabsTrigger value="code" className="data-[state=active]:bg-accent/60 gap-1.5 text-xs">
                <Code2 className="w-3.5 h-3.5" /> Code
              </TabsTrigger>
              <TabsTrigger
                value="preview"
                className="data-[state=active]:bg-accent/60 gap-1.5 text-xs"
                disabled={!fileIsHtml}
              >
                <Eye className="w-3.5 h-3.5" /> Preview
              </TabsTrigger>
              <TabsTrigger value="documents" className="data-[state=active]:bg-accent/60 gap-1.5 text-xs">
                <FileText className="w-3.5 h-3.5" /> Docs
              </TabsTrigger>
              <TabsTrigger value="research" className="data-[state=active]:bg-accent/60 gap-1.5 text-xs">
                <Search className="w-3.5 h-3.5" /> Research
              </TabsTrigger>
            </TabsList>
          </div>

          {/* CHAT TAB */}
          <TabsContent value="chat" className="m-0 h-[calc(100vh-3.5rem-2.25rem)]">
            <div className="flex flex-col h-full">
              {/* Chat messages / task state */}
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4 max-w-4xl mx-auto">
                  {!activeTask && (
                    <div className="text-center py-12">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex flex-col items-center gap-3"
                      >
                        <Sparkles className="w-8 h-8 text-muted-foreground" style={{ color: "var(--voice-blue)" }} />
                        <div>
                          <h3 className="font-medium">Start a new task</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Describe what you want — the Fusion Engine will plan, route, and verify it.
                          </p>
                        </div>
                      </motion.div>
                    </div>
                  )}

                  {activeTask && (
                    <>
                      {/* Task header */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border border-border/40 bg-card/40 p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <h3 className="font-semibold">{activeTask.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{activeTask.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-[10px]">
                                {activeTask.workMode}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="text-[10px]"
                                style={{
                                  color: statusColor(activeTask.status),
                                  borderColor: `${statusColor(activeTask.status)}40`,
                                }}
                              >
                                {activeTask.status}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">
                                {activeTask.usedTokens.toLocaleString()} / {activeTask.budgetTokens.toLocaleString()} tokens
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>

                      {/* Events stream */}
                      {activeTask.events && activeTask.events.length > 0 && (
                        <div className="space-y-2">
                          {activeTask.events.map((event: any, i: number) => (
                            <motion.div
                              key={event.id || i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="flex items-start gap-2 text-sm"
                            >
                              <div className="flex-shrink-0 mt-0.5">
                                <EventIcon type={event.type} provider={event.provider} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-foreground">{event.message}</span>
                                {event.provider && (
                                  <Badge
                                    variant="outline"
                                    className="ml-2 text-[9px] py-0 h-4"
                                    style={{
                                      color: PROVIDERS[event.provider as keyof typeof PROVIDERS]?.color,
                                      borderColor: `${PROVIDERS[event.provider as keyof typeof PROVIDERS]?.color}40`,
                                    }}
                                  >
                                    {PROVIDERS[event.provider as keyof typeof PROVIDERS]?.displayName}
                                  </Badge>
                                )}
                                <span className="ml-2 text-[10px] text-muted-foreground">
                                  {new Date(event.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {/* Artifacts produced */}
                      {activeTask.artifacts && activeTask.artifacts.length > 0 && activeTask.status === "COMPLETED" && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-xl border border-border/40 bg-card/40 p-4 mt-4"
                        >
                          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                            <FileCode2 className="w-4 h-4" style={{ color: "var(--voice-blue)" }} />
                            Artifacts ({activeTask.artifacts.length})
                          </h4>
                          <div className="space-y-1.5">
                            {activeTask.artifacts.map((art: any) => (
                              <div
                                key={art.id}
                                className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-background/40 text-sm"
                              >
                                <FileCode2 className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="flex-1 truncate">{art.name}</span>
                                <span className="text-xs text-muted-foreground">{art.language}</span>
                                <button
                                  onClick={() => {
                                    const blob = new Blob([art.content], { type: "text/plain" });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement("a");
                                    a.href = url;
                                    a.download = art.name;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                  }}
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {/* Final summary */}
                      {activeTask.status === "COMPLETED" && activeTask.verification?.summary && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-xl border voice-glow p-4"
                          style={{
                            borderColor: "oklch(0.7 0.18 150 / 40%)",
                            background: "oklch(0.7 0.18 150 / 5%)",
                          }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Check className="w-4 h-4" style={{ color: "oklch(0.7 0.18 150)" }} />
                            <h4 className="text-sm font-semibold">Task Completed</h4>
                          </div>
                          <p className="text-sm text-muted-foreground">{activeTask.verification.summary}</p>
                          {activeTask.verification.checks && (
                            <div className="mt-3 space-y-1">
                              {activeTask.verification.checks.map((check: any, i: number) => (
                                <div key={i} className="flex items-center gap-2 text-xs">
                                  <Check
                                    className="w-3 h-3"
                                    style={{ color: check.passed ? "oklch(0.7 0.18 150)" : "oklch(0.65 0.22 25)" }}
                                  />
                                  <span className="flex-1">{check.name}</span>
                                  <span className="text-muted-foreground">{check.details}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </>
                  )}
                </div>
              </ScrollArea>

              {/* Prompt input */}
              <div className="flex-shrink-0 border-t border-border/40 p-3 bg-card/20">
                <div className="max-w-4xl mx-auto">
                  {/* Work mode selector */}
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground mr-1">
                      Mode:
                    </span>
                    {(Object.keys(WORK_MODES) as WorkMode[]).map((mode) => {
                      const Icon =
                        mode === "FAST" ? Zap : mode === "BALANCED" ? Scale : Layers;
                      return (
                        <button
                          key={mode}
                          onClick={() => setWorkMode(mode)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
                            workMode === mode
                              ? "bg-accent text-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                          style={
                            workMode === mode
                              ? {
                                  background: "oklch(0.65 0.2 250 / 15%)",
                                  color: "var(--voice-blue)",
                                }
                              : {}
                          }
                        >
                          <Icon className="w-3 h-3" />
                          {WORK_MODES[mode].label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="relative">
                    <Textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                          e.preventDefault();
                          handleSubmit();
                        }
                      }}
                      placeholder="Describe your task… e.g. 'Research AI productivity tools, write landing-page copy for a fictional product, and build a responsive landing page.'"
                      className="min-h-[80px] max-h-[200px] resize-none bg-input/50 pr-12"
                    />
                    <Button
                      onClick={handleSubmit}
                      disabled={!prompt.trim()}
                      size="sm"
                      className="absolute bottom-2 right-2 h-8 w-8 p-0 voice-glow"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] text-muted-foreground">
                      Press ⌘+Enter to submit
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Mode: {WORK_MODES[workMode].description}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* CODE TAB */}
          <TabsContent value="code" className="m-0 h-[calc(100vh-3.5rem-2.25rem)]">
            <div className="flex flex-col h-full">
              {activeFile ? (
                <>
                  <div className="flex-shrink-0 flex items-center justify-between px-3 py-1.5 border-b border-border/40 bg-card/20">
                    <div className="flex items-center gap-2 text-xs">
                      <FileCode2 className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-mono">{activeFile.path}</span>
                      <Badge variant="outline" className="text-[9px] py-0 h-4">
                        v{activeFile.version}
                      </Badge>
                      {editorContent !== activeFile.content && (
                        <span className="text-[10px]" style={{ color: "var(--voice-cyan)" }}>
                          ● unsaved
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleCopy}>
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span className="ml-1">{copied ? "Copied" : "Copy"}</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleDownload}>
                        <Download className="w-3 h-3" />
                        <span className="ml-1">Download</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={handleSaveFile}
                        disabled={editorContent === activeFile.content}
                        style={editorContent !== activeFile.content ? { color: "var(--voice-blue)" } : {}}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-auto">
                    <SyntaxHighlighter
                      language={activeFile.language || "text"}
                      style={atomDark}
                      customStyle={{
                        margin: 0,
                        background: "transparent",
                        padding: "1rem",
                        fontSize: "13px",
                        minHeight: "100%",
                      }}
                      showLineNumbers
                      lineNumberStyle={{ color: "oklch(0.5 0 0)", minWidth: "2.5em" }}
                    >
                      {editorContent}
                    </SyntaxHighlighter>
                  </div>
                  <textarea
                    value={editorContent}
                    onChange={(e) => setEditorContent(e.target.value)}
                    className="sr-only"
                    aria-hidden
                  />
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                  <div className="text-center">
                    <Code2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    Select a file from the Project Explorer
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* PREVIEW TAB */}
          <TabsContent value="preview" className="m-0 h-[calc(100vh-3.5rem-2.25rem)]">
            <div className="h-full bg-white">
              {fileIsHtml && activeFile ? (
                <iframe
                  srcDoc={activeFile.content}
                  className="w-full h-full border-0"
                  sandbox="allow-scripts"
                  title="Preview"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  Preview is available for HTML files only
                </div>
              )}
            </div>
          </TabsContent>

          {/* DOCUMENTS TAB */}
          <TabsContent value="documents" className="m-0 h-[calc(100vh-3.5rem-2.25rem)]">
            <ScrollArea className="h-full">
              <div className="p-6 max-w-3xl mx-auto">
                {activeTask?.artifacts?.filter((a: any) => a.type === "RESEARCH" || a.type === "MARKDOWN" || a.type === "DOCUMENT").length ? (
                  <>
                    <h3 className="text-lg font-semibold mb-4">Generated Documents</h3>
                    {activeTask.artifacts
                      .filter((a: any) => a.type === "RESEARCH" || a.type === "MARKDOWN" || a.type === "DOCUMENT")
                      .map((art: any) => (
                        <Card key={art.id} className="mb-4 glass-panel">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-sm">{art.name}</h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => {
                                  const blob = new Blob([art.content], { type: "text/markdown" });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement("a");
                                  a.href = url;
                                  a.download = art.name;
                                  a.click();
                                  URL.revokeObjectURL(url);
                                }}
                              >
                                <Download className="w-3 h-3 mr-1" /> Download
                              </Button>
                            </div>
                            <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed text-muted-foreground">
                              {art.content}
                            </pre>
                          </CardContent>
                        </Card>
                      ))}
                  </>
                ) : (
                  <div className="text-center py-12 text-sm text-muted-foreground">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    Generated documents and research reports will appear here
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* RESEARCH TAB */}
          <TabsContent value="research" className="m-0 h-[calc(100vh-3.5rem-2.25rem)]">
            <ScrollArea className="h-full">
              <div className="p-6 max-w-3xl mx-auto">
                {activeTask ? (
                  <>
                    <h3 className="text-lg font-semibold mb-2">Research & Sources</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      All claims are separated from AI-generated analysis. Sources cited where available.
                    </p>
                    {activeTask.artifacts?.filter((a: any) => a.type === "RESEARCH").map((art: any) => (
                      <Card key={art.id} className="mb-4 glass-panel">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Globe className="w-4 h-4" style={{ color: "var(--voice-violet)" }} />
                            <span className="font-medium text-sm">{art.name}</span>
                          </div>
                          <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed">
                            {art.content}
                          </pre>
                        </CardContent>
                      </Card>
                    )) || []}
                    {activeTask.artifacts?.filter((a: any) => a.type === "RESEARCH").length === 0 && (
                      <div className="text-center py-12 text-sm text-muted-foreground">
                        <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        Research results will appear here when the Research agent contributes
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12 text-sm text-muted-foreground">
                    <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    Select or create a task to see research results
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function EventIcon({ type, provider }: { type: string; provider?: string }) {
  const color = provider ? PROVIDERS[provider as keyof typeof PROVIDERS]?.color : "var(--voice-blue)";

  if (type === "TASK_COMPLETED" || type === "SUBTASK_COMPLETED") {
    return <Check className="w-3.5 h-3.5" style={{ color: "oklch(0.7 0.18 150)" }} />;
  }
  if (type === "TASK_FAILED") {
    return <AlertCircle className="w-3.5 h-3.5" style={{ color: "oklch(0.65 0.22 25)" }} />;
  }
  if (type === "VERIFICATION_STARTED") {
    return <Scale className="w-3.5 h-3.5" style={{ color: "oklch(0.7 0.18 150)" }} />;
  }
  if (type === "PLAN_CREATED") {
    return <Layers className="w-3.5 h-3.5" style={{ color }} />;
  }
  if (type === "AGENT_SELECTED" || type === "SUBTASK_STARTED") {
    return <Sparkles className="w-3.5 h-3.5" style={{ color }} />;
  }
  if (type === "TASK_ACCEPTED") {
    return <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color }} />;
  }
  return <Brain className="w-3.5 h-3.5" style={{ color }} />;
}

function statusColor(status: string) {
  const map: Record<string, string> = {
    QUEUED: "oklch(0.72 0.02 260)",
    PLANNING: "oklch(0.7 0.15 200)",
    RUNNING: "oklch(0.65 0.2 250)",
    VERIFYING: "oklch(0.7 0.18 150)",
    COMPLETED: "oklch(0.7 0.18 150)",
    FAILED: "oklch(0.65 0.22 25)",
    PAUSED: "oklch(0.72 0.02 260)",
    CANCELLED: "oklch(0.55 0.02 260)",
    WAITING_FOR_APPROVAL: "oklch(0.75 0.18 50)",
  };
  return map[status] || "oklch(0.72 0.02 260)";
}
