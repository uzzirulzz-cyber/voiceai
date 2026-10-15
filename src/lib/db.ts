// Voice AI — D1 Database Client (Cloudflare Workers compatible)
// Replaces Prisma with direct D1 SQL queries via the Workers runtime.
// Falls back to Prisma for local development.

// On Cloudflare Pages, D1 is accessed via getRequestContext() from @cloudflare/next-on-pages
// We use a lazy import to avoid Edge runtime issues with top-level await.
declare global {
  interface Request {
    env?: {
      DB: D1Database;
    };
  }
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
  exec(query: string): Promise<D1Result>;
}

interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = any>(): Promise<T | null>;
  all<T = any>(): Promise<{ results: T[] }>;
  run<T = any>(): Promise<D1Result>;
  raw<T = any>(): Promise<T[]>;
}

interface D1Result {
  success: boolean;
  meta?: any;
  results?: any[];
}

// Check if we're on Cloudflare (D1 available) or local (Prisma)
async function getD1(): Promise<D1Database | null> {
  // Try Cloudflare getRequestContext (lazy import to avoid Edge issues)
  try {
    const { getRequestContext } = await import("@cloudflare/next-on-pages");
    const ctx = getRequestContext();
    if (ctx?.env?.DB) {
      return ctx.env.DB as D1Database;
    }
  } catch {
    // Not on Cloudflare or import failed
  }
  // Check global (for Workers)
  if (typeof (globalThis as any).DB !== "undefined") {
    return (globalThis as any).DB;
  }
  return null;
}

// Prisma fallback for local dev
let _prisma: any = null;
async function getPrisma() {
  if (!_prisma) {
    const { PrismaClient } = await import("@prisma/client");
    _prisma = new PrismaClient({ log: ["error"] });
  }
  return _prisma;
}

// Unified db object — uses D1 on Cloudflare, Prisma locally
export const db = {
  user: {
    async findUnique(args: any): Promise<any> {
      const d1 = await getD1();
      if (d1) {
        if (args.where?.email) {
          return d1.prepare("SELECT * FROM User WHERE email = ? LIMIT 1").bind(args.where.email).first();
        }
        if (args.where?.id) {
          return d1.prepare("SELECT * FROM User WHERE id = ? LIMIT 1").bind(args.where.id).first();
        }
        if (args.where?.token) {
          // Used by getSessionFromCookie path
          const session = await d1.prepare("SELECT * FROM Session WHERE token = ? LIMIT 1").bind(args.where.token).first();
          if (!session) return null;
          return d1.prepare("SELECT * FROM User WHERE id = ? LIMIT 1").bind(session.userId).first();
        }
      }
      const prisma = await getPrisma();
      return prisma.user.findUnique(args);
    },
    async findFirst(args: any): Promise<any> {
      const d1 = await getD1();
      if (d1) {
        if (args.where?.id) {
          return d1.prepare("SELECT * FROM User WHERE id = ? LIMIT 1").bind(args.where.id).first();
        }
        if (args.where?.email) {
          return d1.prepare("SELECT * FROM User WHERE email = ? LIMIT 1").bind(args.where.email).first();
        }
      }
      const prisma = await getPrisma();
      return prisma.user.findFirst(args);
    },
    async findMany(args: any): Promise<any[]> {
      const d1 = await getD1();
      if (d1) {
        const rows = await d1.prepare("SELECT * FROM User ORDER BY createdAt DESC").all();
        return rows.results || [];
      }
      const prisma = await getPrisma();
      return prisma.user.findMany(args);
    },
    async create(args: any): Promise<any> {
      const d1 = await getD1();
      if (d1) {
        const id = generateId();
        const { email, name, passwordHash, role, status, creditBalanceUsd, creditMonthlyUsd, creditResetDay, creditLastReset } = args.data;
        await d1.prepare(
          "INSERT INTO User (id, email, name, passwordHash, role, status, creditBalanceUsd, creditMonthlyUsd, creditResetDay, creditLastReset) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        ).bind(id, email, name || null, passwordHash, role || "USER", status || "ACTIVE", creditBalanceUsd || 0, creditMonthlyUsd || 0, creditResetDay || 1, creditLastReset ? (creditLastReset instanceof Date ? creditLastReset.toISOString() : creditLastReset) : null).run();
        return { id, ...args.data };
      }
      const prisma = await getPrisma();
      return prisma.user.create(args);
    },
    async update(args: any): Promise<any> {
      const d1 = await getD1();
      if (d1) {
        const sets: string[] = [];
        const vals: any[] = [];
        for (const [k, v] of Object.entries(args.data)) {
          sets.push(`${k} = ?`);
          vals.push(v instanceof Date ? v.toISOString() : v);
        }
        sets.push("updatedAt = datetime('now')");
        vals.push(args.where.id);
        await d1.prepare(`UPDATE User SET ${sets.join(", ")} WHERE id = ?`).bind(...vals).run();
        return { ...args.data, id: args.where.id };
      }
      const prisma = await getPrisma();
      return prisma.user.update(args);
    },
    async count(args?: any): Promise<number> {
      const d1 = await getD1();
      if (d1) {
        if (args?.where?.status) {
          const r = await d1.prepare("SELECT COUNT(*) as c FROM User WHERE status = ?").bind(args.where.status).first();
          return r?.c || 0;
        }
        const r = await d1.prepare("SELECT COUNT(*) as c FROM User").first();
        return r?.c || 0;
      }
      const prisma = await getPrisma();
      return prisma.user.count(args);
    },
  },
  session: {
    async findUnique(args: any): Promise<any> {
      const d1 = await getD1();
      if (d1 && args.where?.token) {
        const session = await d1.prepare("SELECT * FROM Session WHERE token = ? LIMIT 1").bind(args.where.token).first();
        if (!session) return null;
        // If `include: { user: ... }` is specified, also fetch the user
        if (args.include?.user) {
          const user = await d1.prepare("SELECT * FROM User WHERE id = ? LIMIT 1").bind(session.userId).first();
          if (user) {
            // Convert D1 integer booleans to real booleans
            (user as any).creditBalanceUsd = Number((user as any).creditBalanceUsd) || 0;
            (user as any).creditMonthlyUsd = Number((user as any).creditMonthlyUsd) || 0;
          }
          // Return in Prisma-compatible format: { ...session, user: {...} }
          return { ...session, user };
        }
        return session;
      }
      const prisma = await getPrisma();
      return prisma.session.findUnique(args);
    },
    async create(args: any): Promise<any> {
      const d1 = await getD1();
      if (d1) {
        const id = generateId();
        const { userId, token, expiresAt } = args.data;
        await d1.prepare("INSERT INTO Session (id, userId, token, expiresAt) VALUES (?, ?, ?, ?)").bind(id, userId, token, expiresAt.toISOString()).run();
        return { id, ...args.data, expiresAt: expiresAt.toISOString() };
      }
      const prisma = await getPrisma();
      return prisma.session.create(args);
    },
    async delete(args: any): Promise<any> {
      const d1 = await getD1();
      if (d1 && args.where?.id) {
        await d1.prepare("DELETE FROM Session WHERE id = ?").bind(args.where.id).run();
        return {};
      }
      const prisma = await getPrisma();
      return prisma.session.delete(args);
    },
    async deleteMany(args: any): Promise<any> {
      const d1 = await getD1();
      if (d1 && args.where?.token) {
        await d1.prepare("DELETE FROM Session WHERE token = ?").bind(args.where.token).run();
        return { count: 1 };
      }
      const prisma = await getPrisma();
      return prisma.session.deleteMany(args);
    },
  },
  project: {
    async findMany(args: any): Promise<any[]> {
      const d1 = await getD1();
      if (d1) {
        const userId = args.where?.userId;
        let rows;
        if (userId) {
          rows = await d1.prepare("SELECT * FROM Project WHERE userId = ? ORDER BY updatedAt DESC").bind(userId).all();
        } else {
          rows = await d1.prepare("SELECT * FROM Project ORDER BY updatedAt DESC").all();
        }
        return rows.results || [];
      }
      const prisma = await getPrisma();
      return prisma.project.findMany(args);
    },
    async findFirst(args: any): Promise<any> {
      const d1 = await getD1();
      if (d1) {
        if (args.where?.id && args.where?.userId) {
          return d1.prepare("SELECT * FROM Project WHERE id = ? AND userId = ? LIMIT 1").bind(args.where.id, args.where.userId).first();
        }
        if (args.where?.id) {
          return d1.prepare("SELECT * FROM Project WHERE id = ? LIMIT 1").bind(args.where.id).first();
        }
      }
      const prisma = await getPrisma();
      return prisma.project.findFirst(args);
    },
    async create(args: any): Promise<any> {
      const d1 = await getD1();
      if (d1) {
        const id = generateId();
        const { userId, name, description, status } = args.data;
        await d1.prepare("INSERT INTO Project (id, userId, name, description, status) VALUES (?, ?, ?, ?, ?)").bind(id, userId, name, description || null, status || "ACTIVE").run();
        return { id, ...args.data };
      }
      const prisma = await getPrisma();
      return prisma.project.create(args);
    },
    async update(args: any): Promise<any> {
      const d1 = await getD1();
      if (d1) {
        const sets: string[] = [];
        const vals: any[] = [];
        for (const [k, v] of Object.entries(args.data)) {
          sets.push(`${k} = ?`);
          vals.push(v instanceof Date ? v.toISOString() : v);
        }
        sets.push("updatedAt = datetime('now')");
        vals.push(args.where.id);
        await d1.prepare(`UPDATE Project SET ${sets.join(", ")} WHERE id = ?`).bind(...vals).run();
        return { ...args.data, id: args.where.id };
      }
      const prisma = await getPrisma();
      return prisma.project.update(args);
    },
    async delete(args: any): Promise<any> {
      const d1 = await getD1();
      if (d1 && args.where?.id) {
        await d1.prepare("DELETE FROM Project WHERE id = ?").bind(args.where.id).run();
        return {};
      }
      const prisma = await getPrisma();
      return prisma.project.delete(args);
    },
    async count(args?: any): Promise<number> {
      const d1 = await getD1();
      if (d1) {
        const r = await d1.prepare("SELECT COUNT(*) as c FROM Project").first();
        return r?.c || 0;
      }
      const prisma = await getPrisma();
      return prisma.project.count(args);
    },
  },
  projectFile: {
    async findFirst(args: any): Promise<any> {
      const d1 = await getD1();
      if (d1 && args.where?.id) {
        return d1.prepare("SELECT * FROM ProjectFile WHERE id = ? LIMIT 1").bind(args.where.id).first();
      }
      const prisma = await getPrisma();
      return prisma.projectFile.findFirst(args);
    },
    async findMany(args: any): Promise<any[]> {
      const d1 = await getD1();
      if (d1 && args.where?.projectId) {
        const rows = await d1.prepare("SELECT * FROM ProjectFile WHERE projectId = ? ORDER BY path ASC").bind(args.where.projectId).all();
        return rows.results || [];
      }
      const prisma = await getPrisma();
      return prisma.projectFile.findMany(args);
    },
    async create(args: any): Promise<any> {
      const d1 = await getD1();
      if (d1) {
        const id = generateId();
        const { projectId, path, content, language } = args.data;
        await d1.prepare("INSERT INTO ProjectFile (id, projectId, path, content, language) VALUES (?, ?, ?, ?, ?)").bind(id, projectId, path, content || "", language || null).run();
        return { id, ...args.data };
      }
      const prisma = await getPrisma();
      return prisma.projectFile.create(args);
    },
    async createMany(args: any): Promise<any> {
      const d1 = await getD1();
      if (d1) {
        for (const item of args.data) {
          const id = generateId();
          const { projectId, path, content, language } = item;
          await d1.prepare("INSERT INTO ProjectFile (id, projectId, path, content, language) VALUES (?, ?, ?, ?, ?)").bind(id, projectId, path, content || "", language || null).run();
        }
        return { count: args.data.length };
      }
      const prisma = await getPrisma();
      return prisma.projectFile.createMany(args);
    },
    async update(args: any): Promise<any> {
      const d1 = await getD1();
      if (d1 && args.where?.id) {
        const sets: string[] = [];
        const vals: any[] = [];
        for (const [k, v] of Object.entries(args.data)) {
          sets.push(`${k} = ?`);
          vals.push(v instanceof Date ? v.toISOString() : v);
        }
        sets.push("updatedAt = datetime('now')");
        vals.push(args.where.id);
        await d1.prepare(`UPDATE ProjectFile SET ${sets.join(", ")} WHERE id = ?`).bind(...vals).run();
        return { ...args.data, id: args.where.id };
      }
      const prisma = await getPrisma();
      return prisma.projectFile.update(args);
    },
    async delete(args: any): Promise<any> {
      const d1 = await getD1();
      if (d1 && args.where?.id) {
        await d1.prepare("DELETE FROM ProjectFile WHERE id = ?").bind(args.where.id).run();
        return {};
      }
      const prisma = await getPrisma();
      return prisma.projectFile.delete(args);
    },
  },
  task: {
    async findFirst(args: any): Promise<any> {
      const d1 = await getD1();
      if (d1 && args.where?.id) {
        return d1.prepare("SELECT * FROM Task WHERE id = ? LIMIT 1").bind(args.where.id).first();
      }
      const prisma = await getPrisma();
      return prisma.task.findFirst(args);
    },
    async findMany(args: any): Promise<any[]> {
      const d1 = await getD1();
      if (d1) {
        const userId = args.where?.userId;
        let rows;
        if (userId) {
          rows = await d1.prepare("SELECT * FROM Task WHERE userId = ? ORDER BY createdAt DESC LIMIT 50").bind(userId).all();
        } else {
          rows = await d1.prepare("SELECT * FROM Task ORDER BY createdAt DESC LIMIT 50").all();
        }
        return rows.results || [];
      }
      const prisma = await getPrisma();
      return prisma.task.findMany(args);
    },
    async create(args: any): Promise<any> {
      const d1 = await getD1();
      if (d1) {
        const id = generateId();
        const d = args.data;
        await d1.prepare(
          "INSERT INTO Task (id, userId, projectId, title, description, status, workMode, acceptanceCriteria, planJson, eventsJson, artifactsJson, verificationJson, budgetTokens, usedTokens, estimatedCost, retryCount, maxRetries) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
        ).bind(id, d.userId, d.projectId || null, d.title, d.description, d.status || "QUEUED", d.workMode || "BALANCED", d.acceptanceCriteria || "[]", d.planJson || "[]", d.eventsJson || "[]", d.artifactsJson || "[]", d.verificationJson || "{}", d.budgetTokens || 50000, d.usedTokens || 0, d.estimatedCost || 0, d.retryCount || 0, d.maxRetries || 3).run();
        return { id, ...d };
      }
      const prisma = await getPrisma();
      return prisma.task.create(args);
    },
    async update(args: any): Promise<any> {
      const d1 = await getD1();
      if (d1 && args.where?.id) {
        const sets: string[] = [];
        const vals: any[] = [];
        for (const [k, v] of Object.entries(args.data)) {
          if (v === null || v === undefined) {
            sets.push(`${k} = NULL`);
          } else {
            sets.push(`${k} = ?`);
            vals.push(v instanceof Date ? v.toISOString() : v);
          }
        }
        sets.push("updatedAt = datetime('now')");
        vals.push(args.where.id);
        await d1.prepare(`UPDATE Task SET ${sets.join(", ")} WHERE id = ?`).bind(...vals).run();
        return { ...args.data, id: args.where.id };
      }
      const prisma = await getPrisma();
      return prisma.task.update(args);
    },
    async count(args?: any): Promise<number> {
      const d1 = await getD1();
      if (d1) {
        if (args?.where?.status) {
          // Handle both `status: "COMPLETED"` and `status: { in: [...] }`
          const statusWhere = args.where.status;
          let statuses: string[];
          if (Array.isArray(statusWhere)) {
            statuses = statusWhere;
          } else if (typeof statusWhere === "object" && statusWhere.in) {
            statuses = statusWhere.in;
          } else {
            statuses = [statusWhere as string];
          }
          const placeholders = statuses.map(() => "?").join(",");
          const r = await d1.prepare(`SELECT COUNT(*) as c FROM Task WHERE status IN (${placeholders})`).bind(...statuses).first();
          return r?.c || 0;
        }
        const r = await d1.prepare("SELECT COUNT(*) as c FROM Task").first();
        return r?.c || 0;
      }
      const prisma = await getPrisma();
      return prisma.task.count(args);
    },
    async groupBy(args: any): Promise<any[]> {
      const d1 = await getD1();
      if (d1) {
        const by = args.by?.[0] || "status";
        const rows = await d1.prepare(`SELECT ${by}, COUNT(*) as _count FROM Task GROUP BY ${by}`).all();
        return (rows.results || []).map((r: any) => ({ [by]: r[by], _count: r._count }));
      }
      const prisma = await getPrisma();
      return prisma.task.groupBy(args);
    },
  },
  usageRecord: {
    async create(args: any): Promise<any> {
      const d1 = await getD1();
      if (d1) {
        const id = generateId();
        const d = args.data;
        await d1.prepare(
          "INSERT INTO UsageRecord (id, userId, taskId, provider, model, inputTokens, outputTokens, cost, durationMs, success, errorMessage) VALUES (?,?,?,?,?,?,?,?,?,?,?)"
        ).bind(id, d.userId, d.taskId || null, d.provider, d.model || "", d.inputTokens || 0, d.outputTokens || 0, d.cost || 0, d.durationMs || 0, d.success === false ? 0 : 1, d.errorMessage || null).run();
        return { id, ...d };
      }
      const prisma = await getPrisma();
      return prisma.usageRecord.create(args);
    },
    async aggregate(args: any): Promise<any> {
      const d1 = await getD1();
      if (d1) {
        const r = await d1.prepare("SELECT SUM(cost) as _sum_cost, SUM(inputTokens) as _sum_inputTokens, SUM(outputTokens) as _sum_outputTokens FROM UsageRecord").first();
        return { _sum: { cost: r?._sum_cost || 0, inputTokens: r?._sum_inputTokens || 0, outputTokens: r?._sum_outputTokens || 0 } };
      }
      const prisma = await getPrisma();
      return prisma.usageRecord.aggregate(args);
    },
    async groupBy(args: any): Promise<any[]> {
      const d1 = await getD1();
      if (d1) {
        const by = args.by?.[0] || "provider";
        const rows = await d1.prepare(`SELECT ${by}, COUNT(*) as _count, SUM(inputTokens) as _sum_inputTokens, SUM(outputTokens) as _sum_outputTokens, SUM(cost) as _sum_cost FROM UsageRecord GROUP BY ${by}`).all();
        return (rows.results || []).map((r: any) => ({ [by]: r[by], _count: r._count, _sum: { inputTokens: r._sum_inputTokens, outputTokens: r._sum_outputTokens, cost: r._sum_cost } }));
      }
      const prisma = await getPrisma();
      return prisma.usageRecord.groupBy(args);
    },
  },
  providerConfig: {
    async findMany(args?: any): Promise<any[]> {
      const d1 = await getD1();
      if (d1) {
        const rows = await d1.prepare("SELECT * FROM ProviderConfig").all();
        return rows.results || [];
      }
      const prisma = await getPrisma();
      return prisma.providerConfig.findMany(args);
    },
    async findUnique(args: any): Promise<any> {
      const d1 = await getD1();
      if (d1 && args.where?.name) {
        return d1.prepare("SELECT * FROM ProviderConfig WHERE name = ? LIMIT 1").bind(args.where.name).first();
      }
      const prisma = await getPrisma();
      return prisma.providerConfig.findUnique(args);
    },
    async create(args: any): Promise<any> {
      const d1 = await getD1();
      if (d1) {
        const id = generateId();
        const d = args.data;
        await d1.prepare(
          "INSERT INTO ProviderConfig (id, name, displayName, enabled, connected, lastChecked, configJson) VALUES (?,?,?,?,?,?,?)"
        ).bind(id, d.name, d.displayName || null, d.enabled ? 1 : 0, d.connected ? 1 : 0, d.lastChecked ? d.lastChecked.toISOString() : null, d.configJson || "{}").run();
        return { id, ...d, enabled: !!d.enabled, connected: !!d.connected };
      }
      const prisma = await getPrisma();
      return prisma.providerConfig.create(args);
    },
    async update(args: any): Promise<any> {
      const d1 = await getD1();
      if (d1 && args.where?.name) {
        const sets: string[] = [];
        const vals: any[] = [];
        for (const [k, v] of Object.entries(args.data)) {
          if (k === "enabled" || k === "connected") {
            sets.push(`${k} = ?`);
            vals.push(v ? 1 : 0);
          } else if (v instanceof Date) {
            sets.push(`${k} = ?`);
            vals.push(v.toISOString());
          } else if (v === null) {
            sets.push(`${k} = NULL`);
          } else {
            sets.push(`${k} = ?`);
            vals.push(v instanceof Date ? v.toISOString() : v);
          }
        }
        sets.push("updatedAt = datetime('now')");
        vals.push(args.where.name);
        await d1.prepare(`UPDATE ProviderConfig SET ${sets.join(", ")} WHERE name = ?`).bind(...vals).run();
        return { ...args.data, name: args.where.name };
      }
      const prisma = await getPrisma();
      return prisma.providerConfig.update(args);
    },
    async count(args?: any): Promise<number> {
      const d1 = await getD1();
      if (d1) {
        const r = await d1.prepare("SELECT COUNT(*) as c FROM ProviderConfig").first();
        return r?.c || 0;
      }
      const prisma = await getPrisma();
      return prisma.providerConfig.count(args);
    },
  },
  auditLog: {
    async findMany(args: any): Promise<any[]> {
      const d1 = await getD1();
      if (d1) {
        const rows = await d1.prepare("SELECT * FROM AuditLog ORDER BY createdAt DESC LIMIT 50").all();
        return rows.results || [];
      }
      const prisma = await getPrisma();
      return prisma.auditLog.findMany(args);
    },
    async create(args: any): Promise<any> {
      const d1 = await getD1();
      if (d1) {
        const id = generateId();
        const d = args.data;
        await d1.prepare(
          "INSERT INTO AuditLog (id, userId, action, target, details, ipAddress) VALUES (?,?,?,?,?,?)"
        ).bind(id, d.userId, d.action, d.target || null, d.details || "{}", d.ipAddress || null).run();
        return { id, ...d };
      }
      const prisma = await getPrisma();
      return prisma.auditLog.create(args);
    },
  },
  $queryRaw: async (sql: string, ...params: any[]) => {
    const d1 = await getD1();
    if (d1) {
      return d1.prepare(sql).bind(...params).all();
    }
    const prisma = await getPrisma();
    return prisma.$queryRaw(sql, ...params);
  },
  $disconnect: async () => {
    if (_prisma) await _prisma.$disconnect();
  },
};

function generateId(): string {
  // Generate a CUID-like ID
  return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
}
