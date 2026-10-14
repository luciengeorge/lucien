# Codebase Architecture

Lucien George's personal site + AI portfolio assistant ("Poof"). A single TanStack Start app (SSR) deployed to Vercel, backed by Convex, that answers questions about Lucien from the markdown in `content/` (sent whole in the prompt) and serves static work/resume/about pages.

## Technology stack

- **Framework**: TanStack Start (Vite + Nitro), React 19 + React Compiler
- **Routing**: TanStack Router (file-based, `defaultPreload: "intent"`)
- **Data**: TanStack Query + `@convex-dev/react-query`
- **Forms**: TanStack Form + Zod
- **Backend**: Convex (`@convex-dev/better-auth`, `@convex-dev/rate-limiter`)
- **AI**: Vercel AI SDK (`ai` v6) + OpenAI (`gpt-5.6-luna` for chat, intro and digest)
- **Auth**: Better Auth (email/password, verification, owner-only allowlist)
- **UI**: shadcn-style components on Base UI / Radix + CVA, Tailwind CSS v4, `motion`, `sonner`, hugeicons/lucide
- **PDF**: `@react-pdf/renderer` (resume)
- **Observability**: Sentry, PostHog, Vercel Analytics + Speed Insights
- **Quality**: Vitest (convex/node/jsdom), Playwright (e2e), Poof eval harness; oxfmt + oxlint, `tsgo` typecheck
- **Runtime**: pnpm, Node 22; deployed on Vercel

## Top-level layout

```
src/        frontend + API routes (TanStack Start)
convex/     Convex backend (schema, functions, components)
content/    markdown knowledge base + system-prompt.md + resume.json
evals/      Poof eval harness
scripts/    refresh-intro.ts (corpus → cached intro in Convex)
tests/e2e/  Playwright specs
```

## Request / data flow

```
Browser ──► TanStack Start (Nitro / Vercel)
              ├─ SSR pages (router + loaders)
              ├─ /api/chat   ─► OpenAI (stream, whole corpus in prompt) ─► Convex (persist)
              ├─ /api/auth/$ ─► Better Auth ─► Convex betterAuth component
              └─ /api/resume/pdf ─► @react-pdf/renderer
            Convex
              ├─ conversations / messages / messageParts
              ├─ intros (cached homepage intro)
              ├─ rateLimiter component
              └─ betterAuth component (user/session/account/...)
```

### Provider tree (`src/routes/__root.tsx`)

`ConvexProvider` → `TanStackQueryProvider` → (`PostHogInit`, `Toaster`, `SiteNav`, `<main>{routes}</main>`, devtools), with Vercel Analytics + Speed Insights and JSON-LD in the document shell.

### Entry points

- `src/start.ts` - client entry
- `src/server.ts` - server entry
- `src/router.tsx` - `getRouter()`; lazy-inits the Sentry browser SDK in prod
- `instrument.server.mjs` - server Sentry/OTel, loaded via `NODE_OPTIONS=--import`

## Frontend (`src/`)

### Routes (`src/routes/`)

File-based. Pages: `/` (chat), `/about`, `/skills`, `/education`, `/contact`, `/privacy`, `/work` + `/work/$slug`, `/writing` + `/writing/$slug`, `/resume`, `/login`, `/signup`. API: `/api/chat` (POST), `/api/auth/$`, `/api/resume/pdf`. SEO: `/sitemap.xml`, `/llms.txt`, `/llms-full.txt`. Agent surface: a `.md` twin of every page (filenames escape the dot, e.g. `about[.]md.ts`) plus `/index.md` and `/agents.md`; `src/lib/markdown-negotiation.ts` parses `Accept` with q-values and `src/lib/agent-representation.ts` rewrites the request to the twin, so a client that prefers markdown gets source instead of HTML. `__root.tsx` owns global SEO meta + JSON-LD (Organization / Person / WebSite / FAQPage); per-route heads add page-specific meta + structured data via `buildSeoHead`. `routeTree.gen.ts` is generated; `*.test.ts` files colocated here are excluded from it by `routeFileIgnorePattern` in `vite.config.ts`.

### Components (`src/components/`)

- `chat/` - the chat UI (composer, conversation, timeline message, pending reply, markdown render, starter prompts, resume card, etc.)
- `ui/` - shadcn-style primitives (Base UI / Radix + CVA): button, card, dropdown-menu, input, field, label, select, separator, slider, switch, textarea, tooltip, scroll-area, spinner, sonner, empty, nav-link
- `content/content-page.tsx` - shared markdown page layout
- `resume/company-logo.tsx`, `site-nav.tsx`, `download-cv-button.tsx`, `global-loading.tsx`, `initials-mark.tsx`, `not-found.tsx`

### Lib (`src/lib/`)

- `content/registry.ts` + `content/{work,writing}-meta.ts` - single source for work and writing entries; the meta files carry no `?raw` imports so Playwright specs can import them, and `registry.ts` joins them to the markdown
- `content/{markdown,markdown-page,page-meta,site-index,agent-instructions,homepage-fallback,article-date}.ts` - markdown rendering (`marked`), YAML frontmatter for the `.md` twins, and the shared title/description source so head tags and markdown never drift
- `markdown-negotiation.ts`, `agent-representation.ts`, `not-found-markdown.ts` - RFC 9110 `Accept` negotiation and the markdown 404
- `seo.ts` (`buildSeoHead`), `structured-data.ts` (JSON-LD `@graph`), `site-config.ts`, `name-misspellings.ts`
- `page-caching.ts` - sets `Cache-Control` on HTML SSR responses only (never on a `Set-Cookie` response)
- `resume/{load,schema,pdf-document,markdown}` - resume loading (zod-validated), formatting, PDF, markdown
- `auth-config.ts` / `auth-client.ts` / `auth-server.ts` - Better Auth wiring
- `conversation-session.server.ts`, `toast-session.server.ts` - sealed-cookie sessions (`TOAST_SECRET`)
- `functions/` - server functions: `get-session`, `get-toast`, `set-toast`, `redirect-with-toast`, `start-new-conversation`
- `chat-types.ts`, `chat-intro.ts`, `chat/tools.ts`, `link-work-entry.ts`, `conversation-intro.server.ts`, `notify-slack.ts` - chat request/message schemas and the three chat tools
- `analytics.ts` (typed PostHog events), `logger.ts`, `correlation-id.ts`, `strip-dashes.ts`, `social-links.ts`, `homepage-intro.ts`, `work-slug-for-company.ts`, `scroll-restoration.ts`, `use-pending-nav.ts`, `toast.ts`, `schemas/auth.ts`, `utils.ts` (`cn()`)

## Backend (`convex/`)

### Schema (`convex/schema.ts`)

- **conversations** - `createdAt`, `updatedAt`, `sessionId?`, `title?`; indexes by created/updated/session
- **messages** - `conversationId`, `role`, `uiMessageId`, `createdAt`, `modelId?`, `provider?`, `metadataJson?`; indexes by conversation, by (conversation, uiMessageId), by created
- **messageParts** - `messageId`, `order`, `partJson`, `type`, plus `textPreview?` / `toolCallId?` / `toolName?` / `toolState?`; index by message

UI messages are stored as JSON parts with extracted columns for queryability. Better Auth tables live in the betterAuth component (`convex/betterAuth/schema.ts`, generated).

### Functions

- `conversations.ts` - `createConversation`, `getConversationById` (ownership-checked, hydrates parts), `upsertConversationMessage` (zod-validated, derives title)
- `intro.ts` - `refreshIntro({ contentHash, corpus })` (internal) generates the intro from the full corpus once per `INTRO_VERSION` + content hash and stores it in `intros` (`key`, `text`, `promotedAt`); a rerun or rollback re-promotes the existing row instead; `getCachedIntro` (public) returns the current one, or `null` before the first refresh (callers use `HOMEPAGE_INTRO_FALLBACK`). No TTL
- `http.ts` - registers Better Auth routes (CORS)

## Content (`content/`)

Markdown is the single source of truth for the chat prompt (the whole corpus, bundled at build), the cached intro, and the rendered HTML pages + `/llms-full.txt`. Files: bio, personal, education, tech-stack, socials, contact, privacy, signature-work, one per work entry (fyxer, localista, skyla, shopify, le-wagon, impact-lebanon, early-career), and `writing/` for articles. `socials.md` and `signature-work.md` feed the corpus but are never rendered as pages. `system-prompt.md` holds Poof's prompt (`{context}` and `{today}` slots, filled only via `renderSystemPrompt` in `src/lib/chat/system-prompt.ts`; excluded from the corpus). `resume.json` is structured and validated by `src/lib/resume/schema.ts`. `scripts/refresh-intro.ts` (`pnpm intro:refresh`, dev deployment) builds the corpus from disk (`evals/corpus.ts` `readCorpusFromDisk`), hashes it (sha256, 16 hex chars) and runs `intro:refreshIntro`. CI does the same on prod via `.github/workflows/intro.yml` ("Refresh intro"; after every successful production deploy via `deployment_status`, plus `workflow_dispatch`; `CONVEX_DEPLOY_KEY`). It waits for the deploy because Vercel's build command (`pnpm dlx convex deploy --cmd 'pnpm build'`) is what deploys Convex. Content edits need no manual step: chat picks them up on the next Vercel deploy. A bumped `INTRO_VERSION` ships the same way: merge, Vercel deploys Convex, the workflow refreshes.

## Sessions (three, independent)

1. **Better Auth session** - owner login (allowlisted).
2. **Conversation session** - anonymous visitor; sealed cookie `lucien-conversation` (`TOAST_SECRET`) holding `{ sessionId, conversationId }`; authorizes chat access.
3. **Toast session** - one-shot flash messages; read client-side after hydration so the SSR homepage stays cookie-free and edge-cacheable.

## Chat pipeline (`src/routes/api/chat/index.ts`)

1. Validate body (`ChatRequestSchema`) and the conversation-session cookie.
2. Load the conversation from Convex; validate UI messages.
3. Fill `system-prompt.md` with the whole `content/` corpus (bundled at build via `import.meta.glob`, rendered by `src/lib/chat/corpus.ts`) and today's date. No query rewrite or vector search: the corpus is ~9k tokens.
4. Persist the user message; stream the answer (`gpt-5.6-luna`, `stepCountIs(3)`) with the `download_resume`, `link_work_entry` and `contact_lucien` tools.
5. `onFinish` persists the assistant message.

The homepage's first message is a cached LLM intro (`convex/intro.ts`) read cookie-free and baked into first paint.

## Build, deploy, observability

- **Vite** (`vite.config.ts`): TanStack Start, Nitro, Tailwind, React (React Compiler), Sentry source-map upload.
- **Nitro** (`nitro.config.ts`): security headers on all routes; homepage edge-cached (`s-maxage=86400`, SWR); `/api/**` `no-store`; `/resume.pdf` → 301.
- **Sentry**: browser (lazy) + server (`instrument.server.mjs`); source maps at build.
- **PostHog**: global provider, conditional on `VITE_POSTHOG_KEY`; typed events in `src/lib/analytics.ts`.
- **Vercel** Analytics + Speed Insights.

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
