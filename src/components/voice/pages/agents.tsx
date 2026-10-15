"use client";

import { motion } from "framer-motion";
import {
  Bot,
  Code2,
  Search,
  Palette,
  TestTube,
  GitBranch,
  Sparkles,
  Activity,
  Clock,
  CheckCircle2,
} from "lucide-react";

interface AgentDef {
  id: string;
  name: string;
  description: string;
  role: string;
  provider: string;
  capabilities: string[];
  permissions: string[];
  status: "template" | "ready";
  icon: any;
  color: string;
}

const AGENTS: AgentDef[] = [
  {
    id: "coding",
    name: "Coding Agent",
    description: "Implements code changes, edits files, debugs, runs permitted tests in the authorized workspace.",
    role: "Code Generation & Editing",
    provider: "CODEX",
    capabilities: ["Code Editing", "Repository Changes", "Debugging", "Test Execution"],
    permissions: ["Read project files", "Write to authorized paths", "Run tests in sandbox"],
    status: "ready",
    icon: Code2,
    color: "#F2B65D",
  },
  {
    id: "research",
    name: "Research Agent",
    description: "Gathers relevant evidence from the web, summarizes findings with sources, recommends actions.",
    role: "Web Research & Information Synthesis",
    provider: "RESEARCH",
    capabilities: ["Web Search", "Source Verification", "Information Synthesis", "Task Planning"],
    permissions: ["Read public web sources", "Write research summaries"],
    status: "ready",
    icon: Search,
    color: "#DDBB70",
  },
  {
    id: "design",
    name: "Design Agent",
    description: "Plans UI/UX structure, suggests component layouts, generates visual concepts for deliverables.",
    role: "Design Planning & Visual Concept",
    provider: "GEMINI",
    capabilities: ["Multimodal Analysis", "Layout Planning", "Component Design", "Document Understanding"],
    permissions: ["Read design references", "Suggest visual concepts"],
    status: "template",
    icon: Palette,
    color: "#9B7AFF",
  },
  {
    id: "testing",
    name: "Testing Agent",
    description: "Verifies that completed work meets acceptance criteria. Runs test suites and reports failures.",
    role: "Verification & Quality Assurance",
    provider: "CLAUDE",
    capabilities: ["Acceptance Testing", "Output Verification", "Failure Diagnosis", "Regression Checks"],
    permissions: ["Read task acceptance criteria", "Run permitted tests", "Report verification results"],
    status: "ready",
    icon: TestTube,
    color: "#4F8CFF",
  },
  {
    id: "review",
    name: "Review Agent",
    description: "Independent technical review of completed work. Catches errors, suggests improvements.",
    role: "Technical Review & Analysis",
    provider: "GLM",
    capabilities: ["Code Review", "Architecture Analysis", "Risk Assessment", "Alternative Solutions"],
    permissions: ["Read completed work", "Suggest corrections", "Provide independent analysis"],
    status: "ready",
    icon: GitBranch,
    color: "#30C995",
  },
];

export function AgentsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 lg:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Agent Studio</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pre-defined agent templates — each maps to a live AI engine via OpenRouter.
        </p>
      </div>

      {/* Banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="voice-card p-4 mb-6 flex items-center gap-3"
        style={{ background: "linear-gradient(135deg, rgba(79,140,255,0.06), rgba(155,122,255,0.04))" }}
      >
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}>
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold">5 Agent Templates Ready</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Each agent is backed by a real, verified AI engine. Submit a task from AI Workspace to invoke them.
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {AGENTS.map((agent, i) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="voice-card p-5"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: `${agent.color}20`, color: agent.color }}>
                  <agent.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{agent.name}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{agent.role}</div>
                </div>
              </div>
              <span className={`status-pill ${agent.status === "ready" ? "status-pill-live" : ""}`}
                style={agent.status === "template" ? { background: "rgba(242,182,93,0.15)", color: "var(--warning)", border: "1px solid rgba(242,182,93,0.3)" } : {}}>
                {agent.status === "ready" ? "READY" : "TEMPLATE"}
              </span>
            </div>

            {/* Description */}
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{agent.description}</p>

            {/* Assigned provider */}
            <div className="bg-card/40 rounded-md p-2.5 mb-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Assigned provider</div>
              <div className="flex items-center gap-2">
                <div className={`engine-dot engine-${agent.provider}`} />
                <span className="text-xs font-medium">{agent.provider}</span>
                <span className="text-[10px] text-muted-foreground">· Live</span>
              </div>
            </div>

            {/* Capabilities */}
            <div className="mb-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Capabilities</div>
              <div className="flex flex-wrap gap-1">
                {agent.capabilities.map((c) => (
                  <span key={c} className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted/50 text-muted-foreground">
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {/* Permissions */}
            <div className="pt-3 border-t border-border">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Permissions</div>
              <div className="space-y-0.5">
                {agent.permissions.map((p) => (
                  <div key={p} className="text-[10px] text-muted-foreground flex items-start gap-1.5">
                    <CheckCircle2 className="w-2.5 h-2.5 flex-shrink-0 mt-0.5" style={{ color: "var(--success)" }} />
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
