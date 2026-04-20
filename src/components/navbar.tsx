import { Button } from "#/components/ui/button";
import { AnalyticsEvent, useAnalytics } from "#/lib/analytics";
import { authClient } from "#/lib/auth-client";
import { useState } from "react";

import { Spinner } from "./ui/spinner";

export function Navbar() {
  const { capture } = useAnalytics();
  const { data: session } = authClient.useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (session?.user) {
    return (
      <div className="flex w-full items-center justify-end gap-2 p-3">
        <div className="flex size-7 items-center justify-center rounded-md bg-muted">
          <span className="text-xs font-medium text-muted-foreground">
            {session.user.name?.charAt(0).toUpperCase() || "U"}
          </span>
        </div>
        <Button
          variant="outline"
          disabled={isLoggingOut}
          onClick={async () => {
            setIsLoggingOut(true);
            capture(AnalyticsEvent.userLogoutStarted);
            try {
              await authClient.signOut();
              capture(AnalyticsEvent.userLoggedOut);
            } catch (error) {
              capture(AnalyticsEvent.userLogoutFailed, {
                error_message: error instanceof Error ? error.message : "Unknown logout error",
              });
            } finally {
              setIsLoggingOut(false);
            }
          }}
        >
          {isLoggingOut ? (
            <>
              <Spinner />
              Logging out
            </>
          ) : (
            "Logout"
          )}
        </Button>
      </div>
    );
  }

  return null;
}
