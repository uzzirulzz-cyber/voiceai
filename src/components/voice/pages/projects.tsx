"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderKanban,
  Plus,
  Search,
  Grid3x3,
  List,
  MoreVertical,
  Trash2,
  Archive,
  FileCode2,
  Clock,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ProjectItem {
  id: string;
  name: string;
  description: string | null;
  status: string;
  updatedAt: string;
  createdAt: string;
  _count?: { files: number; tasks: number };
}

export function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  useEffect(() => {
    refresh();
  }, []);

  const refresh = () => {
    setLoading(true);
    fetch("/api/projects/list")
      .then((r) => r.json())
      .then((d) => {
        setProjects(d.projects || []);
        setLoading(false);
      });
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const res = await fetch("/api/projects/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, description: newDesc }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Project created");
      setNewName("");
      setNewDesc("");
      setShowCreate(false);
      refresh();
    } catch {
      toast.error("Failed to create project");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this project?")) return;
    try {
      await fetch(`/api/projects/detail?id=${id}`, { method: "DELETE" });
      toast.success("Project deleted");
      refresh();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const filtered = projects.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && p.status !== statusFilter.toUpperCase()) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 lg:py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">{projects.length} projects · {projects.reduce((acc, p) => acc + (p._count?.tasks || 0), 0)} tasks</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-voice flex items-center gap-1.5 text-xs">
          <Plus className="w-3.5 h-3.5" /> New Project
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects…"
            className="w-full pl-7 pr-3 py-1.5 rounded-md bg-card border border-border text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-2 py-1.5 rounded-md bg-card border border-border text-xs"
        >
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
        <div className="flex items-center bg-card border border-border rounded-md p-0.5">
          <button
            onClick={() => setView("grid")}
            className={cn("p-1.5 rounded", view === "grid" ? "bg-accent" : "text-muted-foreground")}
          >
            <Grid3x3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setView("list")}
            className={cn("p-1.5 rounded", view === "list" ? "bg-accent" : "text-muted-foreground")}
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Projects */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-40" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 voice-card">
          <FolderKanban className="w-10 h-10 mx-auto text-muted-foreground mb-3 opacity-50" />
          <div className="text-sm font-medium">No projects yet</div>
          <div className="text-xs text-muted-foreground mt-1 mb-4">Create your first project to organize AI tasks</div>
          <button onClick={() => setShowCreate(true)} className="btn-voice text-xs">
            <Plus className="w-3 h-3 inline mr-1" /> New Project
          </button>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="voice-card p-4 group"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(79,140,255,0.15)", color: "var(--primary)" }}>
                  <FolderKanban className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{p.name}</div>
                  <div className="text-[10px] text-muted-foreground">{p.status}</div>
                </div>
                <ProjectMenu project={p} onDelete={() => handleDelete(p.id)} />
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3 min-h-[2rem]">
                {p.description || "No description"}
              </p>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-3 border-t border-border">
                <span className="flex items-center gap-1">
                  <FileCode2 className="w-3 h-3" />
                  {p._count?.files || 0} files · {p._count?.tasks || 0} tasks
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {timeAgo(p.updatedAt)}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="voice-card divide-y divide-border">
          {filtered.map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-3 hover:bg-accent/30 transition-colors">
              <FolderKanban className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{p.name}</div>
                <div className="text-[10px] text-muted-foreground truncate">{p.description || "No description"}</div>
              </div>
              <span className="text-[10px] text-muted-foreground hidden md:inline">
                {p._count?.files || 0}f · {p._count?.tasks || 0}t
              </span>
              <span className="text-[10px] text-muted-foreground">{timeAgo(p.updatedAt)}</span>
              <ProjectMenu project={p} onDelete={() => handleDelete(p.id)} />
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCreate(false)}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="voice-card-elevated rounded-2xl p-5 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold">Create new project</h3>
                <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Name</label>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="My awesome project"
                    autoFocus
                    className="w-full mt-1 px-3 py-2 rounded-md bg-input border border-border text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Description (optional)</label>
                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="What is this project about?"
                    rows={3}
                    className="w-full mt-1 px-3 py-2 rounded-md bg-input border border-border text-sm resize-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 rounded-md text-xs hover:bg-accent">
                  Cancel
                </button>
                <button onClick={handleCreate} disabled={!newName.trim()} className="btn-voice text-xs">
                  Create
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProjectMenu({ project, onDelete }: { project: ProjectItem; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
      >
        <MoreVertical className="w-3.5 h-3.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 voice-card-elevated rounded-lg p-1 z-50 w-40">
            <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent text-xs text-left">
              <Archive className="w-3.5 h-3.5" /> Archive
            </button>
            <button
              onClick={() => { onDelete(); setOpen(false); }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent text-xs text-left text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </>
      )}
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
