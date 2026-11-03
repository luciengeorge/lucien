import { WORK_META } from "#/lib/content/work-meta";
import { WRITING_META } from "#/lib/content/writing-meta";
import { z } from "zod";

/**
 * The site's WebMCP tools, kept free of React so the security-relevant parts
 * (the page allowlist, the output cap, errors as values) are unit-tested here.
 *
 * Every tool works on public pages only, by id from a fixed allowlist. Nothing
 * takes a free-form path or URL, sends cookies, spends money, or writes data.
 */

/** Google's WebMCP guidance: keep each tool result around 400 tokens. */
export const MAX_OUTPUT_CHARS = 1500;
const PART_CHARS = 1000;

export interface SitePage {
  id: string;
  title: string;
  path: string;
  markdownPath: string;
}

function page(id: string, title: string): SitePage {
  const path = id === "home" ? "/" : `/${id}`;
  return { id, title, path, markdownPath: id === "home" ? "/index.md" : `${path}.md` };
}

export const SITE_PAGES: readonly SitePage[] = [
  page("home", "Home: chat with Poof, Lucien's AI assistant"),
  page("about", "About Lucien"),
  page("work", "Work history"),
  ...WORK_META.map((entry) => page(`work/${entry.slug}`, `${entry.role} at ${entry.company}, ${entry.period}`)),
  page("writing", "Writing"),
  ...WRITING_META.map((entry) => page(`writing/${entry.slug}`, entry.title)),
  page("skills", "Skills and tech stack"),
  page("education", "Education"),
  page("resume", "Resume (links the PDF)"),
  page("contact", "Contact"),
  page("privacy", "Privacy"),
];

const PAGE_IDS = SITE_PAGES.map((sitePage) => sitePage.id);
const PageId = z.enum(PAGE_IDS);

export interface ToolResult {
  content: Array<{ type: "text"; text: string }>;
  isError?: true;
}

type ErrorCode = "fetch_failed" | "part_out_of_range" | "unknown_page";

function ok(value: unknown): ToolResult {
  return { content: [{ type: "text", text: typeof value === "string" ? value : JSON.stringify(value) }] };
}

/** Resolved, never thrown, so the agent always gets a reason it can act on. */
function toolError(code: ErrorCode, error: string, retryable: boolean): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify({ error, code, retryable }) }], isError: true };
}

function findPage(input: unknown): SitePage | undefined {
  const parsed = z.object({ page: PageId }).safeParse(input);
  return parsed.success ? SITE_PAGES.find((sitePage) => sitePage.id === parsed.data.page) : undefined;
}

const unknownPage = () => toolError("unknown_page", "Unknown page. Call list_pages for the valid ids.", false);

export function listPages(): ToolResult {
  return ok(SITE_PAGES.map((sitePage) => `${sitePage.id}: ${sitePage.title}`).join("\n"));
}

export type Fetcher = (input: string, init: RequestInit) => Promise<Response>;

export async function readPage(
  input: unknown,
  { fetcher = fetch, signal }: { fetcher?: Fetcher; signal?: AbortSignal } = {},
): Promise<ToolResult> {
  const sitePage = findPage(input);
  if (!sitePage) return unknownPage();
  const part = z.object({ part: z.number().int().min(1).default(1) }).safeParse(input).data?.part ?? 1;

  let markdown: string;
  try {
    const response = await fetcher(sitePage.markdownPath, {
      credentials: "omit",
      headers: { Accept: "text/markdown" },
      signal,
    });
    if (!response.ok || !response.headers.get("Content-Type")?.startsWith("text/markdown")) {
      return toolError("fetch_failed", `Could not load ${sitePage.id} (HTTP ${response.status}).`, true);
    }
    markdown = await response.text();
  } catch {
    return toolError("fetch_failed", `Could not load ${sitePage.id}.`, true);
  }

  // Split by code point so a part never ends halfway through an emoji.
  const characters = Array.from(markdown);
  const totalParts = Math.max(1, Math.ceil(characters.length / PART_CHARS));
  if (part > totalParts) {
    return toolError("part_out_of_range", `${sitePage.id} has ${totalParts} part(s).`, false);
  }

  const text = characters.slice((part - 1) * PART_CHARS, part * PART_CHARS).join("");
  return ok({ page: sitePage.id, part, totalParts, ...(part < totalParts && { nextPart: part + 1 }), text });
}

export async function openPage(
  input: unknown,
  { navigate }: { navigate: (href: string) => Promise<void> },
): Promise<ToolResult> {
  const sitePage = findPage(input);
  if (!sitePage) return unknownPage();
  await navigate(sitePage.path);
  return ok(`Opened ${sitePage.path}. Call read_page with the same id to read it.`);
}

interface ToolProperty {
  type: "integer" | "string";
  description: string;
  enum?: readonly string[];
  minimum?: number;
}

interface SiteToolDefinition {
  name: "list_pages" | "open_page" | "read_page";
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, ToolProperty>;
    required?: string[];
    additionalProperties: false;
  };
  annotations?: { readOnlyHint: true };
}

const pageProperty: ToolProperty = {
  type: "string",
  enum: PAGE_IDS,
  description: "Page id from list_pages, e.g. about, resume, or work/fyxer.",
};

export const SITE_TOOL_DEFINITIONS: readonly SiteToolDefinition[] = [
  {
    name: "list_pages",
    description:
      "List every page on Lucien George's portfolio site with its id and title. Use it first to find the page that answers a question about Lucien's work, writing, skills, education, resume, or contact details.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true },
  },
  {
    name: "read_page",
    description:
      "Read a page of Lucien George's portfolio as markdown, without changing what the user sees. Use it to answer questions about Lucien from the source. Long pages come in parts; when nextPart is set, call again with it.",
    inputSchema: {
      type: "object",
      properties: {
        page: pageProperty,
        part: { type: "integer", minimum: 1, description: "Which part to read, starting at 1. Defaults to 1." },
      },
      required: ["page"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: "open_page",
    description:
      "Show a page of Lucien George's portfolio to the user in this tab. Use it when the user wants to see the page, not just get an answer.",
    inputSchema: {
      type: "object",
      properties: { page: pageProperty },
      required: ["page"],
      additionalProperties: false,
    },
  },
];
