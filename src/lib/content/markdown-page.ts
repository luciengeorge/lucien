import { SITE_URL } from "#/lib/site-config";

interface BuildMarkdownPageInput {
  title: string;
  description: string;
  /** Site-relative path, e.g. "/about" - resolved against SITE_URL for the frontmatter `url` key. */
  path: string;
  body: string;
  /** Extra frontmatter keys appended after `url`, in insertion order (e.g. company/role/period for work entries). */
  extraFrontmatter?: Record<string, string>;
}

/**
 * YAML scalar values need quoting when they contain characters that would
 * otherwise change how the line parses: a colon acting as a key/value
 * separator (`: ` or a trailing `:`), a `"` (quote delimiter), a `#`
 * (comment marker), or a newline. A bare colon inside e.g. a URL
 * (`https://...`) is not ambiguous and stays unquoted.
 */
function yamlSafeValue(value: string): string {
  const needsQuoting = /: |:$/.test(value) || value.includes('"') || value.includes("#") || value.includes("\n");
  if (!needsQuoting) return value;
  const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
  return `"${escaped}"`;
}

export function buildMarkdownPage({
  title,
  description,
  path,
  body,
  extraFrontmatter,
}: BuildMarkdownPageInput): string {
  const frontmatterEntries: Array<[string, string]> = [
    ["title", title],
    ["description", description],
    ["url", `${SITE_URL}${path}`],
    ...Object.entries(extraFrontmatter ?? {}),
  ];
  const frontmatter = frontmatterEntries.map(([key, value]) => `${key}: ${yamlSafeValue(value)}`).join("\n");

  return `---\n${frontmatter}\n---\n\n# ${title}\n\n${body.trim()}\n`;
}
