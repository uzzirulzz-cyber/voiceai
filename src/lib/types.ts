// Voice AI - Core Types
// Five-engine AI workspace type definitions

export type Provider = "CLAUDE" | "GEMINI" | "GLM" | "CODEX" | "RESEARCH";

export type TaskStatus =
  | "QUEUED"
  | "PLANNING"
  | "RUNNING"
  | "WAITING_FOR_APPROVAL"
  | "VERIFYING"
  | "COMPLETED"
  | "FAILED"
  | "PAUSED"
  | "CANCELLED";

export type WorkMode = "FAST" | "BALANCED" | "DEEP";

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "USER";

export interface ProviderInfo {
  id: Provider;
  name: string;
  displayName: string;
  description: string;
  capabilities: string[];
  color: string;
  icon: string;
  connected: boolean;
  enabled: boolean;
  modelCount: number;
}

export interface TaskEvent {
  id: string;
  taskId: string;
  type:
    | "TASK_ACCEPTED"
    | "PLAN_CREATED"
    | "SUBTASK_STARTED"
    | "AGENT_SELECTED"
    | "TOOL_INVOKED"
    | "TOOL_RESULT"
    | "SUBTASK_COMPLETED"
    | "VERIFICATION_STARTED"
    | "CORRECTION_REQUESTED"
    | "ARTIFACT_CREATED"
    | "TASK_COMPLETED"
    | "TASK_FAILED"
    | "PROGRESS";
  message: string;
  provider?: Provider;
  subtaskIdx?: number;
  subtaskTitle?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface Subtask {
  idx: number;
  title: string;
  description: string;
  provider: Provider;
  capability: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "SKIPPED";
  dependsOn?: number[];
  result?: string;
  artifacts?: string[];
  startedAt?: string;
  completedAt?: string;
  tokensUsed?: number;
  error?: string;
}

export interface Artifact {
  id: string;
  name: string;
  path: string;
  language?: string;
  type: "CODE" | "DOCUMENT" | "RESEARCH" | "MARKDOWN" | "JSON" | "OTHER";
  content: string;
  size: number;
  createdAt: string;
  createdBy: Provider;
  version: number;
}

export interface VerificationResult {
  passed: boolean;
  checks: VerificationCheck[];
  summary: string;
  correctionsNeeded?: string[];
}

export interface VerificationCheck {
  name: string;
  description: string;
  passed: boolean;
  details?: string;
}

export interface TaskPlan {
  subtasks: Subtask[];
  acceptanceCriteria: string[];
  estimatedTokens: number;
  estimatedDuration: string;
}

export const PROVIDERS: Record<Provider, ProviderInfo> = {
  CLAUDE: {
    id: "CLAUDE",
    name: "CLAUDE",
    displayName: "Claude",
    description: "Deep reasoning, long-context analysis, writing, architecture, and code review.",
    capabilities: ["Reasoning", "Long-context", "Writing", "Architecture", "Code Review"],
    color: "oklch(0.75 0.18 50)",
    icon: "sparkles",
    connected: true,
    enabled: true,
    modelCount: 3,
  },
  GEMINI: {
    id: "GEMINI",
    name: "GEMINI",
    displayName: "Gemini",
    description: "Multimodal analysis of images, documents, audio, video, and complex information.",
    capabilities: ["Multimodal", "Documents", "Vision", "Structured Output", "Tool Calling"],
    color: "oklch(0.7 0.15 200)",
    icon: "eye",
    connected: true,
    enabled: true,
    modelCount: 4,
  },
  GLM: {
    id: "GLM",
    name: "GLM",
    displayName: "GLM",
    description: "Additional reasoning, coding, and model diversity with strong problem-solving.",
    capabilities: ["Reasoning", "Coding", "Problem-solving", "Analysis"],
    color: "oklch(0.65 0.2 250)",
    icon: "brain",
    connected: true,
    enabled: true,
    modelCount: 5,
  },
  CODEX: {
    id: "CODEX",
    name: "CODEX",
    displayName: "Codex",
    description: "Delegated coding tasks, repository changes, debugging, test execution, and software engineering.",
    capabilities: ["Code Editing", "Repository Changes", "Debugging", "Test Execution", "Software Engineering"],
    color: "oklch(0.7 0.18 150)",
    icon: "code",
    connected: true,
    enabled: true,
    modelCount: 2,
  },
  RESEARCH: {
    id: "RESEARCH",
    name: "RESEARCH",
    displayName: "Research",
    description: "Web research, information gathering, task planning, and finished deliverables.",
    capabilities: ["Web Search", "Information Gathering", "Task Planning", "Deliverables"],
    color: "oklch(0.65 0.22 290)",
    icon: "globe",
    connected: true,
    enabled: true,
    modelCount: 1,
  },
};

export const TASK_STATUS_META: Record<TaskStatus, { color: string; label: string; description: string }> = {
  QUEUED: { color: "oklch(0.72 0.02 260)", label: "Queued", description: "Task accepted, waiting to start" },
  PLANNING: { color: "oklch(0.7 0.15 200)", label: "Planning", description: "Creating task graph and acceptance criteria" },
  RUNNING: { color: "oklch(0.65 0.2 250)", label: "Running", description: "Executing subtasks in parallel" },
  WAITING_FOR_APPROVAL: { color: "oklch(0.75 0.18 50)", label: "Awaiting Approval", description: "Paused for user confirmation" },
  VERIFYING: { color: "oklch(0.7 0.18 150)", label: "Verifying", description: "Checking outputs against acceptance criteria" },
  COMPLETED: { color: "oklch(0.7 0.18 150)", label: "Completed", description: "Task finished successfully" },
  FAILED: { color: "oklch(0.65 0.22 25)", label: "Failed", description: "Task failed verification or execution" },
  PAUSED: { color: "oklch(0.72 0.02 260)", label: "Paused", description: "Task paused by user" },
  CANCELLED: { color: "oklch(0.55 0.02 260)", label: "Cancelled", description: "Task cancelled by user" },
};

export const WORK_MODES: Record<WorkMode, { label: string; description: string; icon: string }> = {
  FAST: { label: "Fast", description: "Quick routing, fewer agents, faster results", icon: "zap" },
  BALANCED: { label: "Balanced", description: "Optimal mix of speed and depth", icon: "scale" },
  DEEP: { label: "Deep", description: "Maximum agents, thorough verification", icon: "layers" },
};
