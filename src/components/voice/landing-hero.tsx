"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { VoiceLogo, VoiceWordmark } from "./logo";
import {
  Sparkles,
  Brain,
  Eye,
  Code2,
  Globe,
  Zap,
  Shield,
  ArrowRight,
  CheckCircle2,
  Layers,
  GitBranch,
  Lock,
} from "lucide-react";
import { PROVIDERS } from "@/lib/types";

interface LandingHeroProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

const ENGINES = [
  {
    key: "claude",
    name: "Claude",
    icon: Sparkles,
    color: "oklch(0.75 0.18 50)",
    desc: "Deep reasoning, long-context analysis, writing, architecture, and code review.",
    tags: ["Reasoning", "Long-context", "Writing"],
  },
  {
    key: "gemini",
    name: "Gemini",
    icon: Eye,
    color: "oklch(0.7 0.15 200)",
    desc: "Multimodal analysis of images, documents, audio, video, and complex information.",
    tags: ["Multimodal", "Vision", "Documents"],
  },
  {
    key: "glm",
    name: "GLM",
    icon: Brain,
    color: "oklch(0.65 0.2 250)",
    desc: "Additional reasoning, coding, and model diversity with strong problem-solving.",
    tags: ["Reasoning", "Coding", "Analysis"],
  },
  {
    key: "codex",
    name: "Codex",
    icon: Code2,
    color: "oklch(0.7 0.18 150)",
    desc: "Delegated coding tasks, repository changes, debugging, test execution.",
    tags: ["Code Editing", "Debugging", "Tests"],
  },
  {
    key: "research",
    name: "Research",
    icon: Globe,
    color: "oklch(0.65 0.22 290)",
    desc: "Web research, information gathering, task planning, and finished deliverables.",
    tags: ["Web Search", "Planning", "Deliverables"],
  },
];

const WORKFLOW_STEPS = [
  { n: 1, title: "User submits one task", desc: "A single natural-language request — nothing else." },
  { n: 2, title: "Planner decomposes it", desc: "Task graph with acceptance criteria and dependency links." },
  { n: 3, title: "Agents are routed", desc: "Each subtask goes to the engine best suited for its capability." },
  { n: 4, title: "Independent work runs in parallel", desc: "Research, multimodal analysis, and reasoning happen concurrently." },
  { n: 5, title: "Verification checks outputs", desc: "Acceptance criteria enforced before synthesis." },
  { n: 6, title: "One verified deliverable", desc: "Combined output with artifact manifest, downloadable." },
];

export function LandingHero({ onGetStarted, onSignIn }: LandingHeroProps) {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Ambient gradient orbs */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute top-0 left-1/4 w-[40rem] h-[40rem] rounded-full blur-3xl voice-pulse"
          style={{ background: "radial-gradient(circle, oklch(0.62 0.19 250 / 25%) 0%, transparent 70%)" }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-[35rem] h-[35rem] rounded-full blur-3xl voice-pulse"
          style={{ background: "radial-gradient(circle, oklch(0.62 0.21 290 / 22%) 0%, transparent 70%)" }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, delay: 1 }}
        />
      </div>

      {/* Nav */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-background/60 border-b border-border/40">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <VoiceWordmark size={36} />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onSignIn}>
              Sign in
            </Button>
            <Button size="sm" onClick={onGetStarted} className="voice-glow">
              <Sparkles className="w-4 h-4 mr-1.5" /> Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <VoiceLogo size={88} animated />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-8"
        >
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs border border-border/60 bg-card/50 mb-6">
            <span className="w-1.5 h-1.5 rounded-full status-pulse-blue" style={{ background: "var(--voice-cyan)" }} />
            <span className="text-muted-foreground">Five-engine multi-agent orchestration</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight max-w-4xl mx-auto leading-[1.05]">
            One task. <span className="text-gradient-voice">Five engines.</span>
            <br />
            One verified result.
          </h1>

          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Voice AI coordinates Claude, Gemini, GLM, Codex, and a research agent on the same task —
            sharing context, routing by capability, and verifying every output before delivery.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" onClick={onGetStarted} className="voice-glow h-12 px-6 text-base">
              <Sparkles className="w-5 h-5 mr-2" />
              Launch Workspace
            </Button>
            <Button size="lg" variant="outline" onClick={onSignIn} className="h-12 px-6 text-base">
              Sign in
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "var(--voice-cyan)" }} /> No credit card
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "var(--voice-cyan)" }} /> First account = Super Admin
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "var(--voice-cyan)" }} /> Real GLM integration
            </span>
          </div>
        </motion.div>
      </section>

      {/* Five Engines */}
      <section className="px-6 py-16 border-t border-border/40 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold">The five engines</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Each engine is selected by capability — not by brand. The orchestrator routes each subtask to the
              engine best suited for the work.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ENGINES.map((engine, i) => (
              <motion.div
                key={engine.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="glass-panel rounded-xl p-5 hover:border-border transition-all group"
                style={{ borderColor: `${engine.color}40` }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ background: `${engine.color}25`, color: engine.color }}
                  >
                    <engine.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{engine.name}</h3>
                    <div className="flex gap-1.5 mt-1">
                      {engine.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted/50 text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{engine.desc}</p>
              </motion.div>
            ))}

            {/* Orchestrator card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="rounded-xl p-5 border voice-glow-violet"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.22 0.028 260 / 80%), oklch(0.2 0.025 290 / 80%))",
                borderColor: "oklch(0.65 0.22 290 / 40%)",
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: "oklch(0.65 0.22 290 / 25%)", color: "oklch(0.75 0.18 290)" }}
                >
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Fusion Engine</h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted/50 text-muted-foreground">
                    Orchestrator
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Coordinates all five engines. Plans the task, routes subtasks, parallelizes independent work,
                verifies outputs, and synthesizes one final deliverable.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="px-6 py-20 border-t border-border/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold">From one instruction to verified output</h2>
            <p className="mt-3 text-muted-foreground">
              The orchestration pipeline that powers every Voice AI task.
            </p>
          </div>

          <div className="space-y-1">
            {WORKFLOW_STEPS.map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="flex items-start gap-4 p-4 rounded-xl hover:bg-card/40 transition-colors"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border"
                  style={{
                    background: "oklch(0.65 0.2 250 / 15%)",
                    color: "var(--voice-blue)",
                    borderColor: "oklch(0.65 0.2 250 / 40%)",
                  }}
                >
                  {step.n}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{step.title}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features strip */}
      <section className="px-6 py-12 border-t border-border/40 bg-card/20">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: GitBranch, title: "Shared task graph", desc: "All agents see the same plan" },
            { icon: Zap, title: "Parallel execution", desc: "Independent subtasks run concurrently" },
            { icon: Shield, title: "Verification loop", desc: "Outputs checked against criteria" },
            { icon: Lock, title: "Server-side secrets", desc: "API keys never reach the browser" },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="flex flex-col gap-2"
            >
              <f.icon className="w-5 h-5" style={{ color: "var(--voice-blue)" }} />
              <h4 className="text-sm font-medium">{f.title}</h4>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center border-t border-border/40">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-semibold max-w-2xl mx-auto">
            Ready to coordinate all five engines?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Create an account and submit your first task in under a minute.
          </p>
          <Button size="lg" onClick={onGetStarted} className="mt-6 voice-glow h-12 px-8 text-base">
            <Sparkles className="w-5 h-5 mr-2" />
            Launch Voice AI
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 px-6 py-6 text-center text-xs text-muted-foreground">
        Voice AI — Five-engine AI workspace · Built on Next.js 16 · Multi-agent orchestration
      </footer>
    </div>
  );
}
