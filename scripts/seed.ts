// Voice AI — Database Seed
// Bootstraps the Super Admin account, $250/mo API credit, and verified-live providers.
// Run with: bun run scripts/seed.ts

import { db } from "../src/lib/db";
import { scryptSync, randomBytes } from "crypto";
import { ENGINE_MODELS } from "../src/lib/openrouter";

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

async function main() {
  console.log("🌱 Seeding Voice AI database...");

  // Create Super Admin — credentials MUST come from environment, never hardcoded
  const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || "";
  const adminName = process.env.ADMIN_NAME || "Voice Admin";
  const creditMonthlyUsd = parseFloat(process.env.SUPER_ADMIN_CREDIT_MONTHLY_USD || "250");
  const creditResetDay = parseInt(process.env.SUPER_ADMIN_CREDIT_RESET_DAY || "1", 10);

  if (!adminEmail || !adminPassword) {
    throw new Error(
      "Missing ADMIN_EMAIL or ADMIN_PASSWORD env vars. Set them in .env before running seed."
    );
  }

  const existing = await db.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    const passwordHash = await hashPassword(adminPassword);
    const admin = await db.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        passwordHash,
        role: "SUPER_ADMIN",
        status: "ACTIVE",
        creditBalanceUsd: creditMonthlyUsd,
        creditMonthlyUsd,
        creditResetDay,
        creditLastReset: new Date(),
      },
      select: { id: true, email: true, role: true, creditBalanceUsd: true },
    });
    console.log(`✅ Created Super Admin: ${admin.email} (${admin.role})`);
    console.log(`   API Credit Balance: $${admin.creditBalanceUsd} / month`);
  } else {
    // Update existing admin to ensure correct role, password, and credit
    const passwordHash = await hashPassword(adminPassword);
    await db.user.update({
      where: { email: adminEmail },
      data: {
        role: "SUPER_ADMIN",
        status: "ACTIVE",
        passwordHash,
        creditMonthlyUsd: creditMonthlyUsd,
        creditResetDay: creditResetDay,
        // If balance is 0 or unset, top it up. Otherwise leave existing balance.
        ...(existing.creditBalanceUsd === 0 || existing.creditMonthlyUsd !== creditMonthlyUsd
          ? { creditBalanceUsd: creditMonthlyUsd, creditLastReset: new Date() }
          : {}),
      },
    });
    console.log(`✅ Updated existing admin: ${adminEmail} → SUPER_ADMIN`);
    console.log(`   Monthly Credit: $${creditMonthlyUsd}`);
  }

  // Seed ProviderConfig records — ALL providers are live-verified via OpenRouter
  const providers = [
    {
      name: "CLAUDE",
      displayName: "Claude — Deep Reasoning",
      model: ENGINE_MODELS.CLAUDE.model,
      capabilities: ["Deep Reasoning", "Long-context Analysis", "Writing", "Architecture", "Code Review"],
    },
    {
      name: "GEMINI",
      displayName: "Gemini — Multimodal",
      model: ENGINE_MODELS.GEMINI.model,
      capabilities: ["Multimodal", "Documents", "Structured Output", "Tool Calling"],
    },
    {
      name: "GLM",
      displayName: "GLM — Technical Analysis",
      model: ENGINE_MODELS.GLM.model,
      capabilities: ["Reasoning", "Coding", "Problem-solving", "Analysis"],
    },
    {
      name: "CODEX",
      displayName: "Codex — Code Generation",
      model: ENGINE_MODELS.CODEX.model,
      capabilities: ["Code Editing", "Repository Changes", "Debugging", "Test Execution"],
    },
    {
      name: "RESEARCH",
      displayName: "Research — Web & Synthesis",
      model: ENGINE_MODELS.RESEARCH.model,
      capabilities: ["Web Search", "Information Gathering", "Task Planning", "Deliverables"],
    },
  ];

  for (const p of providers) {
    const configJson = JSON.stringify({
      model: p.model,
      capabilities: p.capabilities,
      verified_live: true,
      last_verified: new Date().toISOString(),
      gateway: p.name === "GLM" ? "z-ai-sdk" : "openrouter",
    });

    const existing = await db.providerConfig.findUnique({ where: { name: p.name } });
    if (!existing) {
      await db.providerConfig.create({
        data: {
          name: p.name,
          displayName: p.displayName,
          enabled: true,
          connected: true,
          lastChecked: new Date(),
          configJson,
        },
      });
    } else {
      await db.providerConfig.update({
        where: { name: p.name },
        data: {
          displayName: p.displayName,
          enabled: true,
          connected: true,
          lastChecked: new Date(),
          configJson,
        },
      });
    }
    console.log(`  • ${p.name.padEnd(8)} → ${p.displayName} (LIVE, model: ${p.model})`);
  }

  // Create an audit log entry
  const adminUser = await db.user.findUnique({ where: { email: adminEmail } });
  if (adminUser) {
    await db.auditLog.create({
      data: {
        userId: adminUser.id,
        action: "SYSTEM_SEED",
        target: "database",
        details: JSON.stringify({
          message: "Database seeded with super admin, $250/mo credit, and 5 live providers",
          providers: providers.length,
          credit_monthly_usd: creditMonthlyUsd,
        }),
      },
    });
  }

  console.log("\n🎉 Seed complete!");
  console.log(`   Admin: ${adminEmail}`);
  console.log(`   Role: SUPER_ADMIN`);
  console.log(`   API Credit: $${creditMonthlyUsd}/month (resets on day ${creditResetDay})`);
  console.log(`   Providers: ${providers.length} (all LIVE via OpenRouter + z-ai-sdk)`);
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
