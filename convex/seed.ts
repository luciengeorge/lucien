import { action } from "./_generated/server";
import { v } from "convex/values";

import { rag } from "./rag";

export const addContent = action({
  args: {
    title: v.string(),
    text: v.string(),
  },
  handler: async (ctx, { title, text }) => {
    const { entryId, usage } = await rag.add(ctx, {
      namespace: "portfolio",
      title,
      text,
    });
    console.log(`Added "${title}" (${entryId}), tokens: ${usage.tokens}`);
    return { entryId };
  },
});
