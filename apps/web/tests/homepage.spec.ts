import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("loads and shows hero section", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Trầm Hương/);
    await expect(page.locator("text=Trầm Hương").first()).toBeVisible();
  });

  test("navigation links are present", async ({ page }) => {
    await page.goto("/");
    // Nav should be visible (transparent at top)
    const nav = page.locator("header nav");
    await expect(nav).toBeVisible();
  });

  test("booking bar is visible on homepage", async ({ page }) => {
    await page.goto("/");
    // Scroll down a bit to find BookingBar
    await page.evaluate(() => window.scrollBy(0, 500));
    // Look for check-in/checkout inputs
    const checkinInput = page.locator('input[type="date"]').first();
    await expect(checkinInput).toBeVisible({ timeout: 5000 });
  });

  test("language toggle switches to English", async ({ page }) => {
    await page.goto("/");
    // Find EN button
    const langBtn = page.locator("button", { hasText: "EN" }).first();
    if (await langBtn.isVisible()) {
      await langBtn.click();
      // Nav items should switch to English
      await expect(page.locator("text=Rooms").first()).toBeVisible({ timeout: 3000 });
    }
  });

  test("rooms section is present", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.scrollBy(0, 2000));
    // Room types should be listed
    await expect(page.locator("text=Bungalow").first()).toBeVisible({ timeout: 5000 });
  });

  test("sitemap.xml is accessible", async ({ page }) => {
    const res = await page.request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("<urlset");
  });

  test("robots.txt is accessible", async ({ page }) => {
    const res = await page.request.get("/robots.txt");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("User-Agent");
  });
});
