import { DAY, MINUTE, RateLimiter } from "@convex-dev/rate-limiter";
import { v } from "convex/values";

import { components } from "./_generated/api";
import { mutation } from "./_generated/server";

// Per-IP daily cap is the real abuse ceiling: sessionIds are minted free by
// startNewConversation, so the IP limit is what actually bounds spend.
const rateLimiter = new RateLimiter(components.rateLimiter, {
  chatIpDaily: { kind: "fixed window", rate: 60, period: DAY },
  chatSessionBurst: { kind: "token bucket", rate: 10, period: MINUTE, capacity: 5 },
});

export const checkChatRateLimit = mutation({
  args: {
    ip: v.string(),
    sessionId: v.string(),
  },
  handler: async (ctx, { ip, sessionId }) => {
    const ipStatus = await rateLimiter.limit(ctx, "chatIpDaily", { key: ip });
    const sessionStatus = await rateLimiter.limit(ctx, "chatSessionBurst", { key: sessionId });

    if (!ipStatus.ok || !sessionStatus.ok) {
      const retryAfter = Math.max(ipStatus.retryAfter ?? 0, sessionStatus.retryAfter ?? 0);
      return { allowed: false, retryAfter };
    }

    return { allowed: true, retryAfter: 0 };
  },
});
