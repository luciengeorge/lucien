import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { authClient } from "#/lib/auth-client";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

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
  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await authClient.signIn.email({ email, password });

    setLoading(false);

    if (result.error) {
      setError(result.error.message ?? "Sign in failed");
      return;
    }

    navigate({ to: "/" });
  }

  return (
    <main className="page-wrap flex min-h-[60vh] items-center justify-center px-4 pb-8 pt-14">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="display-title text-2xl font-bold tracking-tight text-foreground">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to your account</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={loading} size="lg" className="mt-1 w-full">
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>

        {/* ─── LINKING BETWEEN ROUTES ─────────────────────────── */}
        {/* <Link> is TanStack Router's client-side navigation.   */}
        {/* It prefetches on hover (defaultPreload: 'intent')     */}
        {/* and doesn't cause a full page reload like <a>.        */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="font-medium text-primary underline underline-offset-4">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
