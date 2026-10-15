"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FileCode2,
  FileText,
  Globe,
  Download,
  Filter,
  Code2,
  FileJson,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ArtifactItem {
  id: string;
  name: string;
  path: string;
  type: string;
  language?: string;
  size: number;
  createdAt: string;
  createdBy: string;
  content: string;
  taskId: string;
  taskTitle?: string;
}

export function ArtifactsPage() {
  const [artifacts, setArtifacts] = useState<ArtifactItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [preview, setPreview] = useState<ArtifactItem | null>(null);

  useEffect(() => {
    fetch("/api/tasks/list")
      .then((r) => r.json())
      .then(async (data) => {
        const all: ArtifactItem[] = [];
        for (const task of data.tasks || []) {
          try {
            const res = await fetch(`/api/tasks/execute?id=${task.id}`);
            const d = await res.json();
            if (d.task?.artifacts) {
              for (const a of d.task.artifacts) {
                all.push({ ...a, taskId: task.id, taskTitle: task.title });
              }
            }
          } catch {}
        }
        setArtifacts(all);
        setLoading(false);
      });
  }, []);

  const filtered = artifacts.filter((a) => typeFilter === "all" || a.type === typeFilter);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 lg:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Artifacts Studio</h1>
        <p className="text-sm text-muted-foreground mt-1">{artifacts.length} artifacts generated</p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-5">
        <Filter className="w-3.5 h-3.5 text-muted-foreground" />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-2 py-1 rounded-md bg-card border border-border text-xs"
        >
          <option value="all">All types</option>
          <option value="CODE">Code</option>
          <option value="DOCUMENT">Documents</option>
          <option value="RESEARCH">Research</option>
          <option value="MARKDOWN">Markdown</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-32" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 voice-card">
          <FileCode2 className="w-10 h-10 mx-auto text-muted-foreground mb-3 opacity-50" />
          <div className="text-sm font-medium">No artifacts yet</div>
          <div className="text-xs text-muted-foreground mt-1">Run a task to generate code, documents, and research</div>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((a, i) => (
            <motion.button
              key={a.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setPreview(a)}
              className="voice-card p-4 text-left hover:scale-[1.01] transition-transform"
            >
              <div className="flex items-start gap-3 mb-2">
                <ArtifactIcon type={a.type} language={a.language} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium font-mono truncate">{a.name}</div>
                  <div className="text-[10px] text-muted-foreground">{a.type} · {a.language || "text"}</div>
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground truncate">
                {a.taskTitle}
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-2 pt-2 border-t border-border">
                <span>{(a.size / 1024).toFixed(1)} KB</span>
                <span>{new Date(a.createdAt).toLocaleDateString()}</span>
              </div>
            </motion.button>
          ))}
        </div>
      ) : (
        <div className="voice-card divide-y divide-border">
          {filtered.map((a) => (
            <button
              key={a.id}
              onClick={() => setPreview(a)}
              className="w-full flex items-center gap-3 p-3 hover:bg-accent/30 text-left"
            >
              <ArtifactIcon type={a.type} language={a.language} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-mono truncate">{a.name}</div>
                <div className="text-[10px] text-muted-foreground truncate">{a.taskTitle}</div>
              </div>
              <span className="text-[10px] text-muted-foreground hidden md:inline">{(a.size / 1024).toFixed(1)} KB</span>
            </button>
          ))}
        </div>
      )}

      {/* Preview modal */}
      {preview && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setPreview(null)}
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="voice-card-elevated rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <ArtifactIcon type={preview.type} language={preview.language} />
                <div>
                  <div className="text-sm font-mono">{preview.name}</div>
                  <div className="text-[10px] text-muted-foreground">{preview.type} · {preview.language} · {(preview.size / 1024).toFixed(1)} KB</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const blob = new Blob([preview.content], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = preview.name;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="btn-voice text-xs flex items-center gap-1"
                >
                  <Download className="w-3 h-3" /> Download
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed">{preview.content}</pre>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

function ArtifactIcon({ type, language }: { type: string; language?: string }) {
  const map: Record<string, any> = {
    CODE: Code2,
    DOCUMENT: FileText,
    RESEARCH: Globe,
    MARKDOWN: FileText,
    JSON: FileJson,
  };
  const Icon = map[type] || FileCode2;
  const colorMap: Record<string, string> = {
    CODE: "var(--warning)",
    DOCUMENT: "var(--primary)",
    RESEARCH: "var(--gold)",
    MARKDOWN: "var(--accent)",
    JSON: "var(--success)",
  };
  return (
    <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
      style={{ background: `${colorMap[type] || "var(--primary)"}20`, color: colorMap[type] || "var(--primary)" }}>
      <Icon className="w-4 h-4" />
    </div>
  );
}
