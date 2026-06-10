# Lucien

Lucien George's personal site and AI portfolio assistant ("Poof").

A TanStack Start full-stack app: a public chat UI grounded (RAG) in markdown about Lucien, static work/resume/about pages, Better Auth (owner-only), and a Convex backend.

## What it does

- Public chat at `/` — visitors ask about Lucien; Poof answers using only retrieved context from `content/`
- First assistant message is a cached, LLM-written intro baked into the first paint
- Per-visitor conversation history persisted in Convex
- Static pages: about, skills, education, work (per role), resume (HTML + downloadable PDF)
- SEO + AI-crawler surfaces: rich JSON-LD, `/sitemap.xml`, `/llms.txt`, `/llms-full.txt`
- Owner-only auth (allowlisted email) with email verification

## Stack

- TanStack Start (Vite + Nitro), TanStack Router / Query / Form
- React 19 + React Compiler
- Tailwind CSS v4, shadcn-style UI on Base UI / Radix, `motion`, `sonner`
- Convex + `@convex-dev/rag`, `@convex-dev/better-auth`, `@convex-dev/action-cache`, `@convex-dev/react-query`
- Vercel AI SDK (`ai` v6) + OpenAI
- Better Auth (email/password, verification, allowlist gate)
- `@react-pdf/renderer` (resume PDF)
- Sentry, PostHog, Vercel Analytics + Speed Insights, Google Analytics
- Vitest (unit/convex/jsdom) + Playwright (e2e) + a Poof eval harness
- oxfmt + oxlint, `tsgo` (TS native preview) for typecheck
- pnpm, Node 22

### Models

- Query expansion: `gpt-5.4-nano`
- Chat + intro generation: `gpt-5.4-mini`
- Embeddings: `text-embedding-3-small` (1536 dims)

## App structure

```text
src/
  routes/                 Pages + API routes (file-based)
  components/             chat/, ui/, content/, resume/, site-nav, etc.
  integrations/           Convex, PostHog, Google Analytics, TanStack Query providers
  lib/                    auth, content registry, resume, sessions, analytics, logger, schemas
  router.tsx start.ts server.ts styles.css
convex/
  schema.ts               conversations + messages + messageParts
  conversations.ts        conversation persistence (queries/mutations)
  search.ts               RAG search action
  intro.ts                cached LLM intro (action-cache)
  rag.ts                  RAG instance
  seed.ts                 content seed actions
  http.ts                 Better Auth routes
  betterAuth/             Better Auth Convex component (schema is generated)
content/                  Markdown knowledge base + system-prompt.md + resume.json
evals/                    Poof eval harness (datasets, run.ts, judge.ts)
scripts/seed.ts           Seeds content/*.md into Convex RAG
tests/e2e/                Playwright specs
```

## Routes

- `/` chat page (edge-cacheable)
- `/about`, `/skills`, `/education` content pages (rendered from `content/`)
- `/work`, `/work/$slug` work history (entries from `src/lib/content/work-meta.ts`)
- `/resume` HTML resume · `/api/resume/pdf` PDF · `/resume.pdf` → 301 to the PDF
- `/login`, `/signup` auth pages
- `/api/chat` streamed chat API (POST only)
- `/api/auth/$` Better Auth handler
- `/sitemap.xml`, `/llms.txt`, `/llms-full.txt` SEO / AI-crawler surfaces

## How chat works

1. The frontend posts `{ id, message }` to `/api/chat`.
2. The handler checks the conversation-session cookie (`sessionId` must match the conversation `id`).
3. It loads the conversation from Convex (`getConversationById`).
4. The last user message is expanded into a richer search query with `gpt-5.4-nano`.
5. Convex RAG search runs in namespace `portfolio` (`limit 5`, `vectorScoreThreshold 0.4`).
6. Retrieved context is injected into `content/system-prompt.md` (`{retrieved_context}`).
7. The user message is persisted; `gpt-5.4-mini` streams the answer (with a `download_resume` tool).
8. `onFinish` persists the assistant message.

The homepage's first message is a separate **cached intro** (`convex/intro.ts`, action-cache, 30-day TTL) so a new visit renders an LLM intro without a per-request model call.

Key files:

- `src/routes/api/chat/index.ts`
- `convex/search.ts`, `convex/rag.ts`, `convex/intro.ts`
- `content/system-prompt.md`

## Local setup

### 1. Install deps

```bash
pnpm install
```

### 2. Create `.env.local`

Minimum local env:

```bash
VITE_CONVEX_URL=
VITE_CONVEX_SITE_URL=
BETTER_AUTH_SECRET=
TOAST_SECRET=
OPENAI_API_KEY=
SITE_URL=http://localhost:3000
```

Optional:

```bash
VITE_POSTHOG_KEY=
VITE_POSTHOG_HOST=
VITE_SENTRY_DSN=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=
```

Notes:

- `TOAST_SECRET` seals the conversation + toast cookies — the app throws without it
- `RESEND_API_KEY` / `RESEND_FROM_EMAIL` are needed for email verification
- PostHog is optional and safely no-ops if unset
- Sentry build vars only matter for release uploads / source maps
- `AUTH_ALLOWED_EMAILS` and `E2E_TEST_MODE` are dev/e2e-only (never set in prod)

### 3. Start Convex

```bash
pnpm dlx convex dev
```

### 4. Seed portfolio content

Reads `content/*.md` and uploads them to Convex RAG.

```bash
pnpm seed
```

### 5. Run the app

```bash
pnpm dev
```

App runs on `http://localhost:3000`.

## Auth

- Better Auth is configured in `src/lib/auth-config.ts` (shared with the Convex component in `convex/betterAuth/`)
- Email/password is enabled; email verification is required (relaxed only when `E2E_TEST_MODE=true`)
- **Allowlist gate:** a `before` hook rejects sign-in/sign-up unless the email is allowlisted. Only the owner email is allowed in prod (extra emails via `AUTH_ALLOWED_EMAILS` on dev), so auth is effectively single-user despite the public-looking UI
- Auth HTTP handler: `src/routes/api/auth/$.ts`; Convex routes registered in `convex/http.ts`

Route protection:

- logged-in users are redirected away from `/login` and `/signup`
- `/` and `/api/chat` are public (chat is scoped by the conversation cookie, not by login)

## Database / persistence

App schema (`convex/schema.ts`):

- `conversations` — `createdAt`, `updatedAt`, `sessionId?`, `title?`
- `messages` — `conversationId`, `role`, `uiMessageId`, `createdAt`, `modelId?`, `provider?`, `metadataJson?`
- `messageParts` — `messageId`, `order`, `partJson`, `type`, plus tool/text columns

Better Auth tables (`user`, `session`, `account`, `verification`, `jwks`) live in the betterAuth component (`convex/betterAuth/schema.ts`, generated). Content embeddings are managed by `@convex-dev/rag`.

## Useful commands

```bash
pnpm dev
pnpm build
pnpm start
pnpm test          # vitest (convex + node + jsdom projects)
pnpm test:e2e      # playwright
pnpm evals         # Poof eval harness
pnpm typecheck     # tsgo --noEmit
pnpm lint          # oxfmt + oxlint
pnpm format
pnpm seed
```

## Conventions

- TypeScript strict mode; `#/*` import alias → `src/*`
- File-based routing in `src/routes`
- Forms use TanStack Form + Zod
- Styling uses Tailwind utilities + shared UI primitives
- Formatting/linting: `oxfmt` + `oxlint`; typecheck via `tsgo`
- Generated files (do not edit): `src/routeTree.gen.ts`, `convex/_generated/`, `convex/betterAuth/schema.ts`

## Observability

- Sentry wired for client (lazy-loaded) and server (`instrument.server.mjs`)
- PostHog provider mounted globally (typed events in `src/lib/analytics.ts`)
- Vercel Analytics + Speed Insights; Google Analytics

Relevant files: `src/start.ts`, `src/server.ts`, `src/router.tsx`, `vite.config.ts`, `nitro.config.ts`, `src/integrations/posthog/provider.tsx`.

## Testing

- Vitest (`vitest.config.ts`) runs three projects: `convex` (edge-runtime, `convex-test`), `node` (`src` + `evals` `*.test.ts`), `jsdom` (`*.test.tsx`)
- Playwright e2e in `tests/e2e/` (auth setup project seeds a throwaway user; logged-out + logged-in specs)
- `pnpm evals` runs the Poof eval harness; CI also runs it as a blocking PR check

## Deployment

- Built with Vite + Nitro; deployed to Vercel
- `nitro.config.ts` sets security headers (CSP/HSTS/etc.), edge-caches the homepage, and `no-store`s API routes
- `pnpm build` copies `instrument.server.mjs` into the server output for runtime Sentry/OTel

## Adding content

To update Lucien's knowledge base:

1. Add or edit markdown files in `content/`
2. Keep `content/system-prompt.md` for prompt instructions only (it's skipped by the seed script)
3. Run `pnpm seed`

The same `content/*.md` drives both the chat RAG index and the rendered HTML pages + `/llms-full.txt`.

## Known limitations

- Auth is owner-only (allowlist), not open signup
- No role/permission system
- Small route surface; Convex is used for chat persistence, RAG, and auth (not broader app data)
