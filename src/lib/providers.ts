// Voice AI — Unified AI Provider Client
// All 5 engines route through OpenRouter (Claude/Gemini/Codex/Research) and z-ai-sdk (GLM).
// No mocks, no simulated responses — every call hits a real API.

import ZAI from "z-ai-web-dev-sdk";
import { db } from "./db";
import { PROVIDERS, type Provider } from "./types";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";

// Model routing — synced with openrouter.ts ENGINE_MODELS to ensure consistency
import { ENGINE_MODELS, chatCompletion } from "./openrouter";
const MODEL_MAP: Record<Provider, string> = {
  CLAUDE: ENGINE_MODELS.CLAUDE.model,
  GEMINI: ENGINE_MODELS.GEMINI.model,
  GLM: ENGINE_MODELS.GLM.model,
  CODEX: ENGINE_MODELS.CODEX.model,
  RESEARCH: ENGINE_MODELS.RESEARCH.model,
};

export interface ProviderCallResult {
  content: string;
  model: string;
  provider: Provider;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
  cost: number;
  success: boolean;
  error?: string;
}

export interface ProviderCallOptions {
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  userId: string;
  taskId?: string;
}

// ============================================================================
// OpenRouter client (used for Claude / Gemini / Codex / Research)
// ============================================================================

async function callOpenRouter(
  provider: Provider,
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  options: ProviderCallOptions
): Promise<ProviderCallResult> {
  const startTime = Date.now();
  const model = MODEL_MAP[provider];

  if (!OPENROUTER_API_KEY) {
    return {
      content: "",
      model,
      provider,
      inputTokens: 0,
      outputTokens: 0,
      durationMs: 0,
      cost: 0,
      success: false,
      error: "OPENROUTER_API_KEY not configured",
    };
  }

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://voiceai.playbeat.live",
        "X-Title": "Voice AI — Five-Engine Workspace",
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: options.maxTokens || 800,
        temperature: options.temperature ?? 0.7,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return {
        content: "",
        model,
        provider,
        inputTokens: 0,
        outputTokens: 0,
        durationMs: Date.now() - startTime,
        cost: 0,
        success: false,
        error: `OpenRouter ${response.status}: ${errorBody.slice(0, 200)}`,
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const usage = data.usage || {};

    const result: ProviderCallResult = {
      content,
      model: data.model || model,
      provider,
      inputTokens: usage.prompt_tokens || 0,
      outputTokens: usage.completion_tokens || 0,
      durationMs: Date.now() - startTime,
      cost: calculateCost(provider, usage.prompt_tokens || 0, usage.completion_tokens || 0),
      success: true,
    };

    // Record usage in DB
    await recordUsage(provider, result, options);

    return result;
  } catch (err) {
    return {
      content: "",
      model,
      provider,
      inputTokens: 0,
      outputTokens: 0,
      durationMs: Date.now() - startTime,
      cost: 0,
      success: false,
      error: err instanceof Error ? err.message : "Unknown OpenRouter error",
    };
  }
}

// ============================================================================
// GLM client (uses z-ai-web-dev-sdk directly)
// ============================================================================

async function callGLM(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  options: ProviderCallOptions
): Promise<ProviderCallResult> {
  const startTime = Date.now();
  const model = MODEL_MAP.GLM;

  try {
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages,
      model,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens || 800,
    });

    const content = completion.choices?.[0]?.message?.content || "";
    const usage = completion.usage || {};

    const result: ProviderCallResult = {
      content,
      model,
      provider: "GLM",
      inputTokens: usage.prompt_tokens || Math.floor(content.length / 4),
      outputTokens: usage.completion_tokens || Math.floor(content.length / 4),
      durationMs: Date.now() - startTime,
      cost: calculateCost("GLM", usage.prompt_tokens || 0, usage.completion_tokens || 0),
      success: true,
    };

    await recordUsage("GLM", result, options);
    return result;
  } catch (err) {
    return {
      content: "",
      model,
      provider: "GLM",
      inputTokens: 0,
      outputTokens: 0,
      durationMs: Date.now() - startTime,
      cost: 0,
      success: false,
      error: err instanceof Error ? err.message : "GLM SDK error",
    };
  }
}

// ============================================================================
// Unified dispatch — routes by provider
// ============================================================================

export async function callProvider(
  provider: Provider,
  userPrompt: string,
  options: ProviderCallOptions
): Promise<ProviderCallResult> {
  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [];

  if (options.systemPrompt) {
    messages.push({ role: "system", content: options.systemPrompt });
  } else {
    messages.push({
      role: "system",
      content: getDefaultSystemPrompt(provider),
    });
  }
  messages.push({ role: "user", content: userPrompt });

  if (provider === "GLM") {
    return callGLM(messages, options);
  }

  return callOpenRouter(provider, messages, options);
}

function getDefaultSystemPrompt(provider: Provider): string {
  const base = "You are part of the Voice Fusion Engine — a multi-agent AI workspace.";
  const role: Record<Provider, string> = {
    CLAUDE: `${base} You are the Claude-equivalent reasoning engine. Provide deep reasoning, long-context analysis, writing, and architecture review. Be direct and specific.`,
    GEMINI: `${base} You are the Gemini-equivalent multimodal engine. Analyze documents, contribute structured outputs, and provide independent solutions. Be precise and structured.`,
    GLM: `${base} You are the GLM engine. Provide additional reasoning, coding support, and model diversity. Be technical and clear.`,
    CODEX: `${base} You are the Codex-equivalent coding agent. Implement code changes, edit files, debug, and run tests. Always produce syntactically valid code with clear comments.`,
    RESEARCH: `${base} You are the Research agent. Gather relevant evidence, summarize findings with sources, and provide actionable recommendations.`,
  };
  return role[provider];
}

// ============================================================================
// Cost calculation (approximate, per 1K tokens)
// ============================================================================

function calculateCost(provider: Provider, inputTokens: number, outputTokens: number): number {
  // Approximate pricing per 1K tokens (USD)
  const pricing: Record<Provider, { input: number; output: number }> = {
    CLAUDE: { input: 0.00025, output: 0.00125 }, // DeepSeek-r1 rates
    GEMINI: { input: 0.0004, output: 0.0012 },
    GLM: { input: 0.0002, output: 0.0006 },
    CODEX: { input: 0.0003, output: 0.001 },
    RESEARCH: { input: 0.0003, output: 0.0009 },
  };
  const p = pricing[provider];
  return (inputTokens / 1000) * p.input + (outputTokens / 1000) * p.output;
}

// ============================================================================
// Usage recording
// ============================================================================

async function recordUsage(
  provider: Provider,
  result: ProviderCallResult,
  options: ProviderCallOptions
): Promise<void> {
  try {
    await db.usageRecord.create({
      data: {
        userId: options.userId,
        taskId: options.taskId || null,
        provider,
        model: result.model,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        cost: result.cost,
        durationMs: result.durationMs,
        success: result.success,
        errorMessage: result.error || null,
      },
    });
  } catch (err) {
    console.error("[usage] Failed to record:", err);
  }
}

// ============================================================================
// Health check — verifies provider is actually live
// Uses the robust chatCompletion from openrouter.ts which handles
// reasoning models, fallbacks, and content extraction.
// ============================================================================

export async function checkProviderHealth(provider: Provider): Promise<{
  provider: Provider;
  connected: boolean;
  model: string;
  latencyMs: number;
  error?: string;
}> {
  const startTime = Date.now();
  const model = MODEL_MAP[provider];

  // For GLM, use the z-ai-sdk directly
  if (provider === "GLM") {
    try {
      const result = await callGLM(
        [
          { role: "system", content: "Reply with exactly one word." },
          { role: "user", content: "Reply with: PONG" },
        ],
        { userId: "health-check", maxTokens: 200, temperature: 0 }
      );
      return {
        provider,
        connected: result.success,
        model: result.model || model,
        latencyMs: Date.now() - startTime,
        error: result.error,
      };
    } catch (err) {
      return {
        provider,
        connected: false,
        model,
        latencyMs: Date.now() - startTime,
        error: err instanceof Error ? err.message : "GLM error",
      };
    }
  }

  // For all other providers, use chatCompletion from openrouter.ts
  // (handles reasoning models, fallbacks, content extraction)
  try {
    const result = await chatCompletion(provider, {
      messages: [
        { role: "user", content: "Reply with exactly: PONG" },
      ],
      maxTokens: 100,
      temperature: 0,
    });

    // If we got non-empty content, it's live
    const connected = !!(result.content && result.content.trim().length > 0);

    return {
      provider,
      connected,
      model: result.model || model,
      latencyMs: Date.now() - startTime,
      error: connected ? undefined : "Empty response",
    };
  } catch (err) {
    return {
      provider,
      connected: false,
      model,
      latencyMs: Date.now() - startTime,
      error: err instanceof Error ? err.message.slice(0, 100) : "Unknown error",
    };
  }
}

export async function checkAllProvidersHealth(): Promise<
  Array<{ provider: Provider; connected: boolean; model: string; latencyMs: number; error?: string }>
> {
  const providers: Provider[] = ["CLAUDE", "GEMINI", "GLM", "CODEX", "RESEARCH"];
  // Run SEQUENTIALLY to avoid OOM in sandboxed environments
  const results: Array<{ provider: Provider; connected: boolean; model: string; latencyMs: number; error?: string }> = [];
  for (const p of providers) {
    const r = await checkProviderHealth(p);
    results.push(r);
  }

  // Update ProviderConfig in DB
  for (const r of results) {
    await db.providerConfig.update({
      where: { name: r.provider },
      data: {
        connected: r.connected,
        enabled: true,
        lastChecked: new Date(),
        configJson: JSON.stringify({
          model: r.model,
          latencyMs: r.latencyMs,
          error: r.error,
          checkedAt: new Date().toISOString(),
        }),
      },
    });
  }

  return results;
}

export function getProviderModel(provider: Provider): string {
  return MODEL_MAP[provider];
}

export function isProviderConfigured(provider: Provider): boolean {
  if (provider === "GLM") return true; // GLM uses z-ai-sdk which is bundled
  return !!OPENROUTER_API_KEY;
}
