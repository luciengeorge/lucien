import { action } from "./_generated/server";
import { v } from "convex/values";

import { rag } from "./rag";

export const searchContext = action({
  args: { query: v.string() },
  handler: async (ctx, { query }) => {
    const { text } = await rag.search(ctx, {
      namespace: "portfolio",
      query,
      limit: 5,
      vectorScoreThreshold: 0.4,
    });
    return text;
  },
});
