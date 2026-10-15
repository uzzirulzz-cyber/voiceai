// Voice AI — OpenRouter unified AI provider client
// All 5 engines route through OpenRouter's single API for live results.
// Region-friendly models are selected to ensure global availability.

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionOptions {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export interface ChatCompletionResult {
  content: string;
  model: string;
  provider: string;
  tokensIn: number;
  tokensOut: number;
  cost: number;
  durationMs: number;
  raw: any;
}

// Region-friendly model mappings for each engine.
// These are verified to work globally (no region restrictions).
export const ENGINE_MODELS: Record<string, { model: string; displayName: string; alternatives: string[] }> = {
  CLAUDE: {
    // Claude role: deep reasoning. DeepSeek Chat is a strong reasoning model
    // that returns standard `content` (not reasoning-only like R1).
    model: "deepseek/deepseek-chat",
    displayName: "DeepSeek Chat (Claude-class reasoning)",
    alternatives: ["qwen/qwen-2.5-72b-instruct", "z-ai/glm-5.3"],
  },
  GEMINI: {
    // Gemini role: multimodal & structured output. Qwen 2.5 72B.
    model: "qwen/qwen-2.5-72b-instruct",
    displayName: "Qwen 2.5 72B (Gemini-class multimodal)",
    alternatives: ["meta-llama/llama-3.3-70b-instruct", "deepseek/deepseek-chat"],
  },
  GLM: {
    // GLM role: technical analysis & coding. Real GLM 5.3.
    model: "z-ai/glm-5.3",
    displayName: "Z.ai GLM 5.3 (real GLM)",
    alternatives: ["z-ai/glm-5.2", "z-ai/glm-5.3-flashx"],
  },
  CODEX: {
    // Codex role: code generation. Qwen Coder 32B.
    model: "qwen/qwen-2.5-coder-32b-instruct",
    displayName: "Qwen 2.5 Coder 32B (Codex-class coding)",
    alternatives: ["qwen/qwen-2.5-72b-instruct", "deepseek/deepseek-chat"],
  },
  RESEARCH: {
    // Research role: web research & synthesis. GLM Flash (fast).
    model: "z-ai/glm-5.3-flash",
    displayName: "Z.ai GLM 5.3 Flash (research)",
    alternatives: ["z-ai/glm-5.3-flashx", "qwen/qwen-2.5-7b-instruct"],
  },
};

let _configured: boolean | null = null;

export function isOpenRouterConfigured(): boolean {
  if (_configured !== null) return _configured;
  _configured = !!OPENROUTER_API_KEY;
  return _configured;
}

export function getOpenRouterConfig() {
  return {
    configured: isOpenRouterConfigured(),
    baseUrl: OPENROUTER_BASE_URL,
    keyPrefix: OPENROUTER_API_KEY ? `${OPENROUTER_API_KEY.slice(0, 12)}…` : null,
    engines: Object.fromEntries(
      Object.entries(ENGINE_MODELS).map(([k, v]) => [k, { model: v.model, displayName: v.displayName }])
    ),
  };
}

export async function chatCompletion(
  engine: keyof typeof ENGINE_MODELS | string,
  options: ChatCompletionOptions
): Promise<ChatCompletionResult> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not set. Cannot make live AI calls.");
  }

  const engineConfig = ENGINE_MODELS[engine] || ENGINE_MODELS.GLM;
  const model = options.model || engineConfig.model;
  const startTime = Date.now();

  // Try primary model, fall back to alternatives if it fails
  const modelsToTry = [model, ...engineConfig.alternatives];
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < modelsToTry.length; attempt++) {
    const tryModel = modelsToTry[attempt];
    try {
      // For rate-limited models, wait briefly before retry
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, 800 * attempt));
      }

      const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://voiceai.playbeat.live",
          "X-Title": "Voice AI - Five-Engine Workspace",
        },
        body: JSON.stringify({
          model: tryModel,
          messages: options.messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 1500,
          top_p: options.topP ?? 0.95,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[OpenRouter] ${tryModel} failed (${response.status}):`, errText.slice(0, 200));
        lastError = new Error(`HTTP ${response.status}: ${errText.slice(0, 100)}`);
        continue;
      }

      const data = await response.json();

      if (data.error) {
        console.error(`[OpenRouter] ${tryModel} returned error:`, data.error.message);
        lastError = new Error(data.error.message);
        continue;
      }

      const choice = data.choices?.[0];
      if (!choice) {
        lastError = new Error("No choices in response");
        continue;
      }

      // Some reasoning models (e.g. deepseek-r1, glm-flash) return content
      // in `reasoning` when max_tokens is too low for both. Handle both.
      let content = choice.message?.content || "";
      if (!content && choice.message?.reasoning) {
        content = choice.message.reasoning;
      }
      // Trim leading "reasoning" preamble if present
      content = content.trim();

      // If still empty, try the raw JSON dump as last resort
      if (!content) {
        content = JSON.stringify(choice.message || {});
      }

      const usage = data.usage || {};

      return {
        content,
        model: data.model || tryModel,
        provider: data.provider || "openrouter",
        tokensIn: usage.prompt_tokens || 0,
        tokensOut: usage.completion_tokens || 0,
        cost: usage.cost || 0,
        durationMs: Date.now() - startTime,
        raw: data,
      };
    } catch (err) {
      console.error(`[OpenRouter] ${tryModel} exception:`, err);
      lastError = err instanceof Error ? err : new Error(String(err));
      continue;
    }
  }

  throw lastError || new Error("All model attempts failed");
}

// Streaming chat completion (for live token-by-token output)
export async function* chatCompletionStream(
  engine: keyof typeof ENGINE_MODELS | string,
  options: ChatCompletionOptions
): AsyncGenerator<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

  const engineConfig = ENGINE_MODELS[engine] || ENGINE_MODELS.GLM;
  const model = options.model || engineConfig.model;

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://voiceai.playbeat.live",
      "X-Title": "Voice AI - Five-Engine Workspace",
    },
    body: JSON.stringify({
      model,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1500,
      stream: true,
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`Stream failed: HTTP ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const payload = line.slice(6).trim();
        if (payload === "[DONE]") return;
        try {
          const json = JSON.parse(payload);
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) yield delta;
        } catch {
          // skip
        }
      }
    }
  }
}
