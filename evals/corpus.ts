import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { renderCorpus } from "../src/lib/chat/corpus";

/** The corpus the chat route bundles with import.meta.glob, read from disk for the harness. */
export function readCorpusFromDisk(contentDir: string): string {
  const paths = readdirSync(contentDir, { recursive: true })
    .map(String)
    .filter((path) => path.endsWith(".md"));
  return renderCorpus(paths.map((path) => ({ path, text: readFileSync(join(contentDir, path), "utf-8") })));
}
