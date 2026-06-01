import { getPostHog } from "#/integrations/posthog/client";
import { authClient } from "#/lib/auth-client";
import { useCallback } from "react";

export const AnalyticsEvent = {
  chatMessageSubmitted: "chat_message_submitted",
  chatResponseCompleted: "chat_response_completed",
  chatResponseFailed: "chat_response_failed",
  conversationResumed: "conversation_resumed",
  newConversationClicked: "new_conversation_clicked",
  portfolioViewed: "portfolio_viewed",
  resumeDownloaded: "resume_downloaded",
  resumeRequested: "resume_requested",
  starterPromptClicked: "starter_prompt_clicked",
  userLoggedIn: "user_logged_in",
  userLoginFailed: "user_login_failed",
  userLoginSubmitted: "user_login_submitted",
  userLoggedOut: "user_logged_out",
  userLogoutFailed: "user_logout_failed",
  userLogoutStarted: "user_logout_started",
  userSignedUp: "user_signed_up",
  userSignupFailed: "user_signup_failed",
  userSignupSubmitted: "user_signup_submitted",
} as const;

type AnalyticsEventName = (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent];

type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

function getBaseProperties(userId?: string): AnalyticsProperties {
  return {
    app: "lucien",
    authenticated: Boolean(userId),
    path: typeof window === "undefined" ? undefined : window.location.pathname,
    source: "web",
    timestamp: new Date().toISOString(),
    user_id: userId,
  };
}

export function useAnalytics() {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  const capture = useCallback(
    (event: AnalyticsEventName, properties: AnalyticsProperties = {}) => {
      getPostHog()?.capture(event, {
        ...getBaseProperties(userId),
        ...properties,
      });
    },
    [userId],
  );

  return {
    capture,
  };
}
