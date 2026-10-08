import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url));

function git(root: string, args: string[]): string {
  return execFileSync("git", args, { cwd: root, encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] }).trim();
}

/**
 * The commits a shallow clone was cut at. Git has no parents for them, so it
 * reports every file they contain as last changed there, whatever the real
 * history says.
 */
function shallowBoundaries(root: string): Set<string> {
  try {
    const shallowFile = resolve(root, git(root, ["rev-parse", "--git-path", "shallow"]));
    if (!existsSync(shallowFile)) return new Set();
    return new Set(readFileSync(shallowFile, "utf-8").split("\n").filter(Boolean));
  } catch {
    return new Set();
  }
}

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
 * that has not changed since the commit it was cut at. Such a file gets no entry
 * here, and the sitemap then omits its `<lastmod>` rather than substituting a
 * date it cannot stand behind.
 *
 * Shared by `vite.config.ts` and `vitest.config.ts` so the tests see the same
 * dates the build does.
 */
export function contentLastModified(root: string = REPO_ROOT): Record<string, string> {
  const dates: Record<string, string> = {};

  let files: string[];
  try {
    files = readdirSync(join(root, "content"), { recursive: true }).filter(
      (entry): entry is string => typeof entry === "string" && /\.(md|json)$/.test(entry),
    );
  } catch {
    return dates;
  }

  const boundaries = shallowBoundaries(root);

  for (const file of files) {
    try {
      const [hash = "", committed = ""] = git(root, ["log", "-1", "--format=%H %cs", "--", `content/${file}`]).split(
        " ",
      );
      if (boundaries.has(hash)) continue;
      if (/^\d{4}-\d{2}-\d{2}$/.test(committed)) dates[file] = committed;
    } catch {
      // No git in the build image, or the file is not tracked yet.
    }
  }

  return dates;
}
