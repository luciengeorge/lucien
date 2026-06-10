# Codebase Architecture

Lucien George's personal site + AI portfolio assistant ("Poof"). A single TanStack Start app (SSR) deployed to Vercel, backed by Convex, that answers questions about Lucien via RAG over markdown and serves static work/resume/about pages.

## Technology stack

- **Framework**: TanStack Start (Vite + Nitro), React 19 + React Compiler
- **Routing**: TanStack Router (file-based, `defaultPreload: "intent"`)
- **Data**: TanStack Query + `@convex-dev/react-query`
- **Forms**: TanStack Form + Zod
- **Backend**: Convex (`@convex-dev/rag`, `@convex-dev/better-auth`, `@convex-dev/action-cache`)
- **AI**: Vercel AI SDK (`ai` v6) + OpenAI (`gpt-5.4-nano` expansion, `gpt-5.4-mini` chat/intro, `text-embedding-3-small` embeddings)
- **Auth**: Better Auth (email/password, verification, owner-only allowlist)
- **UI**: shadcn-style components on Base UI / Radix + CVA, Tailwind CSS v4, `motion`, `sonner`, hugeicons/lucide
- **PDF**: `@react-pdf/renderer` (resume)
- **Observability**: Sentry, PostHog, Vercel Analytics + Speed Insights, Google Analytics
- **Quality**: Vitest (convex/node/jsdom), Playwright (e2e), Poof eval harness; oxfmt + oxlint, `tsgo` typecheck
- **Runtime**: pnpm, Node 22; deployed on Vercel

## Top-level layout

```
src/        frontend + API routes (TanStack Start)
convex/     Convex backend (schema, functions, components)
content/    markdown knowledge base + system-prompt.md + resume.json
evals/      Poof eval harness
scripts/    seed.ts (content → Convex RAG)
tests/e2e/  Playwright specs
```

## Request / data flow

```
Browser ──► TanStack Start (Nitro / Vercel)
              ├─ SSR pages (router + loaders)
              ├─ /api/chat   ─► OpenAI (expand) ─► Convex RAG ─► OpenAI (stream) ─► Convex (persist)
              ├─ /api/auth/$ ─► Better Auth ─► Convex betterAuth component
              └─ /api/resume/pdf ─► @react-pdf/renderer
            Convex
              ├─ conversations / messages / messageParts
              ├─ rag component (portfolio namespace)
              ├─ actionCache component (cached intro)
              └─ betterAuth component (user/session/account/...)
```

### Provider tree (`src/routes/__root.tsx`)

`ConvexProvider` → `TanStackQueryProvider` → (`PostHogInit`, `Toaster`, `SiteNav`, `<main>{routes}</main>`, devtools), with Vercel Analytics + Speed Insights + Google Analytics and JSON-LD in the document shell.

### Entry points

- `src/start.ts` — client entry
- `src/server.ts` — server entry
- `src/router.tsx` — `getRouter()`; lazy-inits the Sentry browser SDK in prod
- `instrument.server.mjs` — server Sentry/OTel, loaded via `NODE_OPTIONS=--import`

## Frontend (`src/`)

### Routes (`src/routes/`)

File-based. Pages: `/` (chat), `/about`, `/skills`, `/education`, `/work` + `/work/$slug`, `/resume`, `/login`, `/signup`. API: `/api/chat` (POST), `/api/auth/$`, `/api/resume/pdf`. SEO: `/sitemap.xml`, `/llms.txt`, `/llms-full.txt`. `__root.tsx` owns global SEO meta + JSON-LD (Person / WebSite / FAQPage); per-route heads add page-specific meta + structured data. `routeTree.gen.ts` is generated.

### Components (`src/components/`)

- `chat/` — the chat UI (composer, conversation, timeline message, pending reply, markdown render, starter prompts, resume card, etc.)
- `ui/` — shadcn-style primitives (Base UI / Radix + CVA): button, card, dropdown-menu, input, field, label, select, separator, slider, switch, textarea, tooltip, scroll-area, spinner, sonner, empty, nav-link
- `content/content-page.tsx` — shared markdown page layout
- `resume/company-logo.tsx`, `site-nav.tsx`, `download-cv-button.tsx`, `global-loading.tsx`, `initials-mark.tsx`, `not-found.tsx`

### Lib (`src/lib/`)

- `content/registry.ts` + `content/work-meta.ts` — single source for work entries; joins metadata with `?raw` markdown
- `resume/{load,schema,pdf-document}` — resume loading (zod-validated), formatting, PDF
- `auth-config.ts` / `auth-client.ts` / `auth-server.ts` — Better Auth wiring
- `conversation-session.server.ts`, `toast-session.server.ts` — sealed-cookie sessions (`TOAST_SECRET`)
- `functions/` — server functions (session, toast, start-new-conversation)
- `analytics.ts` (typed PostHog events), `logger.ts`, `social-links.ts`, `homepage-intro.ts`, `utils.ts` (`cn()`)

## Backend (`convex/`)

### Schema (`convex/schema.ts`)

- **conversations** — `createdAt`, `updatedAt`, `sessionId?`, `title?`; indexes by created/updated/session
- **messages** — `conversationId`, `role`, `uiMessageId`, `createdAt`, `modelId?`, `provider?`, `metadataJson?`; indexes by conversation, by (conversation, uiMessageId), by created
- **messageParts** — `messageId`, `order`, `partJson`, `type`, plus `textPreview?` / `toolCallId?` / `toolName?` / `toolState?`; index by message

UI messages are stored as JSON parts with extracted columns for queryability. Better Auth tables live in the betterAuth component (`convex/betterAuth/schema.ts`, generated).

### Functions

- `conversations.ts` — `createConversation`, `getConversationById` (ownership-checked, hydrates parts), `upsertConversationMessage` (zod-validated, derives title)
- `search.ts` — `searchContext(query)` → RAG search text
- `intro.ts` — `generateIntro` (internal) + `getCachedIntro`, wrapped in action-cache (30-day TTL)
- `rag.ts` — RAG instance (`text-embedding-3-small`, 1536-d, namespace `portfolio`)
- `seed.ts` — `resetNamespace` + `addContent`
- `http.ts` — registers Better Auth routes (CORS)

## Content (`content/`)

Markdown is the single source of truth for both the chat RAG index and the rendered HTML pages + `/llms-full.txt`. Files: bio, personal, education, tech-stack, socials, and one per work entry (fyxer, localista, skyla, shopify, le-wagon, impact-lebanon, early-career). `system-prompt.md` holds Poof's prompt (`{retrieved_context}` slot; skipped by seeding). `resume.json` is structured and validated by `src/lib/resume/schema.ts`. `scripts/seed.ts` (`pnpm seed`) embeds the markdown into Convex RAG.

## Sessions (three, independent)

1. **Better Auth session** — owner login (allowlisted).
2. **Conversation session** — anonymous visitor; sealed cookie `lucien-conversation` (`TOAST_SECRET`) holding `{ sessionId, conversationId }`; authorizes chat access.
3. **Toast session** — one-shot flash messages; read client-side after hydration so the SSR homepage stays cookie-free and edge-cacheable.

## Chat pipeline (`src/routes/api/chat/index.ts`)

1. Validate body (`ChatRequestSchema`) and the conversation-session cookie.
2. Load the conversation from Convex; validate UI messages.
3. Expand the query (`gpt-5.4-nano`).
4. RAG search (`searchContext`) → inject into `system-prompt.md`.
5. Persist the user message; stream the answer (`gpt-5.4-mini`, `stepCountIs(3)`) with a `download_resume` tool.
6. `onFinish` persists the assistant message.

The homepage's first message is a cached LLM intro (`convex/intro.ts`) read cookie-free and baked into first paint.

## Build, deploy, observability

- **Vite** (`vite.config.ts`): TanStack Start, Nitro, Tailwind, React (React Compiler), Sentry source-map upload.
- **Nitro** (`nitro.config.ts`): security headers on all routes; homepage edge-cached (`s-maxage=86400`, SWR); `/api/**` `no-store`; `/resume.pdf` → 301.
- **Sentry**: browser (lazy) + server (`instrument.server.mjs`); source maps at build.
- **PostHog**: global provider, conditional on `VITE_POSTHOG_KEY`; typed events in `src/lib/analytics.ts`.
- **Vercel** Analytics + Speed Insights; Google Analytics.

## Testing

- **Vitest** (`vitest.config.ts`): `convex` (edge-runtime + `convex-test`), `node` (`src` + `evals` `*.test.ts`), `jsdom` (`*.test.tsx`).
- **Playwright** (`playwright.config.ts`): `setup` (seeds a throwaway user → storage state), `chromium` (logged-out), `chromium-authed` (logged-in redirect).
- **Evals** (`evals/`): runs the real chat pipeline against curated datasets, scored by an LLM judge against thresholds; blocking CI check (`.github/workflows/evals.yml`).

## CI (`.github/workflows/`)

`ci.yml`: install → lint (`oxfmt --check` + `oxlint`), typecheck (`tsgo`), unit (vitest), build (raised heap), e2e (Playwright). `evals.yml`: Poof evals on relevant PRs, posts the report as a PR comment.

## Conventions

- TypeScript strict; `#/*` → `src/*` import alias
- File-based routing; forms via TanStack Form + Zod
- oxfmt + oxlint; `tsgo` typecheck
- Do not edit generated files: `src/routeTree.gen.ts`, `convex/_generated/`, `convex/betterAuth/schema.ts`
- `.cursorrules` documents Sentry instrumentation, Convex schema, and shadcn install conventions
