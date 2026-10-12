export interface CorpusDocument {
  /** Relative to content/, e.g. "bio.md" or "writing/some-post.md". */
  path: string;
  text: string;
}

/** Every content document, labelled with its source, for the system prompt. */
export function renderCorpus(documents: CorpusDocument[]): string {
  return documents
    .filter((document) => document.path.endsWith(".md") && document.path !== "system-prompt.md")
    .sort((a, b) => a.path.localeCompare(b.path))
    .map((document) => `<document source="${document.path}">\n${document.text.trim()}\n</document>`)
    .join("\n\n");
}
