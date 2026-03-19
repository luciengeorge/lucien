import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { authClient } from "#/lib/auth-client";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

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

    const result = await authClient.signUp.email({ name, email, password });

    setLoading(false);

    if (result.error) {
      setError(result.error.message ?? "Sign up failed");
      return;
    }

    navigate({ to: "/" });
  }

  return (
    <main className="page-wrap flex min-h-[60vh] items-center justify-center px-4 pb-8 pt-14">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="display-title text-2xl font-bold tracking-tight text-foreground">Create account</h1>
          <p className="mt-2 text-sm text-muted-foreground">Get started with Lucien</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>

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
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={loading} size="lg" className="mt-1 w-full">
              {loading ? "Creating account…" : "Sign up"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
