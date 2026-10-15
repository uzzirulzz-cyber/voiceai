"use client";

import { motion } from "framer-motion";
import {
  Palette,
  Monitor,
  Bell,
  Zap,
  Scale,
  Brain,
  Code2,
  Globe,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings, THEME_OPTIONS } from "../settings-context";

export function SettingsPage() {
  const { settings, setTheme, setDensity, setDefaultWorkMode, setNotifications } = useSettings();

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-6 py-6 lg:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Customize your Voice AI workspace</p>
      </div>

      {/* Appearance / Theme */}
      <SettingsSection icon={Palette} title="Appearance" description="Choose your preferred theme and layout density">
        {/* Theme picker */}
        <div className="mb-4">
          <div className="text-xs font-semibold mb-2">Theme</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {THEME_OPTIONS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={cn(
                  "p-3 rounded-lg border text-left transition-all",
                  settings.theme === t.id ? "border-primary ring-1 ring-primary/30" : "border-border hover:border-primary/40"
                )}
              >
                <div className="w-full h-12 rounded-md mb-2 relative overflow-hidden"
                  style={{ background: t.preview.bg, border: "1px solid rgba(153,171,199,0.2)" }}>
                  <div className="absolute top-1 left-1 w-2 h-2 rounded-full" style={{ background: t.preview.accent }} />
                  <div className="absolute bottom-1 left-1 right-1 h-0.5 rounded" style={{ background: t.preview.fg, opacity: 0.6 }} />
                  <div className="absolute top-1 right-1 w-1 h-1 rounded-full" style={{ background: t.preview.accent }} />
                </div>
                <div className="text-xs font-medium flex items-center gap-1">
                  {t.name}
                  {settings.theme === t.id && <Check className="w-3 h-3 text-primary" />}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{t.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Layout density */}
        <div>
          <div className="text-xs font-semibold mb-2">Layout density</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setDensity("comfortable")}
              className={cn(
                "p-3 rounded-lg border text-left transition-all",
                settings.density === "comfortable" ? "border-primary ring-1 ring-primary/30" : "border-border hover:border-primary/40"
              )}
            >
              <Monitor className="w-4 h-4 mb-1 text-primary" />
              <div className="text-xs font-medium">Comfortable</div>
              <div className="text-[10px] text-muted-foreground">Spacious padding, relaxed</div>
            </button>
            <button
              onClick={() => setDensity("compact")}
              className={cn(
                "p-3 rounded-lg border text-left transition-all",
                settings.density === "compact" ? "border-primary ring-1 ring-primary/30" : "border-border hover:border-primary/40"
              )}
            >
              <Monitor className="w-4 h-4 mb-1 text-muted-foreground" />
              <div className="text-xs font-medium">Compact</div>
              <div className="text-[10px] text-muted-foreground">Tighter spacing, more content</div>
            </button>
          </div>
        </div>
      </SettingsSection>

      {/* Default Work Mode */}
      <SettingsSection icon={Zap} title="Default Work Mode" description="Choose the default routing mode when creating new tasks">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            { id: "BALANCED" as const, icon: Scale, label: "Balanced", desc: "Optimal mix" },
            { id: "FAST" as const, icon: Zap, label: "Fast", desc: "Quick routing" },
            { id: "DEEP" as const, icon: Brain, label: "Deep Reasoning", desc: "Max verification" },
            { id: "CODING" as const, icon: Code2, label: "Coding", desc: "Codex priority" },
            { id: "RESEARCH" as const, icon: Globe, label: "Research", desc: "Web research" },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setDefaultWorkMode(m.id)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-all",
                settings.defaultWorkMode === m.id ? "border-primary ring-1 ring-primary/30 bg-accent/30" : "border-border hover:border-primary/40"
              )}
            >
              <m.icon className={cn("w-4 h-4", settings.defaultWorkMode === m.id ? "text-primary" : "text-muted-foreground")} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium">{m.label}</div>
                <div className="text-[10px] text-muted-foreground">{m.desc}</div>
              </div>
              {settings.defaultWorkMode === m.id && <Check className="w-3 h-3 text-primary" />}
            </button>
          ))}
        </div>
      </SettingsSection>

      {/* Notifications */}
      <SettingsSection icon={Bell} title="Notifications" description="Choose what you want to be notified about">
        <label className="flex items-center justify-between p-3 rounded-lg border border-border cursor-pointer hover:bg-accent/30">
          <div>
            <div className="text-xs font-medium">Task completion alerts</div>
            <div className="text-[10px] text-muted-foreground">Notify when a task finishes or fails</div>
          </div>
          <button
            onClick={() => setNotifications(!settings.notifications)}
            className={cn(
              "w-10 h-5 rounded-full p-0.5 transition-colors",
              settings.notifications ? "bg-primary" : "bg-muted"
            )}
          >
            <motion.div
              animate={{ x: settings.notifications ? 20 : 0 }}
              className="w-4 h-4 rounded-full bg-white"
            />
          </button>
        </label>
      </SettingsSection>

      {/* System info */}
      <SettingsSection icon={Monitor} title="System" description="Voice AI system information">
        <div className="space-y-2">
          <Row label="Version" value="Voice AI Build 02" />
          <Row label="AI Gateway" value="OpenRouter + z-ai-sdk" />
          <Row label="Models Connected" value="5 / 5 live" />
          <Row label="Storage" value="Cloudflare R2 (voice-artifacts)" />
          <Row label="Framework" value="Next.js 16 · TypeScript 5" />
        </div>
      </SettingsSection>
    </div>
  );
}

function SettingsSection({ icon: Icon, title, description, children }: { icon: any; title: string; description: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="voice-card p-5 mb-4"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(79,140,255,0.15)", color: "var(--primary)" }}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      {children}
    </motion.div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-2 rounded-md bg-card/40">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-mono">{value}</span>
    </div>
  );
}
