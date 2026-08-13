import { execFileSync } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { basename, join } from "node:path";

const CONTENT_DIR = join(import.meta.dirname, "..", "content");
const SKIP_FILES = ["system-prompt.md"];

function runConvexFunction(name: string, args: Record<string, unknown>): string {
  return execFileSync("npx", ["convex", "run", name, JSON.stringify(args)], {
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "inherit"],
  });
}

async function main() {
  const entries = await readdir(CONTENT_DIR, { recursive: true });
  const mdFiles = entries.filter((f) => f.endsWith(".md") && !SKIP_FILES.includes(basename(f)));

  console.log(`Found ${mdFiles.length} content files to seed\n`);

  console.log("Clearing existing portfolio vectors");
  runConvexFunction("seed:resetNamespace", {});
  console.log("Cleared existing portfolio vectors\n");

  for (const file of mdFiles) {
    const filePath = join(CONTENT_DIR, file);
    const text = await readFile(filePath, "utf-8");
    const title = basename(file, ".md").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    console.log(`Seeding: ${title} (${file})`);
    runConvexFunction("seed:addContent", { title, text: text.trim() });
  }

  console.log("\nSeeding complete");
}

main();
