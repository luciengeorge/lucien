import { render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { WebMcpTools } from "./webmcp-tools";

const navigate = vi.fn(async (_options: { href: string }) => {});
vi.mock("@tanstack/react-router", () => ({ useRouter: () => ({ navigate }) }));

interface Registration {
  tool: {
    name: string;
    annotations?: object;
    execute: (
      args: object,
      options: { signal: AbortSignal },
    ) => Promise<{ content: { text: string }[]; isError?: boolean }>;
  };
  signal: AbortSignal;
}

let registrations: Registration[];

beforeEach(() => {
  registrations = [];
  Object.defineProperty(document, "modelContext", {
    configurable: true,
    value: {
      registerTool: vi.fn(async (tool: Registration["tool"], options: { signal: AbortSignal }) => {
        registrations.push({ tool, signal: options.signal });
      }),
    },
  });
});

afterEach(() => {
  Reflect.deleteProperty(document, "modelContext");
  vi.unstubAllGlobals();
  navigate.mockClear();
});

function registered(name: string): Registration {
  const live = registrations.filter((entry) => entry.tool.name === name && !entry.signal.aborted);
  expect(live).toHaveLength(1);
  return live[0]!;
}

describe("WebMcpTools", () => {
  it("registers the three site tools, read-only where they only read", async () => {
    render(<WebMcpTools />);
    await waitFor(() => expect(registrations.filter((entry) => !entry.signal.aborted)).toHaveLength(3));

    expect(registered("list_pages").tool.annotations).toEqual({ readOnlyHint: true });
    expect(registered("read_page").tool.annotations).toEqual({ readOnlyHint: true });
    expect(registered("open_page").tool.annotations).toBeUndefined();
  });

  it("serves read_page from the same-origin markdown twin, without cookies", async () => {
    const fetchMock = vi.fn(
      async () => new Response("# Skills", { headers: { "Content-Type": "text/markdown; charset=utf-8" } }),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<WebMcpTools />);
    await waitFor(() => registered("read_page"));

    const result = await registered("read_page").tool.execute(
      { page: "skills" },
      { signal: new AbortController().signal },
    );

    expect(fetchMock).toHaveBeenCalledWith("/skills.md", expect.objectContaining({ credentials: "omit" }));
    expect(result.isError).toBeUndefined();
    expect(JSON.parse(result.content[0]!.text)).toMatchObject({ page: "skills", text: "# Skills" });
  });

  it("navigates in-app for open_page and refuses anything off the allowlist", async () => {
    render(<WebMcpTools />);
    await waitFor(() => registered("open_page"));
    const { execute } = registered("open_page").tool;

    await execute({ page: "resume" }, { signal: new AbortController().signal });
    expect(navigate).toHaveBeenCalledWith({ href: "/resume" });

    const refused = await execute({ page: "https://evil.example" }, { signal: new AbortController().signal });
    expect(refused.isError).toBe(true);
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it("unregisters every tool on unmount", async () => {
    const { unmount } = render(<WebMcpTools />);
    await waitFor(() => expect(registrations.filter((entry) => !entry.signal.aborted)).toHaveLength(3));

    unmount();
    expect(registrations.every((entry) => entry.signal.aborted)).toBe(true);
  });

  it("does nothing in a browser without WebMCP", () => {
    Reflect.deleteProperty(document, "modelContext");
    expect(() => render(<WebMcpTools />)).not.toThrow();
    expect(registrations).toHaveLength(0);
  });
});
