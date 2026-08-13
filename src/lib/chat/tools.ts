import { buildLinkWorkEntryOutput, WORK_ENTRY_SLUGS } from "#/lib/link-work-entry";
import { tool } from "ai";
import { z } from "zod";

interface PostContactInput {
  contact?: string;
  conversationId: string;
  message: string;
  name?: string;
}

export interface ChatToolDeps {
  conversationId: string;
  /** Injected so the eval harness can run the real tool shape without messaging Lucien. */
  postContact: (input: PostContactInput) => Promise<boolean>;
}

/**
 * The tools Poof can call. Shared by the chat route and the eval harness: when
 * only one side had them, the system prompt told the eval's model to call
 * `link_work_entry`, and with no tool to call it wrote the call out as prose.
 */
export function buildChatTools({ conversationId, postContact }: ChatToolDeps) {
  return {
    download_resume: tool({
      description:
        "Provide Lucien's resume as a downloadable PDF. Call this when the user asks for Lucien's resume, CV, or PDF.",
      inputSchema: z.object({}),
      execute: async () => ({
        filename: "lucien-george-resume.pdf",
        url: "/api/resume/pdf",
      }),
    }),
    link_work_entry: tool({
      description:
        "Link to the case study page for one of Lucien's work entries. Call this when pointing the user to more detail on a specific role or project.",
      inputSchema: z.object({ slug: z.enum(WORK_ENTRY_SLUGS) }),
      execute: async ({ slug }) => buildLinkWorkEntryOutput(slug),
    }),
    contact_lucien: tool({
      description:
        "Send a message to Lucien on the visitor's behalf. Call this once the visitor has given a genuine message to send, along with their name and/or contact info if available.",
      inputSchema: z.object({
        contact: z.string().max(200).optional(),
        message: z.string().min(1).max(2000),
        name: z.string().max(120).optional(),
      }),
      execute: async ({ contact, message, name }) => {
        const sent = await postContact({ contact, conversationId, message, name });
        return { status: sent ? "sent" : "failed" };
      },
    }),
  };
}
