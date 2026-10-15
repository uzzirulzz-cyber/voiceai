"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  LogOut,
  Shield,
  Settings,
  User as UserIcon,
  ChevronDown,
  PanelLeft,
  PanelRight,
  Activity,
  Menu,
} from "lucide-react";
import { VoiceWordmark } from "./logo";
import { ProjectExplorer } from "./project-explorer";
import { WorkArea } from "./work-area";
import { FusionPanel } from "./fusion-panel";
import { toast } from "sonner";

interface WorkspaceProps {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: "SUPER_ADMIN" | "ADMIN" | "USER";
    status: string;
  };
  onLogout: () => void;
  onNavigate: (target: "workspace" | "admin" | "landing" | "auth") => void;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  files?: ProjectFile[];
  tasks?: TaskSummary[];
  createdAt: string;
  updatedAt: string;
  _count?: { files: number; tasks: number };
}

export interface ProjectFile {
  id: string;
  path: string;
  content: string;
  language: string | null;
  version: number;
  updatedAt: string;
}

export interface TaskSummary {
  id: string;
  title: string;
  status: string;
  workMode: string;
  createdAt: string;
  project?: { id: string; name: string } | null;
}

export interface ActiveTask {
  id: string;
  title: string;
  description: string;
  status: string;
  workMode: string;
  plan: any[];
  events: any[];
  artifacts: any[];
  verification: any;
  usedTokens: number;
  budgetTokens: number;
  estimatedCost: number;
  updatedAt: string;
}

export function Workspace({ user, onLogout, onNavigate }: WorkspaceProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<ActiveTask | null>(null);
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [showLeft, setShowLeft] = useState(true);
  const [showRight, setShowRight] = useState(true);
  const [mobilePanel, setMobilePanel] = useState<"explorer" | "work" | "fusion" | null>("work");
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects/list");
      const data = await res.json();
      if (data.projects) {
        setProjects(data.projects);
        // Auto-select first project if none selected
        if (data.projects.length > 0 && !activeProjectId) {
          setActiveProjectId(data.projects[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    }
  }, [activeProjectId]);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks/list");
      const data = await res.json();
      if (data.tasks) {
        setTasks(data.tasks);
      }
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    }
  }, []);

  // Fetch active project detail
  const fetchProjectDetail = useCallback(async () => {
    if (!activeProjectId) return;
    try {
      const res = await fetch(`/api/projects/detail?id=${activeProjectId}`);
      const data = await res.json();
      if (data.project) {
        setActiveProject(data.project);
        // Auto-select first file if none selected
        if (data.project.files && data.project.files.length > 0 && !activeFileId) {
          setActiveFileId(data.project.files[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch project:", err);
    }
  }, [activeProjectId, activeFileId]);

  // Fetch active task state
  const fetchTaskState = useCallback(async () => {
    if (!activeTaskId) return;
    try {
      const res = await fetch(`/api/tasks/execute?id=${activeTaskId}`);
      const data = await res.json();
      if (data.task) {
        setActiveTask(data.task);
        // Continue polling if task is still running
        const stillRunning = ["PLANNING", "RUNNING", "VERIFYING"].includes(data.task.status);
        if (!stillRunning && pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      }
    } catch (err) {
      console.error("Failed to fetch task state:", err);
    }
  }, [activeTaskId]);

  useEffect(() => {
    fetchProjects();
    fetchTasks();
  }, [fetchProjects, fetchTasks]);

  useEffect(() => {
    fetchProjectDetail();
  }, [fetchProjectDetail]);

  // Poll task state when running
  useEffect(() => {
    if (!activeTaskId) {
      setActiveTask(null);
      return;
    }

    // Initial fetch
    fetchTaskState();

    // Determine if we need to poll
    if (activeTask && ["PLANNING", "RUNNING", "VERIFYING"].includes(activeTask.status)) {
      if (!pollingRef.current) {
        pollingRef.current = setInterval(fetchTaskState, 1500);
      }
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [activeTaskId, activeTask?.status, fetchTaskState]);

  const handleSelectProject = (projectId: string) => {
    setActiveProjectId(projectId);
    setActiveFileId(null);
  };

  const handleCreateProject = async (name: string, description?: string) => {
    try {
      const res = await fetch("/api/projects/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Project created");
      await fetchProjects();
      setActiveProjectId(data.project.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create project");
    }
  };

  const handleSelectTask = (taskId: string) => {
    setActiveTaskId(taskId);
    setMobilePanel("fusion");
  };

  const handleCreateTask = async (taskData: { title: string; description: string; workMode: string }) => {
    try {
      const res = await fetch("/api/tasks/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...taskData, projectId: activeProjectId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Start execution immediately
      await fetch("/api/tasks/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: data.task.id }),
      });

      setActiveTaskId(data.task.id);
      await fetchTasks();
      toast.success("Task queued — execution started");
      setMobilePanel("fusion");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create task");
    }
  };

  const handleSaveFile = async (fileId: string, content: string) => {
    try {
      const res = await fetch("/api/files/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId, content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("File saved");
      await fetchProjectDetail();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  };

  const handleCreateFile = async (path: string) => {
    if (!activeProjectId) return;
    try {
      const res = await fetch("/api/files/save", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: activeProjectId, path, content: "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Created ${path}`);
      await fetchProjectDetail();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      const res = await fetch(`/api/files/save?id=${fileId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("File deleted");
      if (activeFileId === fileId) setActiveFileId(null);
      await fetchProjectDetail();
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const handleRetryTask = async (taskId: string) => {
    try {
      await fetch("/api/tasks/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });
      toast.success("Task re-queued");
    } catch (err) {
      toast.error("Retry failed");
    }
  };

  const handleCancelTask = async (taskId: string) => {
    try {
      await fetch("/api/tasks/detail", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, status: "CANCELLED" }),
      });
      toast.success("Task cancelled");
      await fetchTaskState();
      await fetchTasks();
    } catch (err) {
      toast.error("Cancel failed");
    }
  };

  const activeFile = activeProject?.files?.find((f) => f.id === activeFileId) || null;

  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="flex-shrink-0 h-14 border-b border-border/40 bg-background/60 backdrop-blur-md flex items-center justify-between px-4 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate("landing")}
            className="md:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
          <VoiceWordmark size={32} />
        </div>

        <div className="flex items-center gap-2">
          {/* Panel toggles */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowLeft(!showLeft);
              setMobilePanel(showLeft ? "work" : "explorer");
            }}
            className="hidden md:flex"
          >
            <PanelLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowRight(!showRight);
              setMobilePanel(showRight ? "work" : "fusion");
            }}
            className="hidden md:flex"
          >
            <PanelRight className="w-4 h-4" />
          </Button>

          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate("admin")}
              className="hidden md:flex"
            >
              <Shield className="w-4 h-4 mr-1.5" />
              Admin
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Avatar className="w-7 h-7">
                  <AvatarFallback className="text-xs" style={{ background: "var(--voice-blue)", color: "white" }}>
                    {(user.name || user.email)[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-sm max-w-[120px] truncate">
                  {user.name || user.email}
                </span>
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{user.name || "User"}</span>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5">
                <Badge variant="outline" className="text-[10px]">
                  {user.role}
                </Badge>
              </div>
              <DropdownMenuSeparator />
              {isAdmin && (
                <DropdownMenuItem onClick={() => onNavigate("admin")}>
                  <Shield className="w-4 h-4 mr-2" /> Admin Panel
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => toast.info("Profile settings coming soon")}>
                <Settings className="w-4 h-4 mr-2" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile panel switcher */}
      <div className="md:hidden flex border-b border-border/40 bg-card/30">
        {[
          { key: "explorer", label: "Files", icon: PanelLeft },
          { key: "work", label: "Work", icon: UserIcon },
          { key: "fusion", label: "Fusion", icon: Activity },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setMobilePanel(tab.key as any)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium ${
              mobilePanel === tab.key
                ? "text-foreground border-b-2 border-primary"
                : "text-muted-foreground"
            }`}
            style={mobilePanel === tab.key ? { borderBottomColor: "var(--voice-blue)" } : {}}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3-panel workspace */}
      <div className="flex-1 overflow-hidden">
        {/* Desktop: resizable panels */}
        <div className="hidden md:flex h-full">
          <ResizablePanelGroup direction="horizontal">
            {showLeft && (
              <>
                <ResizablePanel defaultSize={20} minSize={15} maxSize={35}>
                  <ProjectExplorer
                    projects={projects}
                    activeProjectId={activeProjectId}
                    activeProject={activeProject}
                    activeFileId={activeFileId}
                    tasks={tasks}
                    activeTaskId={activeTaskId}
                    onSelectProject={handleSelectProject}
                    onCreateProject={handleCreateProject}
                    onSelectFile={setActiveFileId}
                    onCreateFile={handleCreateFile}
                    onDeleteFile={handleDeleteFile}
                    onSelectTask={handleSelectTask}
                  />
                </ResizablePanel>
                <ResizableHandle />
              </>
            )}

            <ResizablePanel defaultSize={50} minSize={30}>
              <WorkArea
                activeProject={activeProject}
                activeFile={activeFile}
                activeTask={activeTask}
                tasks={tasks}
                onSaveFile={handleSaveFile}
                onCreateTask={handleCreateTask}
                onSelectTask={handleSelectTask}
              />
            </ResizablePanel>

            {showRight && (
              <>
                <ResizableHandle />
                <ResizablePanel defaultSize={30} minSize={20} maxSize={45}>
                  <FusionPanel
                    activeTask={activeTask}
                    onRetry={handleRetryTask}
                    onCancel={handleCancelTask}
                  />
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>

        {/* Mobile: single panel at a time */}
        <div className="md:hidden h-full">
          {mobilePanel === "explorer" && (
            <ProjectExplorer
              projects={projects}
              activeProjectId={activeProjectId}
              activeProject={activeProject}
              activeFileId={activeFileId}
              tasks={tasks}
              activeTaskId={activeTaskId}
              onSelectProject={handleSelectProject}
              onCreateProject={handleCreateProject}
              onSelectFile={(id) => {
                setActiveFileId(id);
                setMobilePanel("work");
              }}
              onCreateFile={handleCreateFile}
              onDeleteFile={handleDeleteFile}
              onSelectTask={(id) => {
                handleSelectTask(id);
              }}
            />
          )}
          {mobilePanel === "work" && (
            <WorkArea
              activeProject={activeProject}
              activeFile={activeFile}
              activeTask={activeTask}
              tasks={tasks}
              onSaveFile={handleSaveFile}
              onCreateTask={handleCreateTask}
              onSelectTask={handleSelectTask}
            />
          )}
          {mobilePanel === "fusion" && (
            <FusionPanel
              activeTask={activeTask}
              onRetry={handleRetryTask}
              onCancel={handleCancelTask}
            />
          )}
        </div>
      </div>
    </div>
  );
}
