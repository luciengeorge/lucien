import { MARKDOWN_CONTENT_TYPE, SITE_URL } from "#/lib/site-config";

/**
 * A path is echoed back to the caller, so strip the characters that would let
 * it break out of the code span it is rendered in (and cap the length).
 */
function safePath(pathname: string): string {
  return pathname.replace(/[`\r\n]/g, "").slice(0, 120);
}

/**
 * The markdown body of a 404. A dead end is where an agent gives up, so the
 * response says where to look instead: the page map, and the index files it can
 * read to find the URL it actually wanted.
 */
export function buildNotFoundMarkdown(pathname: string): string {
  return [
    `# 404 Not Found`,
    ``,
    `\`${safePath(pathname)}\` does not exist on ${SITE_URL}. Nothing was moved to it and nothing is coming back from it.`,
    ``,
    `## Where to look next`,
    ``,
    `- [Home](${SITE_URL}/): AI chat about Lucien George's work.`,
    `- [About](${SITE_URL}/about): bio and background.`,
    `- [Work history](${SITE_URL}/work): every role, with outcomes.`,
    `- [Writing](${SITE_URL}/writing): articles on what he has built.`,
    `- [Skills](${SITE_URL}/skills): languages, frameworks, tools.`,
    `- [Education](${SITE_URL}/education): degrees and programs.`,
    `- [Resume](${SITE_URL}/resume): full resume, with a PDF.`,
    ``,
    `## Machine-readable index`,
    ``,
    `- [${SITE_URL}/index.md](${SITE_URL}/index.md): agent entry point, with the full page map.`,
    `- [${SITE_URL}/llms.txt](${SITE_URL}/llms.txt): link index of every section.`,
    `- [${SITE_URL}/sitemap.xml](${SITE_URL}/sitemap.xml): every canonical URL.`,
    ``,
    `Every page above has a markdown twin at the same path plus \`.md\`, and answers \`Accept: text/markdown\` on its canonical URL.`,
    ``,
  ].join("\n");
}

export function notFoundMarkdownResponse(pathname: string): Response {
  return new Response(buildNotFoundMarkdown(pathname), {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": MARKDOWN_CONTENT_TYPE,
    },
    status: 404,
  });
}
