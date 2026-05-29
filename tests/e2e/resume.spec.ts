import { expect, test } from "@playwright/test";

test.describe("/resume", () => {
  test("renders the resume page with name, contact, and download button", async ({ page }) => {
    await page.goto("/resume");
    await expect(page).toHaveTitle(/Resume/);
    await expect(page.locator("h1")).toContainText("Lucien George");
    await expect(page.getByRole("link", { name: /Download PDF/i })).toBeVisible();
  });

  test("emits ProfilePage + Person + BreadcrumbList JSON-LD", async ({ page }) => {
    await page.goto("/resume");
    const ldNodes = await page.locator('script[type="application/ld+json"]').allTextContents();
    const combined = ldNodes.join("\n");
    expect(combined).toContain(`"@type":"ProfilePage"`);
    expect(combined).toContain(`"@type":"Person"`);
    expect(combined).toContain(`"@type":"BreadcrumbList"`);
    expect(combined).toContain(`"@type":"PostalAddress"`);
  });

  test("/api/resume/pdf returns PDF with correct content-type, content-disposition, and cache headers", async ({
    request,
  }) => {
    const res = await request.get("/api/resume/pdf");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toBe("application/pdf");
    expect(res.headers()["content-disposition"]).toMatch(/inline; filename="lucien-george-resume\.pdf"/);
    expect(res.headers()["cache-control"]).toMatch(/max-age=300/);
    expect(res.headers()["cache-control"]).toMatch(/s-maxage=86400/);
    expect(res.headers()["cache-control"]).toMatch(/stale-while-revalidate=604800/);
    expect(res.headers()["etag"]).toMatch(/^"[a-f0-9]+"$/);
    const buffer = await res.body();
    expect(buffer.byteLength).toBeGreaterThan(1000);
    // PDF signature
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
  });

  test("/api/resume/pdf honours If-None-Match (returns 304 on cache hit)", async ({ request }) => {
    const first = await request.get("/api/resume/pdf");
    expect(first.status()).toBe(200);
    const etag = first.headers()["etag"];
    expect(etag).toBeTruthy();
    const second = await request.get("/api/resume/pdf", { headers: { "If-None-Match": etag } });
    expect(second.status()).toBe(304);
  });
});
