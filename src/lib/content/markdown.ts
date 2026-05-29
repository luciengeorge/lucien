import { marked } from "marked";

marked.use({
  async: false,
  breaks: false,
  gfm: true,
});

/**
 * Render a markdown string to a sanitized HTML string suitable for
 * dangerouslySetInnerHTML inside a `.prose` container.
 *
 * Note: the source markdown lives in `content/*.md` and is fully trusted
 * (authored by the site owner). If untrusted markdown is ever rendered
 * through this path, wrap the output in a sanitizer (e.g. DOMPurify) first.
 */
export function renderMarkdown(source: string): string {
  return marked.parse(source.trim()) as string;
}
