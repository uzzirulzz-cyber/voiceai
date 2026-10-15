"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Folder,
  FileText,
  FileCode2,
  FileJson,
  FileTerminal,
  FolderPlus,
  FilePlus,
  Trash2,
  Search,
  ChevronRight,
  ChevronDown,
  Clock,
  ListChecks,
  Plus,
  FileImage,
  FileType2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Project, ProjectFile, TaskSummary } from "./workspace";

interface ProjectExplorerProps {
  projects: Project[];
  activeProjectId: string | null;
  activeProject: Project | null;
  activeFileId: string | null;
  tasks: TaskSummary[];
  activeTaskId: string | null;
  onSelectProject: (id: string) => void;
  onCreateProject: (name: string, description?: string) => void;
  onSelectFile: (id: string) => void;
  onCreateFile: (path: string) => void;
  onDeleteFile: (id: string) => void;
  onSelectTask: (id: string) => void;
}

function getFileIcon(path: string) {
  const ext = path.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "ts":
    case "tsx":
    case "js":
    case "jsx":
    case "py":
    case "go":
    case "rs":
      return FileCode2;
    case "json":
      return FileJson;
    case "md":
      return FileText;
    case "sh":
    case "bash":
      return FileTerminal;
    case "html":
      return FileImage;
    case "css":
      return FileType2;
    default:
      return FileText;
  }
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
  };
  return map[status] || "oklch(0.72 0.02 260)";
}

export function ProjectExplorer({
  projects,
  activeProjectId,
  activeProject,
  activeFileId,
  tasks,
  activeTaskId,
  onSelectProject,
  onCreateProject,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  onSelectTask,
}: ProjectExplorerProps) {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set([activeProjectId || ""]));
  const [search, setSearch] = useState("");
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateFile, setShowCreateFile] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [newFilePath, setNewFilePath] = useState("");

  const toggleExpand = (id: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectProject = (id: string) => {
    onSelectProject(id);
    setExpandedProjects((prev) => new Set([...Array.from(prev), id]));
  };

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    onCreateProject(newProjectName.trim(), newProjectDesc.trim() || undefined);
    setNewProjectName("");
    setNewProjectDesc("");
    setShowCreateProject(false);
  };

  const handleCreateFile = () => {
    if (!newFilePath.trim()) return;
    onCreateFile(newFilePath.trim());
    setNewFilePath("");
    setShowCreateFile(false);
  };

  const filteredTasks = tasks.filter((t) => {
    if (!search) return true;
    return t.title.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="h-full flex flex-col bg-card/30 border-r border-border/40">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-border/40 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Projects
        </span>
        <Dialog open={showCreateProject} onOpenChange={setShowCreateProject}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Plus className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-panel-strong">
            <DialogHeader>
              <DialogTitle>Create new project</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="proj-name">Project name</Label>
                <Input
                  id="proj-name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="My awesome project"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="proj-desc">Description (optional)</Label>
                <Input
                  id="proj-desc"
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="What is this project about?"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowCreateProject(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateProject} disabled={!newProjectName.trim()}>
                Create project
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-border/40">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks…"
            className="h-8 pl-7 text-xs bg-input/50"
          />
        </div>
      </div>

      {/* Project list */}
      <ScrollArea className="flex-1">
        <div className="p-1.5 space-y-0.5">
          {projects.length === 0 && (
            <div className="text-center py-8 px-3 text-xs text-muted-foreground">
              <FolderPlus className="w-6 h-6 mx-auto mb-2 opacity-50" />
              No projects yet.
              <br />
              Click + to create one.
            </div>
          )}

          {projects.map((project) => {
            const expanded = expandedProjects.has(project.id) || project.id === activeProjectId;
            const isActive = project.id === activeProjectId;
            const projectTasks = filteredTasks.filter((t) => t.project?.id === project.id);
            const projectFiles = project.id === activeProjectId ? activeProject?.files || [] : [];

            return (
              <div key={project.id}>
                <button
                  onClick={() => {
                    handleSelectProject(project.id);
                    toggleExpand(project.id);
                  }}
                  className={cn(
                    "w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-sm hover:bg-accent/40 transition-colors",
                    isActive && "bg-accent/60"
                  )}
                >
                  {expanded ? (
                    <ChevronDown className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  )}
                  <Folder
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: isActive ? "var(--voice-blue)" : "oklch(0.75 0.13 200)" }}
                  />
                  <span className="flex-1 text-left truncate">{project.name}</span>
                  {project._count && (
                    <span className="text-[10px] text-muted-foreground">
                      {project._count.files}f
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {expanded && isActive && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden"
                    >
                      {/* Files section */}
                          <div className="pl-4 py-0.5">
                            <div className="flex items-center justify-between px-2 py-1">
                              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                Files
                              </span>
                              <Dialog open={showCreateFile} onOpenChange={setShowCreateFile}>
                                <DialogTrigger asChild>
                                  <button className="text-muted-foreground hover:text-foreground">
                                    <FilePlus className="w-3 h-3" />
                                  </button>
                                </DialogTrigger>
                                <DialogContent className="glass-panel-strong">
                                  <DialogHeader>
                                    <DialogTitle>Create new file</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-1.5 py-2">
                                    <Label htmlFor="file-path">File path</Label>
                                    <Input
                                      id="file-path"
                                      value={newFilePath}
                                      onChange={(e) => setNewFilePath(e.target.value)}
                                      placeholder="components/Button.tsx"
                                      autoFocus
                                      onKeyDown={(e) => e.key === "Enter" && handleCreateFile()}
                                    />
                                  </div>
                                  <DialogFooter>
                                    <Button variant="ghost" onClick={() => setShowCreateFile(false)}>
                                      Cancel
                                    </Button>
                                    <Button onClick={handleCreateFile} disabled={!newFilePath.trim()}>
                                      Create file
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                            {projectFiles.map((file: ProjectFile) => {
                              const Icon = getFileIcon(file.path);
                              const isActiveFile = file.id === activeFileId;
                              return (
                                <div
                                  key={file.id}
                                  className={cn(
                                    "group flex items-center gap-1.5 px-2 py-1 rounded-md text-sm hover:bg-accent/40 cursor-pointer",
                                    isActiveFile && "bg-accent/60"
                                  )}
                                  onClick={() => onSelectFile(file.id)}
                                >
                                  <Icon className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
                                  <span className="flex-1 truncate text-xs">{file.path}</span>
                                  {file.version > 1 && (
                                    <span className="text-[9px] text-muted-foreground opacity-0 group-hover:opacity-100">
                                      v{file.version}
                                    </span>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteFile(file.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              );
                            })}
                            {projectFiles.length === 0 && (
                              <div className="px-2 py-2 text-xs text-muted-foreground">No files yet.</div>
                            )}
                          </div>

                          {/* Tasks section */}
                          <div className="pl-4 py-0.5 mt-1">
                            <div className="flex items-center justify-between px-2 py-1">
                              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                Tasks
                              </span>
                              <ListChecks className="w-3 h-3 text-muted-foreground" />
                            </div>
                            {projectTasks.map((task) => (
                              <div
                                key={task.id}
                                className={cn(
                                  "group flex items-center gap-1.5 px-2 py-1 rounded-md text-sm hover:bg-accent/40 cursor-pointer",
                                  task.id === activeTaskId && "bg-accent/60"
                                )}
                                onClick={() => onSelectTask(task.id)}
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                  style={{ background: statusColor(task.status) }}
                                />
                                <span className="flex-1 truncate text-xs">{task.title}</span>
                              </div>
                            ))}
                            {projectTasks.length === 0 && (
                              <div className="px-2 py-2 text-xs text-muted-foreground">
                                No tasks yet.
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              {/* Recent tasks (no project) */}
              {filteredTasks.filter((t) => !t.project).length > 0 && (
                <div className="mt-3 pt-2 border-t border-border/40">
                  <div className="flex items-center gap-1.5 px-2 py-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Recent Tasks
                    </span>
                  </div>
                  {filteredTasks
                    .filter((t) => !t.project)
                    .slice(0, 10)
                    .map((task) => (
                      <div
                        key={task.id}
                        className={cn(
                          "group flex items-center gap-1.5 px-2 py-1 rounded-md text-sm hover:bg-accent/40 cursor-pointer",
                          task.id === activeTaskId && "bg-accent/60"
                        )}
                        onClick={() => onSelectTask(task.id)}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: statusColor(task.status) }}
                        />
                        <span className="flex-1 truncate text-xs">{task.title}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
      </ScrollArea>
    </div>
  );
}
