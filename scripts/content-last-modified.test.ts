import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { contentLastModified } from "./content-last-modified";

let workdir = "";
let origin = "";

function git(cwd: string, args: string[], date?: string): void {
  execFileSync("git", ["-c", "user.name=Test", "-c", "user.email=test@example.com", ...args], {
    cwd,
    stdio: "ignore",
    env: date ? { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date } : process.env,
  });
}

function commit(file: string, body: string, date: string): void {
  writeFileSync(join(origin, "content", file), body);
  git(origin, ["add", "."]);
  git(origin, ["commit", "-q", "-m", `edit ${file}`], date);
}

function clone(name: string, depth?: number): string {
  const target = join(workdir, name);
  git(workdir, ["clone", "-q", ...(depth ? ["--depth", String(depth)] : []), `file://${origin}`, target]);
  return target;
}

beforeAll(() => {
  workdir = mkdtempSync(join(tmpdir(), "content-dates-"));
  origin = join(workdir, "origin");
  mkdirSync(join(origin, "content"), { recursive: true });
  git(origin, ["init", "-q"]);
  commit("old.md", "old", "2026-01-15T12:00:00Z");
  commit("middle.md", "middle", "2026-02-15T12:00:00Z");
  commit("new.json", "{}", "2026-03-15T12:00:00Z");
});

afterAll(() => {
  rmSync(workdir, { recursive: true, force: true });
});

describe("contentLastModified", () => {
  it("dates every content file from its own last commit with full history", () => {
    expect(contentLastModified(clone("full"))).toEqual({
      "old.md": "2026-01-15",
      "middle.md": "2026-02-15",
      "new.json": "2026-03-15",
    });
  });

  /*
   * The regression: in a depth-1 checkout git reports every file as changed in
   * the one commit it has, so the sitemap told Google every page changed that
   * day. A file last seen at the commit the clone was cut at may have changed
   * long before it, so it gets no date at all.
   */
  it("omits files it cannot date in a shallow clone instead of giving them the boundary commit's date", () => {
    expect(contentLastModified(clone("depth-2", 2))).toEqual({ "new.json": "2026-03-15" });
    expect(contentLastModified(clone("depth-1", 1))).toEqual({});
  });

  it("returns nothing outside a repository with a content directory", () => {
    expect(contentLastModified(join(workdir, "missing"))).toEqual({});
  });
});
