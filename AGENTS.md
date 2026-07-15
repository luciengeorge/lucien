# AGENTS.md

Instructions for agents (Cursor, Claude Code, Codex) working in this repo.
For architecture depth, read `CODEBASE_ARCHITECTURE.md`.

## What this is

Lucien George's personal site + AI portfolio assistant ("Poof"): a TanStack
Start (SSR) app on Vercel, backed by Convex, that answers questions about
Lucien via RAG over markdown in `content/`.

## Commands

- `pnpm dev` - run the app (port 3000)
- `pnpm build` / `pnpm start` - production build / serve
- `pnpm typecheck` - `tsgo --noEmit` (TS native preview; NOT `tsc`)
- `pnpm lint` - `oxfmt` + `oxlint` (writes fixes); `pnpm lint:check` for CI-style check
- `pnpm test` - vitest (convex + node + jsdom projects)
- `pnpm test:e2e` - Playwright (`pnpm test:e2e:install` first for browsers)
- `pnpm evals` - Poof eval harness
- `pnpm seed` - embed `content/*.md` into Convex RAG (needs a logged-in Convex CLI session)

## Conventions (must follow)

- Import alias: `#/*` -> `src/*`.
- Toolchain is oxfmt + oxlint + tsgo. Do NOT introduce eslint, prettier, or tsc.
- oxlint bans `as` type casts, do not add them.
- No em-dashes anywhere (the repo was purged of them).
- File-based routing in `src/routes`; forms use TanStack Form + Zod.
- Never edit generated files: `src/routeTree.gen.ts`, `convex/_generated/`,
  `convex/betterAuth/schema.ts`.

## Observability (important, easy to get wrong)

- Server functions (`src/lib/functions/`, `createServerFn`) are intentionally
  NOT wrapped in Sentry spans. Server instrumentation was deliberately trimmed
  for edge-cacheability / fast cold starts. Do not re-add server spans / OTel.
- Sentry: client is lazy-initialized (`src/router.tsx`); server is only
  `instrument.server.mjs` (prod-only, `defaultIntegrations: false`, no OTel
  auto-instrumentation).

## Chat / RAG entry points

- HTTP: `src/routes/api/chat/index.ts` (POST only).
- Convex: `convex/search.ts` (RAG search), `convex/rag.ts` (RAG instance),
  `convex/intro.ts` (cached LLM intro).
- Prompt: `content/system-prompt.md` (`{retrieved_context}` slot).
- Real Convex schema: `conversations` / `messages` / `messageParts`
  (`convex/schema.ts`).

## Environment

Before `pnpm install`, set `HUGEICONS_TOKEN` (two `@hugeicons-pro/*` deps
resolve from a private registry, see `.npmrc`; CI reads it from a GitHub
Actions secret). Local `.env.local` minimum: `VITE_CONVEX_URL`,
`VITE_CONVEX_SITE_URL`, `BETTER_AUTH_SECRET`, `TOAST_SECRET`,
`OPENAI_API_KEY`, `SITE_URL`. See `README.md` / `.env.example` for the
full/optional list. Auth is owner-only (allowlist); `AUTH_ALLOWED_EMAILS` and
`E2E_TEST_MODE` are dev/e2e-only, never set in prod.

## Adding shadcn components

`pnpm dlx shadcn@latest add <component>`.
