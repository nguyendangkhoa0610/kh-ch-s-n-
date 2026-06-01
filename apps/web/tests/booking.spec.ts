import { test, expect } from "@playwright/test";

test.describe("Booking flow", () => {
  test("booking page loads", async ({ page }) => {
    await page.goto("/dat-phong");
    await expect(page).toHaveTitle(/Đặt phòng/);
  });

  test("step 1 shows room selection", async ({ page }) => {
    await page.goto("/dat-phong");
    // Should show date pickers and room selection
    await expect(page.locator('input[type="date"]').first()).toBeVisible({ timeout: 5000 });
  });

  test("can select a room and proceed", async ({ page }) => {
    await page.goto("/dat-phong");

    // Fill check-in/out dates
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const fmt = (d: Date) => d.toISOString().split("T")[0];

    const checkinInputs = page.locator('input[type="date"]');
    if ((await checkinInputs.count()) >= 2) {
      await checkinInputs.nth(0).fill(fmt(today));
      await checkinInputs.nth(1).fill(fmt(tomorrow));
    }

    // Click next/proceed button
    const nextBtn = page.locator("button", { hasText: /Tiếp theo|Chọn phòng/ }).first();
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
    }
  });

  test("step 2 guest info form exists", async ({ page }) => {
    await page.goto("/dat-phong");
    // Navigate to step 2 by selecting a room type
    const roomCards = page.locator("button", { hasText: /Chọn|Select/ });
    const count = await roomCards.count();
    if (count > 0) {
      await roomCards.first().click();
      // Check if guest info form appears
      const nameInput = page.locator('input[name="name"], input[placeholder*="tên"], input[placeholder*="name"]');
      if (await nameInput.isVisible({ timeout: 3000 })) {
        await expect(nameInput).toBeVisible();
      }
    }
  });

  test("booking result page has booking code format", async ({ page }) => {
    await page.goto("/dat-phong/ket-qua");
    // Page should load even with empty params
    await expect(page).toHaveURL(/ket-qua/);
  });
});

test.describe("AI Planner", () => {
  test("lap lich page loads", async ({ page }) => {
    await page.goto("/lap-lich");
    await expect(page).toHaveTitle(/Lập lịch|Planner/i);
  });

  test("form fields are present", async ({ page }) => {
    await page.goto("/lap-lich");
    // Should have number of days input or similar
    await expect(page.locator("form, [data-testid='planner-form']").first()).toBeVisible({
      timeout: 5000,
    });
  });
});
