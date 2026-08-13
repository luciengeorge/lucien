import { describe, expect, it, vi } from "vitest";

import { buildChatTools } from "./tools";

describe("buildChatTools", () => {
  it("exposes exactly the three tools the system prompt refers to", () => {
    const tools = buildChatTools({ conversationId: "conv-1", postContact: vi.fn() });
    expect(Object.keys(tools).sort()).toEqual(["contact_lucien", "download_resume", "link_work_entry"]);
  });

  it("download_resume returns the pdf route", async () => {
    const tools = buildChatTools({ conversationId: "conv-1", postContact: vi.fn() });
    const result = await tools.download_resume.execute?.({}, { messages: [], toolCallId: "t1" });
    expect(result).toEqual({ filename: "lucien-george-resume.pdf", url: "/api/resume/pdf" });
  });

  it("link_work_entry resolves a slug to its work entry url", async () => {
    const tools = buildChatTools({ conversationId: "conv-1", postContact: vi.fn() });
    const result = await tools.link_work_entry.execute?.({ slug: "shopify" }, { messages: [], toolCallId: "t2" });
    expect(result).toMatchObject({ slug: "shopify", url: "/work/shopify" });
  });

  /*
   * contact_lucien is the one tool with a side effect, so it takes its sender
   * by injection: the eval harness needs the same tool shape as production
   * without messaging Lucien 57 times per run.
   */
  it("contact_lucien delegates to the injected sender, with the conversation id", async () => {
    const postContact = vi.fn().mockResolvedValue(true);
    const tools = buildChatTools({ conversationId: "conv-9", postContact });

    const result = await tools.contact_lucien.execute?.(
      { message: "hello", name: "Ada" },
      { messages: [], toolCallId: "t3" },
    );

    expect(postContact).toHaveBeenCalledWith({
      contact: undefined,
      conversationId: "conv-9",
      message: "hello",
      name: "Ada",
    });
    expect(result).toEqual({ status: "sent" });
  });

  it("contact_lucien reports failure when the sender fails", async () => {
    const tools = buildChatTools({ conversationId: "conv-9", postContact: vi.fn().mockResolvedValue(false) });
    const result = await tools.contact_lucien.execute?.({ message: "hello" }, { messages: [], toolCallId: "t4" });
    expect(result).toEqual({ status: "failed" });
  });
});
