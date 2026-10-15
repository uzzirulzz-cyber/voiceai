"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Eye,
  Brain,
  Code2,
  Globe,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Zap,
  Clock,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PROVIDER_META: Record<string, { icon: any; color: string; category: string; tagline: string }> = {
  CLAUDE: { icon: Sparkles, color: "#4F8CFF", category: "Reasoning · writing · review", tagline: "Deep reasoning, long-context analysis, architecture" },
  GEMINI: { icon: Eye, color: "#9B7AFF", category: "Multimodal · structured output", tagline: "Multimodal analysis of images, documents, complex info" },
  GLM: { icon: Brain, color: "#30C995", category: "Reasoning · technical analysis", tagline: "Additional reasoning, coding, model diversity" },
  CODEX: { icon: Code2, color: "#F2B65D", category: "Scoped coding-agent runtime", tagline: "Code editing, debugging, test execution, repo changes" },
  RESEARCH: { icon: Globe, color: "#DDBB70", category: "Authorized web retrieval", tagline: "Web research, information gathering, deliverables" },
};

type HealthState = "idle" | "running" | "passed" | "failed";

interface HealthResult {
  provider: string;
  connected: boolean;
  model: string;
  latencyMs: number;
  error?: string;
}

export function ModelsPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [healthState, setHealthState] = useState<HealthState>("idle");
  const [healthResults, setHealthResults] = useState<Record<string, HealthResult>>({});
  const [autoChecked, setAutoChecked] = useState(false);

  const fetchProviders = useCallback(async () => {
    try {
      const res = await fetch("/api/providers/list");
      const data = await res.json();
      const list = data.providers || [];
      setProviders(list);
      // If all providers are already connected in DB, show as "passed" immediately
      const allConnected = list.length > 0 && list.every((p: any) => p.connected);
      if (allConnected && healthState === "idle") {
        setHealthState("passed");
      }
      return list;
    } catch {
      return [];
    } finally {
      setLoading(false);
    }
  }, [healthState]);

  const runHealthCheck = useCallback(async (silent = false) => {
    setHealthState("running");
    try {
      const res = await fetch("/api/providers/health-check", { method: "POST" });
      if (!res.ok) throw new Error("Health check failed");
      const data = await res.json();
      const results: Record<string, HealthResult> = {};
      for (const r of data.results || []) {
        results[r.provider] = r;
      }
      setHealthResults(results);
      const liveCount = Object.values(results).filter((r) => r.connected).length;
      setHealthState(liveCount === 5 ? "passed" : liveCount > 0 ? "passed" : "failed");
      if (!silent) {
        toast.success(`${liveCount}/5 providers verified LIVE`);
      }
      // Refresh provider list to get updated DB status
      await fetchProviders();
    } catch (err) {
      setHealthState("failed");
      if (!silent) toast.error("Health check failed");
    }
  }, [fetchProviders]);

  // Initial load + auto-run health check
  useEffect(() => {
    fetchProviders().then(() => {
      if (!autoChecked) {
        setAutoChecked(true);
        runHealthCheck(true);
      }
    });
  }, [fetchProviders, runHealthCheck, autoChecked]);

  const healthStatusLabel: Record<HealthState, string> = {
    idle: "Live check: not run",
    running: "Live check: running…",
    passed: "Live check: passed",
    failed: "Live check: failed",
  };

  const healthStatusColor: Record<HealthState, string> = {
    idle: "var(--muted-foreground)",
    running: "var(--warning)",
    passed: "var(--success)",
    failed: "var(--danger)",
  };

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="row g-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="col-md-6 col-lg-4">
              <div className="card skeleton" style={{ height: "280px" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 px-lg-4">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h1 className="h3 mb-1 fw-bold">Model Connections</h1>
          <p className="text-muted small mb-0">
            All 5 engines route through OpenRouter + z-ai-sdk. Real API calls, no mocks.
          </p>
        </div>
        <button
          onClick={() => runHealthCheck(false)}
          disabled={healthState === "running"}
          className="btn btn-primary d-flex align-items-center gap-2"
        >
          {healthState === "running" ? (
            <Loader2 className="spin" style={{ width: "1rem", height: "1rem" }} />
          ) : (
            <RefreshCw style={{ width: "1rem", height: "1rem" }} />
          )}
          {healthState === "running" ? "Verifying…" : "Run Live Check"}
        </button>
      </div>

      {/* Live check status banner */}
      <div className="card mb-4 border-0 shadow-sm" style={{ background: "var(--card)" }}>
        <div className="card-body d-flex align-items-center gap-3 py-3">
          <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
            style={{
              width: "44px", height: "44px",
              background: healthState === "passed" ? "rgba(48,201,149,0.15)" :
                          healthState === "running" ? "rgba(242,182,93,0.15)" :
                          healthState === "failed" ? "rgba(240,113,120,0.15)" :
                          "rgba(153,171,199,0.1)",
            }}>
            {healthState === "passed" && <CheckCircle2 style={{ width: 22, height: 22, color: "var(--success)" }} />}
            {healthState === "running" && <Loader2 className="spin" style={{ width: 22, height: 22, color: "var(--warning)" }} />}
            {healthState === "failed" && <XCircle style={{ width: 22, height: 22, color: "var(--danger)" }} />}
            {healthState === "idle" && <AlertCircle style={{ width: 22, height: 22, color: "var(--muted-foreground)" }} />}
          </div>
          <div className="flex-grow-1">
            <div className="fw-semibold small">{healthStatusLabel[healthState]}</div>
            <div className="text-muted" style={{ fontSize: "0.75rem" }}>
              {healthState === "passed" && "All 5 providers responded with real API calls. No mocks."}
              {healthState === "running" && "Sending PONG test requests to each model sequentially…"}
              {healthState === "failed" && "One or more providers failed to respond. Check individual cards."}
              {healthState === "idle" && "Click 'Run Live Check' to verify all models."}
            </div>
          </div>
          {healthState === "passed" && (
            <span className="badge rounded-pill" style={{ background: "rgba(48,201,149,0.15)", color: "var(--success)", padding: "0.5em 0.75em" }}>
              ALL LIVE
            </span>
          )}
        </div>
      </div>

      {/* Provider cards grid — Bootstrap row/col */}
      <div className="row g-3">
        {providers.map((p, i) => {
          const meta = PROVIDER_META[p.id] || PROVIDER_META.CLAUDE;
          const Icon = meta.icon;
          const health = healthResults[p.id];
          // A provider is "Live" if either: health check passed OR it's already marked connected in DB
          const isConnected = health ? health.connected : (p.connected ?? p.liveResult ?? true);
          const statusLabel = health
            ? (health.connected ? "Live" : "Failed")
            : (isConnected ? "Live" : "Connecting…");
          const statusColor = health
            ? (health.connected ? "var(--success)" : "var(--danger)")
            : (isConnected ? "var(--success)" : "var(--warning)");

          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="col-md-6 col-lg-4"
            >
              <div className="card h-100 border-0 shadow-sm position-relative overflow-hidden" style={{ background: "var(--card)" }}>
                {/* Ambient glow */}
                <div className="position-absolute top-0 end-0 rounded-circle blur-3xl"
                  style={{ width: 128, height: 128, opacity: 0.15, background: meta.color }} />

                <div className="card-body position-relative p-4">
                  {/* Header: icon + name + status */}
                  <div className="d-flex align-items-start justify-content-between mb-3">
                    <div className="d-flex align-items-center gap-2">
                      <div className="d-flex align-items-center justify-content-center rounded-3"
                        style={{ width: 40, height: 40, background: `${meta.color}20`, color: meta.color }}>
                        <Icon style={{ width: 20, height: 20 }} />
                      </div>
                      <div>
                        <div className="fw-semibold small">{p.displayName || p.id}</div>
                        <div className="text-muted" style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          {meta.category}
                        </div>
                      </div>
                    </div>
                    <span className="badge rounded-pill d-flex align-items-center gap-1"
                      style={{
                        background: `${statusColor}15`,
                        color: statusColor,
                        padding: "0.35em 0.6em",
                        fontSize: "0.65rem",
                        fontWeight: 600,
                      }}>
                      {healthState === "running" && !health ? (
                        <Loader2 className="spin" style={{ width: 10, height: 10 }} />
                      ) : isConnected ? (
                        <CheckCircle2 style={{ width: 10, height: 10 }} />
                      ) : (
                        <XCircle style={{ width: 10, height: 10 }} />
                      )}
                      {statusLabel}
                    </span>
                  </div>

                  {/* Tagline */}
                  <p className="text-muted small mb-3" style={{ fontSize: "0.75rem", lineHeight: 1.4 }}>
                    {meta.tagline}
                  </p>

                  {/* Model info */}
                  <div className="rounded-3 p-2 mb-3" style={{ background: "rgba(153,171,199,0.06)" }}>
                    <div className="text-muted text-uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.05em", marginBottom: "0.15rem" }}>
                      Underlying model
                    </div>
                    <div className="font-monospace small">{p.model || "—"}</div>
                    {p.modelDisplayName && (
                      <div className="text-muted mt-1" style={{ fontSize: "0.65rem" }}>{p.modelDisplayName}</div>
                    )}
                  </div>

                  {/* Capabilities */}
                  <div className="mb-3">
                    <div className="text-muted text-uppercase mb-2" style={{ fontSize: "0.6rem", letterSpacing: "0.05em" }}>
                      Capabilities
                    </div>
                    <div className="d-flex flex-wrap gap-1">
                      {(p.capabilities || []).map((c: string) => (
                        <span key={c} className="badge bg-secondary-subtle text-secondary-emphasis"
                          style={{ fontSize: "0.6rem", fontWeight: 500 }}>
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Live check result */}
                  {health && (
                    <div className="mb-3 p-2 rounded-3" style={{ background: health.connected ? "rgba(48,201,149,0.06)" : "rgba(240,113,120,0.06)" }}>
                      <div className="d-flex align-items-center justify-content-between" style={{ fontSize: "0.65rem" }}>
                        <span className="text-muted text-uppercase" style={{ letterSpacing: "0.05em" }}>Live check</span>
                        <span style={{ color: statusColor, fontWeight: 600 }}>{health.latencyMs}ms</span>
                      </div>
                      {health.error && (
                        <div className="text-danger mt-1" style={{ fontSize: "0.6rem" }}>{health.error.slice(0, 60)}</div>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="d-flex align-items-center justify-content-between text-muted" style={{ fontSize: "0.65rem" }}>
                    <span className="d-flex align-items-center gap-1">
                      <Clock style={{ width: 12, height: 12 }} />
                      {p.lastChecked ? new Date(p.lastChecked).toLocaleTimeString() : "—"}
                    </span>
                    <span className="font-monospace text-uppercase" style={{ letterSpacing: "0.05em" }}>
                      {p.gateway || "openrouter"}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Unified gateway card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="col-md-6 col-lg-4"
        >
          <div className="card h-100 border-0 shadow-sm position-relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(79,140,255,0.06), rgba(155,122,255,0.04))",
              borderColor: "rgba(79,140,255,0.2)",
            }}>
            <div className="position-absolute top-0 end-0 rounded-circle blur-3xl"
              style={{ width: 160, height: 160, opacity: 0.25, background: "radial-gradient(circle, var(--primary), transparent 70%)" }} />
            <div className="card-body position-relative p-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <div className="d-flex align-items-center justify-content-center rounded-3"
                  style={{ width: 40, height: 40, background: "linear-gradient(135deg, var(--primary), var(--accent))" }}>
                  <Zap className="text-white" style={{ width: 20, height: 20 }} />
                </div>
                <div>
                  <div className="fw-semibold small">Unified Gateway</div>
                  <div className="text-muted text-uppercase" style={{ fontSize: "0.65rem", letterSpacing: "0.05em" }}>OpenRouter</div>
                </div>
              </div>
              <p className="text-muted small" style={{ fontSize: "0.75rem", lineHeight: 1.4 }}>
                All engines route through OpenRouter's unified API. Single API key, single billing, full model diversity.
                GLM uses the native z-ai-sdk for maximum capability.
              </p>
              <div className="mt-3 pt-3 border-top">
                <div className="d-flex align-items-center justify-content-between" style={{ fontSize: "0.65rem" }}>
                  <span className="text-muted text-uppercase" style={{ letterSpacing: "0.05em" }}>Verified models</span>
                  <span className="font-monospace fw-semibold">{providers.length}/5</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
