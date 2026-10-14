import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { readCorpusFromDisk } from "../evals/corpus";

export function contentHash(corpus: string): string {
  return createHash("sha256").update(corpus).digest("hex").slice(0, 16);
}

/**
 * Regenerates Poof's cached intro from the same corpus the chat answers from. Convex writes a new
 * intro only when the content (or the intro prompt version) changed, so reruns are free.
 * Targets whichever deployment the Convex CLI resolves: CONVEX_DEPLOY_KEY in CI (prod),
 * .env.local locally (dev).
 */
function main() {
  const corpus = readCorpusFromDisk(join(import.meta.dirname, "..", "content"));
  const hash = contentHash(corpus);
  console.log(`Refreshing the intro for content ${hash} (${corpus.length} chars)`);
  const result = execFileSync(
    "npx",
    ["convex", "run", "intro:refreshIntro", JSON.stringify({ contentHash: hash, corpus })],
    { encoding: "utf-8", stdio: ["ignore", "pipe", "inherit"] },
  );
  console.log(result.trim());
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
