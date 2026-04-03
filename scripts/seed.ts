import { readdir, readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const CONTENT_DIR = join(import.meta.dirname, "..", "content");
const SKIP_FILES = ["system-prompt.md"];

async function main() {
  const convexUrl = process.env.VITE_CONVEX_URL;
  if (!convexUrl) {
    console.error("VITE_CONVEX_URL is not set");
    process.exit(1);
  }

  const client = new ConvexHttpClient(convexUrl);

  const files = await readdir(CONTENT_DIR);
  const mdFiles = files.filter((f) => f.endsWith(".md") && !SKIP_FILES.includes(f));

  console.log(`Found ${mdFiles.length} content files to seed\n`);

  for (const file of mdFiles) {
    const filePath = join(CONTENT_DIR, file);
    const text = await readFile(filePath, "utf-8");
    const title = basename(file, ".md").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    console.log(`Seeding: ${title} (${file})`);
    await client.action(api.seed.addContent, { title, text: text.trim() });
  }

  console.log("\nSeeding complete");
}

main();
