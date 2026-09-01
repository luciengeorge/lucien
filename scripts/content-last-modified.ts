import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * The last commit date of every file under `content/`, injected into the bundle
 * so the sitemap can say when a page actually changed instead of claiming the
 * whole site changed on every deploy.
 *
 * A wrong `lastmod` is worse than none: Google uses it only while it stays
 * consistently accurate, and discounts the whole sitemap's dates once it isn't.
 *
 * Vercel clones with `--depth=10` unless `VERCEL_DEEP_CLONE` is set, and CI has
 * to check out with `fetch-depth: 0`, because a shallow clone cannot date a file
 * that has not changed in the last few commits. Such a file gets no entry here,
 * and the sitemap then omits its `<lastmod>` rather than substituting a date it
 * cannot stand behind.
 *
 * Shared by `vite.config.ts` and `vitest.config.ts` so the tests see the same
 * dates the build does.
 */
export function contentLastModified(): Record<string, string> {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const dates: Record<string, string> = {};

  let files: string[];
  try {
    files = readdirSync(fileURLToPath(new URL("../content", import.meta.url)), { recursive: true }).filter(
      (entry): entry is string => typeof entry === "string" && /\.(md|json)$/.test(entry),
    );
  } catch {
    return dates;
  }

  for (const file of files) {
    try {
      const committed = execFileSync("git", ["log", "-1", "--format=%cs", "--", `content/${file}`], {
        cwd: root,
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(committed)) dates[file] = committed;
    } catch {
      // No git in the build image, or the file is not tracked yet.
    }
  }

  return dates;
}
