# Codebase Architecture Summary

## Overview

TanStack Start application with comprehensive UI component library, real-time data streaming, multi-service integrations, and theme management system.

## Technology Stack

- **Framework**: TanStack Start (Vite-based)
- **UI Library**: shadcn/ui (Radix UI + Tailwind CSS)
- **Component Styling**: CVA (Class Variance Authority) for variant management
- **Authentication**: better-auth with TanStack Start cookies plugin
- **Backend**: Convex with ConvexQueryClient
- **Data Fetching**: TanStack Query (React Query)
- **Routing**: TanStack Router
- **Forms**: TanStack Form with custom createFormHook() pattern
- **Analytics**: PostHog (conditional initialization via environment variables)
- **Data Synchronization**: TanStack react-db collections for real-time streaming
- **Styling**: Tailwind CSS with comprehensive dark mode (prefers-color-scheme)
- **Build Tool**: Vite with environment variable access via import.meta

## Directory Structure & Findings

### /src/components/

#### UI Components (shadcn/ui Pattern)

All UI components follow consistent patterns:

- Built on Radix UI primitives
- Styled with Tailwind CSS
- Use CVA for variant management
- Support dark mode via className/data attributes
- Include accessibility features (aria-invalid, focus-visible states)

**Core Components:**

- **Button**: Variants (default, destructive, outline, secondary, ghost, link), Sizes (default, xs, sm, lg, icon)
- **Input**: Standard form input with file upload styling
- **Slider**: Range input control
- **Label**: Form label component
- **Switch**: Toggle switch control
- **Select**: Dropdown selection
- **Textarea**: Multi-line text input

#### Feature Components

- **Header.tsx**: Sticky navigation with backdrop blur, theme toggle, user session display, TanStackChat integration
- **ThemeToggle.tsx**: Light/dark/auto theme switcher with localStorage persistence
- **demo.chat-area.tsx, demo.messages.tsx**: Chat interface components with streaming data
- **demo.FormComponents.tsx**: Form-related components using TanStack Form
- **demo-GuitarRecommendation.tsx**: Product recommendation using static guitar data
- **demo-AIAssistant.tsx**: AI assistant integration
- **Footer.tsx**: Footer component

#### Integration Components

- **better-auth/header-user.tsx**: User session display with sign-in/sign-out functionality

#### Styling Patterns

- `cn()` utility combines clsx and tailwind-merge for className composition
- CSS variables for theming (referenced in Header.tsx)
- Responsive design with dark mode variants
- Disabled and invalid states handled consistently

### /src/hooks/

#### Custom Data Hooks

**demo.useChat.ts**

- `useStreamConnection()`: Helper for streaming JSON-newline data from /demo/db-chat-api
- `useMessages()`: Live query results from TanStack react-db messagesCollection
- `sendMessage()`: POST request handler for sending chat messages

#### Form Hooks

**demo.form.ts**

- `createFormHook()` pattern: Custom TanStack Form integration
- Custom field components: TextField, Select, TextArea
- Custom form components: SubscribeButton
- fieldContext and formContext for component integration

#### Utility Hooks

- **demo-useAudioRecorder.ts**: Audio recording functionality
- **demo-useTTS.ts**: Text-to-speech functionality
- **demo.form-context.ts**: Form context utilities and hooks

### /src/lib/

#### Utilities

**utils.ts**

- `cn()`: Core utility combining clsx + tailwind-merge for className composition

#### Integration Setup

**auth.ts**

- better-auth initialization with email/password strategy
- tanstackStartCookies plugin for session management
- Server-side auth configuration

**auth-client.ts**

- Client-side better-auth via createAuthClient()
- Returns reactive auth client for React components
- Used in header-user component for session display

### /src/integrations/

#### Convex Integration (convex/provider.tsx)

- ConvexQueryClient initialization
- Environment variable: VITE_CONVEX_URL
- Error logging for missing configuration
- Wraps application tree

#### PostHog Analytics (posthog/provider.tsx)

- Conditional initialization via VITE_POSTHOG_KEY
- Configuration: person_profiles: 'identified_only', capture_pageview: false
- API host defaults to 'https://us.i.posthog.com'
- Client-side only (window check)

#### TanStack Query (tanstack-query/)

**root-provider.tsx**

- Singleton QueryClient pattern via getContext()
- Single instance across application
- QueryClientProvider wraps app tree

**devtools.tsx**

- ReactQueryDevtoolsPanel export for development

### /src/data/

**demo-guitars.ts**

- Static product data: 8 themed guitars
- Guitar interface: id, name, image, description, shortDescription, price
- Products: TanStack Ukulele, Video Game, Superhero, Motherboard, Racing, Steamer Trunk, Traveling Man, Flowerly Love

### Core Files

- **db-collections/index.ts**: Database collections configuration
- **start.ts**: Application entry point
- **router.tsx**: TanStack Router configuration
- **routeTree.gen.ts**: Auto-generated route tree

## Architectural Patterns

### State Management

1. **Server State**: Convex (backend persistence)
2. **Sync State**: TanStack react-db collections (real-time streaming)
3. **Client State**: TanStack Form (form-specific), React state for UI
4. **Server Session**: better-auth with TanStack Start cookies

### Data Streaming

- JSON-newline format from /demo/db-chat-api
- useStreamConnection() helper handles subscription lifecycle
- TanStack react-db collections provide live query results
- Automatic re-renders on data changes

### Theme System

- localStorage persistence of user selection
- System preference detection via prefers-color-scheme
- Three modes: light, dark, auto
- Applied via className on document.documentElement
- data-theme attribute + colorScheme style property

### Authentication Flow

1. better-auth handles credentials
2. tanstackStartCookies plugin manages sessions
3. Client-side authClient.useSession() checks authentication status
4. Route protection via router integration

### Form Handling

1. TanStack Form with custom createFormHook() pattern
2. Field components via fieldContext
3. Form context for cross-field access
4. Custom components for domain-specific inputs

### Component Library

1. All components use CVA for variants
2. Consistent Tailwind styling
3. Accessibility-first (aria attributes, focus states)
4. Dark mode support via CSS utilities
5. Polymorphic components via Radix Slot (asChild pattern)

## Integration Architecture

```
Application Root
├── TanStack Router
├── Convex Provider (ConvexQueryClient)
├── PostHog Provider (conditional)
├── TanStack Query Provider (singleton QueryClient)
├── Header (Theme Toggle, User Session, TanStackChat)
├── Main Content (Routes)
└── Footer
```

## Development Environment

- Vite with hot module replacement
- Environment variables via import.meta.env.VITE\_\*
- Development tools: React Query DevTools
- TypeScript for type safety

## Key Configuration Dependencies

- VITE_CONVEX_URL: Backend connection
- VITE_POSTHOG_KEY: Analytics (optional)
- No API keys stored in code (environment-based)

## Notable Implementation Details

1. **Singleton Pattern**: QueryClient ensures single instance across app
2. **Streaming Pattern**: JSON-newline for real-time data sync
3. **Theme Persistence**: localStorage + system preference fallback
4. **Error Boundaries**: Implied through integration setup (check for in routes)
5. **Responsive Design**: All components support mobile via Tailwind breakpoints
6. **Accessibility**: Focus states, aria-invalid, labels properly associated
7. **Dark Mode**: Comprehensive support across all components via CSS utilities

## Future Development Considerations

- Add more UI components as needed (follow shadcn/ui + CVA pattern)
- Extend form components via createFormHook() for new domain models
- Additional integrations via providers pattern (follow Convex/PostHog setup)
- Real-time features leverage TanStack react-db collections
- Theme system extensible via CSS variables
- Authentication extensible via better-auth strategies
