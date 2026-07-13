import { v } from "convex/values";

import { action } from "./_generated/server";
import { rag } from "./rag";

export const searchContext = action({
  args: { query: v.string() },
  handler: async (ctx, { query }) => {
    const { text } = await rag.search(ctx, {
      namespace: "portfolio",
      query,
      limit: 8,
      vectorScoreThreshold: 0.4,
    });
    return text;
  },
});
