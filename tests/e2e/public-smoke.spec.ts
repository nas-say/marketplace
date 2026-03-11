import { test, expect } from "@playwright/test";

test.describe("Public pages", () => {
  test("home page renders primary hero content", async ({ request }) => {
    const response = await request.get("/");
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain("Buy, Sell &amp; Beta-Test");
    expect(html).toContain("Browse Listings");
  });

  test("core public routes return success", async ({ request }) => {
    const routes = ["/", "/browse", "/beta", "/how-it-works", "/terms", "/privacy", "/refund"];
    for (const route of routes) {
      const response = await request.get(route);
      expect(response.status(), `unexpected status for ${route}`).toBe(200);
    }
  });
});
