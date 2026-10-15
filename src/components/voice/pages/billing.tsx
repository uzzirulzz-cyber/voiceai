"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  Zap,
  Sparkles,
  Brain,
  Eye,
  Code2,
  Globe,
} from "lucide-react";

const PROVIDER_ICONS: Record<string, any> = {
  CLAUDE: Sparkles,
  GEMINI: Eye,
  GLM: Brain,
  CODEX: Code2,
  RESEARCH: Globe,
};

export function BillingPage({ user }: { user: { role: string } }) {
  const [credit, setCredit] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [adminStats, setAdminStats] = useState<any>(null);

  useEffect(() => {
    fetch("/api/credits").then((r) => r.json()).then((d) => setCredit(d.credit));
    fetch("/api/admin/overview").then((r) => r.json()).then((d) => setAdminStats(d)).catch(() => {});
  }, []);

  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const monthly = credit?.monthly || 0;
  const spent = credit?.spentThisMonth || 0;
  const remaining = credit?.balance || 0;
  const usedPct = monthly > 0 ? (spent / monthly) * 100 : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-6 py-6 lg:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Usage & Billing</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track your API consumption and credit balance.
        </p>
      </div>

      {/* Super Admin Credit Package */}
      {isSuperAdmin && credit && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="voice-card p-6 mb-6 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(221,187,112,0.10), rgba(155,122,255,0.06))",
            borderColor: "rgba(221,187,112,0.3)",
          }}
        >
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-30"
            style={{ background: "radial-gradient(circle, var(--gold), transparent 70%)" }} />
          <div className="relative">
            <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, var(--gold), #F0D080)" }}>
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-base font-bold flex items-center gap-2">
                    Super Admin API Credit Package
                    <span className="status-pill status-pill-live">$250/mo</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Premium API access — resets on day {credit.resetDay} of each month
                  </div>
                </div>
              </div>
            </div>

            {/* Balance stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
              <div className="p-3 rounded-lg bg-card/40">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Monthly Allowance</div>
                <div className="text-xl font-bold mt-1 credit-badge-amount">${monthly.toFixed(2)}</div>
              </div>
              <div className="p-3 rounded-lg bg-card/40">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Remaining Balance</div>
                <div className="text-xl font-bold mt-1" style={{ color: "var(--success)" }}>${remaining.toFixed(2)}</div>
              </div>
              <div className="p-3 rounded-lg bg-card/40">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Spent This Month</div>
                <div className="text-xl font-bold mt-1" style={{ color: "var(--warning)" }}>${spent.toFixed(4)}</div>
              </div>
              <div className="p-3 rounded-lg bg-card/40">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Utilization</div>
                <div className="text-xl font-bold mt-1">{usedPct.toFixed(2)}%</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, usedPct)}%` }}
                  transition={{ duration: 0.8 }}
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, var(--gold), var(--accent))" }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Provider Usage Breakdown */}
      {adminStats?.usageByProvider && Object.keys(adminStats.usageByProvider).length > 0 && (
        <div className="voice-card p-5 mb-6">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Provider Usage Breakdown
          </h3>
          <div className="space-y-3">
            {Object.entries(adminStats.usageByProvider).map(([provider, data]: [string, any]) => {
              const Icon = PROVIDER_ICONS[provider] || Sparkles;
              const colorMap: Record<string, string> = {
                CLAUDE: "#4F8CFF",
                GEMINI: "#9B7AFF",
                GLM: "#30C995",
                CODEX: "#F2B65D",
                RESEARCH: "#DDBB70",
              };
              const color = colorMap[provider] || "var(--primary)";
              const tokens = (data._sum.inputTokens || 0) + (data._sum.outputTokens || 0);
              return (
                <div key={provider} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}20`, color }}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{provider}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {data._count} calls · {tokens.toLocaleString()} tokens
                    </div>
                  </div>
                  <div className="text-sm font-mono">${(data._sum.cost || 0).toFixed(4)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick stats */}
      {adminStats?.overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total Tasks" value={adminStats.overview.totalTasks} icon={Zap} color="var(--primary)" />
          <StatCard label="Completed" value={adminStats.overview.completedTasks} icon={CreditCard} color="var(--success)" />
          <StatCard label="Total Cost" value={`$${adminStats.overview.totalCost.toFixed(4)}`} icon={DollarSign} color="var(--gold)" />
          <StatCard label="Total Tokens" value={(adminStats.overview.totalInputTokens + adminStats.overview.totalOutputTokens).toLocaleString()} icon={TrendingUp} color="var(--accent)" />
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: any; icon: any; color: string }) {
  return (
    <div className="voice-card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}
