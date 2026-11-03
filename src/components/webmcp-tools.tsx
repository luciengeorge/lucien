import { SITE_TOOL_DEFINITIONS, listPages, openPage, readPage, type ToolResult } from "#/lib/webmcp/site-tools";
import { useRouter } from "@tanstack/react-router";
import { useWebMCP } from "use-webmcp-tool";

type Execute = (args: unknown, options: { signal: AbortSignal }) => Promise<ToolResult> | ToolResult;

function SiteTool({ definition, execute }: { definition: (typeof SITE_TOOL_DEFINITIONS)[number]; execute: Execute }) {
  useWebMCP({ ...definition, execute });
  return null;
}

/**
 * Exposes the site to in-browser agents over WebMCP (`document.modelContext`).
 * A no-op in browsers without it. See `#/lib/webmcp/site-tools` for the tools.
 */
export function WebMcpTools() {
  const router = useRouter();
  const executors: Record<(typeof SITE_TOOL_DEFINITIONS)[number]["name"], Execute> = {
    list_pages: () => listPages(),
    open_page: (args) => openPage(args, { navigate: (href) => router.navigate({ href }) }),
    read_page: (args, { signal }) => readPage(args, { signal }),
  };

  return SITE_TOOL_DEFINITIONS.map((definition) => (
    <SiteTool definition={definition} execute={executors[definition.name]} key={definition.name} />
  ));
}
