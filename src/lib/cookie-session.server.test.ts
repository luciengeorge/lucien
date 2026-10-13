import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { jar, writes } = vi.hoisted(() => {
  const writes: { name: string; value: string; options: Record<string, unknown> | undefined }[] = [];
  return { jar: new Map<string, string>(), writes };
});

vi.mock("@tanstack/react-start/server", () => ({
  getCookie: (name: string) => jar.get(name),
  setCookie: (name: string, value: string, options?: Record<string, unknown>) => {
    jar.set(name, value);
    writes.push({ name, value, options });
  },
}));

import { getCookieSession } from "./cookie-session.server";

interface Data {
  a?: string;
  b?: string;
}

describe("getCookieSession", () => {
  const originalSecret = process.env.TOAST_SECRET;

  beforeEach(() => {
    process.env.TOAST_SECRET = "x".repeat(32);
  });

  afterEach(() => {
    process.env.TOAST_SECRET = originalSecret;
    jar.clear();
    writes.length = 0;
  });

  it("starts empty when no cookie is set", async () => {
    const session = await getCookieSession<Data>("s");
    expect({ ...session.data }).toEqual({});
  });

  it("merges updates and reads them back on the next request", async () => {
    const first = await getCookieSession<Data>("s");
    await first.update({ a: "1" });
    const second = await getCookieSession<Data>("s");
    await second.update({ b: "2" });

    const third = await getCookieSession<Data>("s");
    expect(third.data.a).toBe("1");
    expect(third.data.b).toBe("2");
  });

  it("writes an encrypted, httpOnly browser-session cookie", async () => {
    const session = await getCookieSession<Data>("s");
    await session.update({ a: "secret-value" });

    const write = writes.at(-1);
    expect(write?.name).toBe("s");
    expect(write?.value).not.toContain("secret-value");
    expect(write?.options).toMatchObject({ httpOnly: true, path: "/", sameSite: "lax" });
    expect(write?.options?.maxAge).toBeUndefined();
  });

  it("clears the session", async () => {
    const session = await getCookieSession<Data>("s");
    await session.update({ a: "1" });
    await session.clear();

    const next = await getCookieSession<Data>("s");
    expect(next.data.a).toBeUndefined();
  });

  it("treats an unreadable cookie (e.g. an old h3 seal) as an empty session", async () => {
    jar.set("s", "Fe26.2**not-a-real-seal");
    const session = await getCookieSession<Data>("s");
    expect({ ...session.data }).toEqual({});
  });

  it("throws when TOAST_SECRET is unset", async () => {
    delete process.env.TOAST_SECRET;
    await expect(getCookieSession<Data>("s")).rejects.toThrow("TOAST_SECRET must be set");
  });
});
