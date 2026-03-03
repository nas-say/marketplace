import { test, expect } from "@playwright/test";

test.describe("Auth and SEO routes", () => {
  test("signed-out dashboard and connects redirect to sign-in", async ({ request }) => {
    const dashboard = await request.get("/dashboard", { maxRedirects: 0 });
    expect(dashboard.status()).toBe(307);
    expect(dashboard.headers()["location"]).toContain("/sign-in");

    const connects = await request.get("/connects", { maxRedirects: 0 });
    expect(connects.status()).toBe(307);
    expect(connects.headers()["location"]).toContain("/sign-in");
  });

  test("robots and sitemap are published", async ({ request }) => {
    const robots = await request.get("/robots.txt");
    expect(robots.status()).toBe(200);
    const robotsText = await robots.text();
    expect(robotsText).toContain("Sitemap: ");
    expect(robotsText).toContain("/sitemap.xml");

    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
    const sitemapXml = await sitemap.text();
    expect(sitemapXml).toContain("<urlset");
    expect(sitemapXml).toContain("<loc>");
  });

  test("google search console verification file is reachable", async ({ request }) => {
    const response = await request.get("/google6099fa862dac24b9.html");
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body.trim()).toBe("google-site-verification: google6099fa862dac24b9.html");
  });
});
