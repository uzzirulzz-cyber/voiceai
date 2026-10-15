// Voice AI - Auth helpers
// Uses Web Crypto API (works on both Edge runtime and Node.js)
import { db } from "@/lib/db";
import { cookies } from "next/headers";

const SESSION_COOKIE = "voice_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

// Web Crypto API — works on Edge runtime (Cloudflare Workers) and Node.js 18+
async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, "0")).join("");
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const hashBuf = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  const hashHex = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, "0")).join("");
  return `pbkdf2$${saltHex}$${hashHex}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    if (!stored.startsWith("pbkdf2$") && !stored.startsWith("scrypt$")) return false;
    const [, salt, hash] = stored.split("$");
    const encoder = new TextEncoder();
    
    // If it's a legacy scrypt hash, try Node crypto (works on Node, not on Edge)
    if (stored.startsWith("scrypt$")) {
      try {
        const { scryptSync, timingSafeEqual } = await import("crypto");
        const testHashBuf = scryptSync(password, salt, 64);
        const storedBuf = Buffer.from(hash, "hex");
        if (testHashBuf.length !== storedBuf.length) return false;
        return timingSafeEqual(testHashBuf, storedBuf);
      } catch {
        return false;
      }
    }
    
    // PBKDF2 hash (Edge-compatible)
    const saltBytes = new Uint8Array(salt.match(/.{2}/g)!.map((b: string) => parseInt(b, 16)));
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    const testHashBuf = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: saltBytes,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      256
    );
    const testHashHex = Array.from(new Uint8Array(testHashBuf)).map(b => b.toString(16).padStart(2, "0")).join("");
    return testHashHex === hash;
  } catch {
    return false;
  }
}

function generateToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function createUser(email: string, password: string, name?: string, role: string = "USER") {
  const passwordHash = await hashPassword(password);
  // First user becomes super admin
  const userCount = await db.user.count();
  const assignedRole = userCount === 0 ? "SUPER_ADMIN" : role;

  const user = await db.user.create({
    data: {
      email: email.toLowerCase(),
      name: name || email.split("@")[0],
      passwordHash,
      role: assignedRole,
    },
    select: { id: true, email: true, name: true, role: true },
  });

  // Bootstrap session
  const session = await createSession(user.id);

  return { user, session };
}

export async function createSession(userId: string) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  const session = await db.session.create({
    data: { userId, token, expiresAt },
  });

  return session;
}

export async function getSessionFromCookie(): Promise<{ user: NonNullable<Awaited<ReturnType<typeof getUserByToken>>> } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const user = await getUserByToken(token);
  if (!user) return null;

  return { user };
}

export async function getUserByToken(token: string) {
  const session = await db.session.findUnique({
    where: { token },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          avatarUrl: true,
          createdAt: true,
          creditBalanceUsd: true,
          creditMonthlyUsd: true,
          creditResetDay: true,
          creditLastReset: true,
        },
      },
    },
  });

  if (!session) return null;
  // D1 returns expiresAt as a string — convert to Date for comparison
  const expiresAt = typeof session.expiresAt === "string" ? new Date(session.expiresAt) : session.expiresAt;
  if (expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } });
    return null;
  }

  return session.user;
}

export async function loginUser(email: string, password: string) {
  const user = await db.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) return null;
  if (user.status === "SUSPENDED") return null;

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return null;

  const session = await createSession(user.id);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
    },
    session,
  };
}

export async function logoutUser(token: string) {
  await db.session.deleteMany({ where: { token } });
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function requireUser() {
  const session = await getSessionFromCookie();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  if (session.user.status !== "ACTIVE") {
    throw new Error("ACCOUNT_SUSPENDED");
  }
  return session.user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export async function requireSuperAdmin() {
  const user = await requireUser();
  if (user.role !== "SUPER_ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return user;
}
