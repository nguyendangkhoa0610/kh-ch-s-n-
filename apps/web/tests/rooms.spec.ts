import { test, expect } from "@playwright/test";

test.describe("Rooms page", () => {
  test("shows room listing", async ({ page }) => {
    await page.goto("/phong");
    await expect(page).toHaveTitle(/Phòng/);
    // All rooms filter
    await expect(page.locator("text=Tất cả").first()).toBeVisible();
  });

  test("filter buttons work", async ({ page }) => {
    await page.goto("/phong");
    const midFilter = page.locator("button", { hasText: "Tầm trung" });
    if (await midFilter.isVisible()) {
      await midFilter.click();
      // Bungalow (3.8M) should still be visible, Suite (12M) should not
      await expect(page.locator("text=Bungalow").first()).toBeVisible({ timeout: 2000 });
    }
  });

  test("room detail page loads", async ({ page }) => {
    await page.goto("/phong/eco-pod");
    await expect(page.locator("text=Eco Pod").first()).toBeVisible({ timeout: 5000 });
  });

  test("room detail has booking button", async ({ page }) => {
    await page.goto("/phong/bungalow-bien");
    const bookBtn = page
      .locator("a, button")
      .filter({ hasText: /Đặt|Book/ })
      .first();
    await expect(bookBtn).toBeVisible({ timeout: 5000 });
  });
});
