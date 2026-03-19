import { Button, buttonVariants } from "#/components/ui/button";
import { authClient } from "#/lib/auth-client";
import { Link } from "@tanstack/react-router";

export default function BetterAuthHeader() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <div className="h-7 w-16 animate-pulse rounded-md bg-muted" />;
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-md bg-muted">
          <span className="text-xs font-medium text-muted-foreground">
            {session.user.name?.charAt(0).toUpperCase() || "U"}
          </span>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            void authClient.signOut();
          }}
        >
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <Link to="/login" className={buttonVariants({ variant: "outline" })}>
      Sign in
    </Link>
  );
}
