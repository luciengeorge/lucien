import { Button } from "#/components/ui/button";
import { authClient } from "#/lib/auth-client";
import { useState } from "react";

import { Spinner } from "./ui/spinner";

export function Navbar() {
  const { data: session } = authClient.useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (session?.user) {
    return (
      <div className="flex items-center w-full justify-end p-3 gap-2">
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
            try {
              await authClient.signOut();
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
