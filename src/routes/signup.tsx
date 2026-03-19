import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "#/lib/auth-client";

// ─── ROUTING ───────────────────────────────────────────────
// src/routes/signup.tsx → /signup route.
// Same pattern as login.tsx. TanStack Start auto-registers
// every file in src/routes/ into the route tree.
export const Route = createFileRoute("/signup")({ component: SignupPage });

function SignupPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ─── SIGN UP FLOW ──────────────────────────────────────────
  // authClient.signUp.email() POSTs to /api/auth/sign-up/email.
  //
  // What happens on the server:
  // 1. Better Auth receives { name, email, password }
  // 2. Convex adapter creates a `user` document in the user table
  // 3. Convex adapter creates an `account` document (providerId: "credential")
  //    with the hashed password
  // 4. A session is created in the session table
  // 5. Session cookie is set → user is logged in immediately
  //
  // So after signUp, you have 3 new Convex documents:
  //   - user: { name, email, emailVerified: false, ... }
  //   - account: { providerId: "credential", password: <hashed>, userId: <user._id> }
  //   - session: { token: <uuid>, userId: <user._id>, expiresAt: <timestamp> }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await authClient.signUp.email({
      name,
      email,
      password,
    });

    setLoading(false);

    if (result.error) {
      setError(result.error.message ?? "Sign up failed");
      return;
    }

    navigate({ to: "/" });
  }

  return (
    <main className="page-wrap flex min-h-[60vh] items-center justify-center px-4 pb-8 pt-14">
      <section className="island-shell w-full max-w-sm rounded-2xl p-6 sm:p-8">
        <h1 className="display-title mb-6 text-2xl font-bold text-[var(--sea-ink)]">
          Create account
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-[var(--sea-ink)]">Name</span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="rounded-lg border border-[var(--line)] bg-[var(--chip-bg)] px-3 py-2 text-sm text-[var(--sea-ink)] outline-none transition focus:border-[rgba(79,184,178,0.5)] focus:ring-2 focus:ring-[rgba(79,184,178,0.2)]"
            />
          </label>

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
              minLength={8}
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
            {loading ? "Creating account…" : "Sign up"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--sea-ink-soft)]">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-[var(--lagoon-deep)] underline">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
