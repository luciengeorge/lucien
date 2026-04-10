# Lucien

Lucien's personal site and AI portfolio assistant.

The app is a small TanStack Start full-stack app with a public chat UI, Better Auth auth flows, and Convex-backed RAG search over markdown content about Lucien.

## What it does

- Serves a public chat page at `/`
- Answers questions about Lucien using retrieved markdown context from `content/`
- Uses OpenAI for query expansion and final streamed responses
- Supports email/password signup and login with Better Auth
- Stores auth data in Convex and content embeddings in Convex RAG

## Stack

- TanStack Start
- TanStack Router
- React 19
- Tailwind CSS v4
- shadcn-style UI components
- TanStack Form
- Convex
- `@convex-dev/rag`
- Better Auth + `@convex-dev/better-auth`
- Vercel AI SDK + OpenAI
- Sentry
- PostHog
- Vitest

## App structure

```text
src/
  routes/                 Pages and API routes
  components/ui/          Shared UI primitives
  integrations/           Convex, PostHog, React Query providers
  lib/                    Auth, schemas, server helpers, utils
convex/
  betterAuth/             Better Auth Convex component
  search.ts               RAG search action
  seed.ts                 Content seed action
content/                  Markdown knowledge base for Lucien
scripts/seed.ts           Seeds markdown into Convex RAG
```

## Current routes

- `/` chat page
- `/login` login page
- `/signup` signup page
- `/api/chat` streamed chat API
- `/api/auth/$` Better Auth handler

## How chat works

1. User sends a message from `src/routes/index.tsx`
2. Frontend posts to `/api/chat`
3. Server expands the query with OpenAI
4. Server calls Convex RAG search in namespace `portfolio`
5. Retrieved context is injected into `content/system-prompt.md`
6. Server streams the final answer back to the UI

Key files:

- `src/routes/index.tsx`
- `src/routes/api/chat/index.ts`
- `convex/search.ts`
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

- `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are needed for email verification
- PostHog is optional and safely no-ops if unset
- Sentry build upload vars are only needed if you want release uploads/source maps

### 3. Start Convex

```bash
pnpm dlx convex dev
```

If needed, initialize Convex first:

```bash
pnpm dlx convex init
```

### 4. Seed portfolio content

This reads markdown files from `content/` and uploads them to Convex RAG.

```bash
pnpm seed
```

### 5. Run the app

```bash
pnpm dev
```

App runs on `http://localhost:3000`.

## Auth

- Better Auth is configured in `src/lib/auth-config.ts`
- Auth HTTP handler lives at `src/routes/api/auth/$.ts`
- Convex auth integration lives under `convex/betterAuth/`
- Email/password auth is enabled
- Email verification is required

Current route protection is minimal:

- logged-in users are redirected away from `/login` and `/signup`
- `/` and `/api/chat` are public

## Database / persistence

There is no custom app schema yet.

Current persisted data is mostly:

- Better Auth tables in `convex/betterAuth/schema.ts`
  - `user`
  - `session`
  - `account`
  - `verification`
  - `jwks`
- RAG-managed content/indexes from `@convex-dev/rag`

The root Convex schema in `convex/schema.ts` is currently empty.

## Useful commands

```bash
pnpm dev
pnpm build
pnpm start
pnpm test
pnpm typecheck
pnpm lint
pnpm format
pnpm seed
```

## Conventions

- TypeScript strict mode
- File-based routing in `src/routes`
- Forms use TanStack Form + Zod
- Styling uses Tailwind utilities and shared UI primitives
- Use `#/` import alias for app code
- Generated files should not be edited manually:
  - `src/routeTree.gen.ts`
  - `convex/betterAuth/schema.ts`

Formatting/linting:

- `oxfmt`
- `oxlint`

## Observability

- Sentry is wired for client and server
- PostHog provider is mounted globally

Relevant files:

- `src/start.ts`
- `src/server.ts`
- `vite.config.ts`
- `src/integrations/posthog/provider.tsx`

## Testing

Vitest is installed and `pnpm test` is available, but there are currently no test files in the repo.

## Known limitations

- README used to be starter-template content; this file now reflects the current app
- Chat history is not persisted
- No role/permission system yet
- Very small route surface today
- Convex is used mainly for auth + RAG, not broader app data yet

## Adding content

To update Lucien's knowledge base:

1. Add or edit markdown files in `content/`
2. Keep `content/system-prompt.md` for prompt instructions only
3. Run `pnpm seed`

`system-prompt.md` is skipped by the seed script on purpose.
