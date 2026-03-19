import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "#/lib/auth-client";

// ─── ROUTING ───────────────────────────────────────────────
// TanStack Start uses file-based routing. This file at
// src/routes/login.tsx automatically creates a /login route.
// `createFileRoute` connects this file to the router.
export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  // ─── NAVIGATION ────────────────────────────────────────────
  // useNavigate() gives you programmatic navigation.
  // After successful login, we navigate to "/" instead of
  // using an <a> tag (which would cause a full page reload).
  const navigate = useNavigate();

  // ─── FORM STATE ────────────────────────────────────────────
  // Simple React state for the form. No form library needed
  // for a two-field form.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ─── SUBMITTING TO THE SERVER ──────────────────────────────
  // authClient.signIn.email() makes a POST request to
  // /api/auth/sign-in/email (handled by your api/auth/$.ts route).
  //
  // The flow:
  // 1. authClient POSTs { email, password } to /api/auth/sign-in/email
  // 2. TanStack Start's route handler catches /api/auth/$
  // 3. auth.handler(request) processes the sign-in
  // 4. Better Auth validates credentials via the Convex adapter
  // 5. On success, a session cookie is set (tanstackStartCookies plugin)
  // 6. authClient.useSession() in Header reactively updates
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await authClient.signIn.email({
      email,
      password,
    });

    setLoading(false);

    if (result.error) {
      setError(result.error.message ?? "Sign in failed");
      return;
    }

    // Navigate to home after successful login
    navigate({ to: "/" });
  }

  return (
    <main className="page-wrap flex min-h-[60vh] items-center justify-center px-4 pb-8 pt-14">
      <section className="island-shell w-full max-w-sm rounded-2xl p-6 sm:p-8">
        <h1 className="display-title mb-6 text-2xl font-bold text-[var(--sea-ink)]">
          Sign in
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-[var(--sea-ink)]">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="rounded-lg border border-[var(--line)] bg-[var(--chip-bg)] px-3 py-2 text-sm text-[var(--sea-ink)] outline-none transition focus:border-[rgba(79,184,178,0.5)] focus:ring-2 focus:ring-[rgba(79,184,178,0.2)]"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-[var(--sea-ink)]">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="rounded-lg border border-[var(--line)] bg-[var(--chip-bg)] px-3 py-2 text-sm text-[var(--sea-ink)] outline-none transition focus:border-[rgba(79,184,178,0.5)] focus:ring-2 focus:ring-[rgba(79,184,178,0.2)]"
            />
          </label>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-full bg-[rgba(79,184,178,0.14)] border border-[rgba(50,143,151,0.3)] px-5 py-2.5 text-sm font-semibold text-[var(--lagoon-deep)] transition hover:-translate-y-0.5 hover:bg-[rgba(79,184,178,0.24)] disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {/* ─── LINKING BETWEEN ROUTES ─────────────────────────── */}
        {/* <Link> is TanStack Router's client-side navigation.   */}
        {/* It prefetches on hover (defaultPreload: 'intent')     */}
        {/* and doesn't cause a full page reload like <a>.        */}
        <p className="mt-6 text-center text-sm text-[var(--sea-ink-soft)]">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="font-medium text-[var(--lagoon-deep)] underline">
            Sign up
          </Link>
        </p>
      </section>
    </main>
  );
}
