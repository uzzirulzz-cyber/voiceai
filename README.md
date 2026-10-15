# Voice AI — Five-Engine AI Workspace

Multi-agent AI workspace coordinating **Claude**, **Gemini**, **GLM**, **Codex**, and a **Research** agent on the same task. Plan, execute, verify, and deliver from one instruction.

Built with Next.js 16, TypeScript, Tailwind CSS 4, shadcn/ui, Prisma, and Cloudflare R2.

## Features

- **Five-engine orchestration** — Voice Fusion Engine routes each subtask to the capability-best engine (reasoning, multimodal, coding, research, or diversity).
- **Three-panel workspace** — Project Explorer (left), Work Area with Chat / Code / Preview / Docs / Research tabs (center), Voice Fusion live status panel (right).
- **Task lifecycle** — 9 states: QUEUED → PLANNING → RUNNING → VERIFYING → COMPLETED. Includes pause, cancel, retry, and verification checks.
- **Artifacts** — generated code, documents, research reports. Preview HTML in a sandboxed iframe. Download per-file.
- **Admin panel** — RBAC (SUPER_ADMIN / ADMIN / USER), users, providers, tasks, audit logs.
- **Cloudflare R2 storage** — optional S3-compatible artifact storage.
- **Premium dark UI** — deep navy + silver/white + blue/violet accents per spec.

## Quick Start (Local)

```bash
# 1. Install deps
bun install

# 2. Copy env template and fill in real values
cp .env.example .env
# Edit .env — set ADMIN_EMAIL, ADMIN_PASSWORD, R2_* (optional)

# 3. Initialize database
bun run db:push

# 4. Seed admin user + provider configs
bun run scripts/seed.ts

# 5. Start dev server
bun run dev
```

Visit `http://localhost:3000`. The admin user from `.env` is already created.

## Environment Variables

See `.env.example` for the full list. Required for production:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | SQLite path or Postgres URL |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Used by `scripts/seed.ts` |
| `NEXT_PUBLIC_APP_URL` | Public URL (e.g. `https://voiceai.playbeat.live`) |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | R2 S3 credentials |
| `R2_BUCKET_NAME` | R2 bucket (e.g. `voice-artifacts`) |
| `SESSION_SECRET` | Long random string for session signing |

Optional AI provider keys (server-side only):

- `ANTHROPIC_API_KEY` — Claude
- `GOOGLE_GEMINI_API_KEY` — Gemini
- `OPENAI_API_KEY` — Codex
- `ZAI_API_KEY` — GLM (already integrated via `z-ai-web-dev-sdk`)

## Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start dev server on port 3000 |
| `bun run build` | Production build |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun run db:push` | Push Prisma schema to database |
| `bun run db:generate` | Regenerate Prisma Client |
| `bun run scripts/seed.ts` | Seed admin + provider configs |

## Deployment — voiceai.playbeat.live

### Option A: VPS with Docker Compose

1. **Clone the repo** on your VPS:
   ```bash
   git clone https://github.com/uzzirulzz-cyber/aiystic.git
   cd aiystic
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   nano .env  # Fill in real values
   ```

3. **Set up DNS**: Point `voiceai.playbeat.live` (and optionally `artifacts.voiceai.playbeat.live` for R2 public access) to your VPS IP.

4. **Build and run**:
   ```bash
   docker compose up -d --build
   ```

5. **Set up HTTPS** with Caddy or nginx + Let's Encrypt (Caddy auto-provisions TLS).

### Option B: Cloudflare Pages / Vercel

- Push to GitHub repo `uzzirulzz-cyber/aiystic`
- Connect repo to Cloudflare Pages or Vercel
- Set all env vars in the platform dashboard
- Set build command `bun run build`
- Set output directory `.next`
- Set custom domain `voiceai.playbeat.live`

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Single-page app (landing/auth/workspace/admin)
│   ├── layout.tsx                  # Root layout (dark theme, branding)
│   ├── globals.css                 # Premium dark visual identity
│   └── api/
│       ├── auth/{register,login,logout,me}/
│       ├── projects/{list,create,detail}/
│       ├── tasks/{list,create,detail,execute,download}/
│       ├── files/save/
│       ├── providers/list/
│       ├── storage/{status,upload}/
│       └── admin/{overview,users,tasks,audit}/
├── components/
│   ├── voice/
│   │   ├── logo.tsx                # Voice hex logo
│   │   ├── landing-hero.tsx        # Marketing landing
│   │   ├── auth-screen.tsx         # Login / register
│   │   ├── workspace.tsx           # 3-panel workspace shell
│   │   ├── project-explorer.tsx    # LEFT: project/file tree
│   │   ├── work-area.tsx           # CENTER: chat/code/preview/docs/research
│   │   ├── fusion-panel.tsx        # RIGHT: live task state
│   │   └── admin-panel.tsx         # Admin dashboard
│   └── ui/                         # shadcn/ui components
├── lib/
│   ├── db.ts                       # Prisma client
│   ├── auth.ts                     # Session + RBAC helpers
│   ├── fusion-engine.ts            # Multi-agent orchestration
│   ├── r2.ts                       # Cloudflare R2 storage client
│   ├── types.ts                    # Provider/task/artifact types
│   └── utils.ts
└── prisma/
    └── schema.prisma               # 8 models: User, Session, Project, ProjectFile,
                                     # Task, UsageRecord, ProviderConfig, AuditLog
```

## Security Notes

- API keys (Anthropic, Google, OpenAI, ZAI, Cloudflare R2) **never reach the browser** — all provider calls happen server-side.
- Sessions are HTTP-only cookies with 7-day expiry.
- Role checks enforced on every protected API route (`requireUser` / `requireAdmin` / `requireSuperAdmin`).
- File paths are sanitized against traversal attacks.
- HTML preview runs in a sandboxed iframe (no same-origin access).
- Audit logs record all admin actions.

## License

Proprietary. All rights reserved.
