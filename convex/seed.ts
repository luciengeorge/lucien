import { v } from "convex/values";

import { action } from "./_generated/server";
import { rag } from "./rag";

const PORTFOLIO_NAMESPACE = "portfolio";

export const resetNamespace = action({
  args: {},
  handler: async (ctx) => {
    const namespace = await rag.getNamespace(ctx, {
      namespace: PORTFOLIO_NAMESPACE,
    });

    if (!namespace) {
      return { deletedEntries: 0 };
    }

    let deletedEntries = 0;
    let cursor: string | null = null;

    while (true) {
      const { continueCursor, isDone, page } = await rag.list(ctx, {
        namespaceId: namespace.namespaceId,
        order: "desc",
        paginationOpts: {
          cursor,
          numItems: 100,
        },
      });

      for (const entry of page) {
        await rag.delete(ctx, { entryId: entry.entryId });
        deletedEntries += 1;
      }

      if (isDone) {
        break;
      }

      cursor = continueCursor;
    }

    return { deletedEntries };
  },
});

export const addContent = action({
  args: {
    title: v.string(),
    text: v.string(),
  },
  handler: async (ctx, { title, text }) => {
    const { entryId, usage } = await rag.add(ctx, {
      namespace: PORTFOLIO_NAMESPACE,
      title,
      text,
    });
    console.log(`Added "${title}" (${entryId}), tokens: ${usage.tokens}`);
    return { entryId };
  },
});
