export interface CorpusDocument {
  /** Relative to content/, e.g. "bio.md" or "writing/some-post.md". */
  path: string;
  text: string;
}

/** Prompt templates live in content/ beside the corpus but are instructions, not facts about Lucien. */
const PROMPT_FILES = new Set(["system-prompt.md", "voice-prompt.md"]);

/** Every content document, labelled with its source, for the system prompt. */
export function renderCorpus(documents: CorpusDocument[]): string {
  return documents
    .filter((document) => document.path.endsWith(".md") && !PROMPT_FILES.has(document.path))
    .sort((a, b) => a.path.localeCompare(b.path))
    .map((document) => `<document source="${document.path}">\n${document.text.trim()}\n</document>`)
    .join("\n\n");
}
