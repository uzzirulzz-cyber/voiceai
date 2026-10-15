// Voice AI — Credit tracking
// Super Admin has a $250/month API credit package.
// Each provider call deducts from the balance. Resets monthly.

import { db } from "./db";

const RESET_DAY = parseInt(process.env.SUPER_ADMIN_CREDIT_RESET_DAY || "1", 10);
const DEFAULT_MONTHLY = parseFloat(process.env.SUPER_ADMIN_CREDIT_MONTHLY_USD || "250");

/**
 * Check if the user's credit needs a monthly reset, and reset it if so.
 */
export async function refreshCreditIfNeeded(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, creditBalanceUsd: true, creditMonthlyUsd: true, creditResetDay: true, creditLastReset: true },
  });
  if (!user) return null;
  if (user.role !== "SUPER_ADMIN") return user; // Only super admin has credit package

  const now = new Date();
  const resetDay = user.creditResetDay || RESET_DAY;
  const monthly = user.creditMonthlyUsd || DEFAULT_MONTHLY;

  // If never reset, or we've passed the reset day in a new month, reset
  if (!user.creditLastReset) {
    await db.user.update({
      where: { id: userId },
      data: { creditBalanceUsd: monthly, creditLastReset: now },
    });
    return { ...user, creditBalanceUsd: monthly, creditLastReset: now };
  }

  const lastReset = new Date(user.creditLastReset);
  const monthsSinceReset = (now.getFullYear() - lastReset.getFullYear()) * 12 + (now.getMonth() - lastReset.getMonth());
  const shouldReset = monthsSinceReset >= 1 && now.getDate() >= resetDay;

  if (shouldReset) {
    await db.user.update({
      where: { id: userId },
      data: { creditBalanceUsd: monthly, creditLastReset: now },
    });
    return { ...user, creditBalanceUsd: monthly, creditLastReset: now };
  }

  return user;
}

/**
 * Deduct from the user's credit balance after a provider call.
 * Only deducts if the user is a SUPER_ADMIN (the credit package holder).
 */
export async function deductCredit(userId: string, amountUsd: number): Promise<void> {
  if (amountUsd <= 0) return;
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true, creditBalanceUsd: true },
  });
  if (!user || user.role !== "SUPER_ADMIN") return;

  const newBalance = Math.max(0, user.creditBalanceUsd - amountUsd);
  await db.user.update({
    where: { id: userId },
    data: { creditBalanceUsd: newBalance },
  });
}

/**
 * Get credit summary for the user (visible to themselves or admins).
 */
export async function getCreditSummary(userId: string) {
  const user = await refreshCreditIfNeeded(userId);
  if (!user) return null;

  // Get total spent this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const spentThisMonth = await db.usageRecord.aggregate({
    where: { userId, createdAt: { gte: startOfMonth } },
    _sum: { cost: true },
  });

  return {
    balance: user.creditBalanceUsd || 0,
    monthly: user.creditMonthlyUsd || 0,
    resetDay: user.creditResetDay || RESET_DAY,
    lastReset: user.creditLastReset,
    spentThisMonth: spentThisMonth._sum.cost || 0,
    remaining: Math.max(0, (user.creditMonthlyUsd || 0) - (spentThisMonth._sum.cost || 0)),
    isSuperAdmin: user.role === "SUPER_ADMIN",
  };
}
