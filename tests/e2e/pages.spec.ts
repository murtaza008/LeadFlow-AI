import { expect, test } from "@playwright/test";
import { appPages, expectAccessible, expectPage, mockAi, themes, useTheme } from "./helpers";

/** axe WCAG 2.1 AA on every app page and every shell overlay, in both themes. Read-only. */

test.beforeEach(async ({ page }) => {
  await mockAi(page);
});

for (const theme of themes) {
  for (const p of appPages) {
    test(`${p.path} is accessible in ${theme}`, async ({ page }) => {
      await useTheme(page, theme);
      await page.goto(p.path);
      await expectPage(page, p.label);
      await expectAccessible(page, `${p.path} (${theme})`);
    });
  }

  test(`shell overlays are accessible in ${theme}`, async ({ page }) => {
    await useTheme(page, theme);
    await page.goto("/dashboard");
    await expectPage(page, "Today");

    // Command palette
    await page.keyboard.press("Control+k");
    await expect(page.getByRole("combobox")).toBeVisible();
    await expectAccessible(page, `command palette (${theme})`);
    await page.keyboard.press("Escape");

    // Notifications
    await page.getByRole("button", { name: /^Notifications/ }).click();
    await expect(page.getByRole("menu")).toBeVisible();
    await expectAccessible(page, `notifications (${theme})`);
    await page.keyboard.press("Escape");

    // Account menu
    await page.getByRole("button", { name: /account menu/i }).click();
    await expect(page.getByRole("menu")).toBeVisible();
    await expectAccessible(page, `account menu (${theme})`);
    await page.keyboard.press("Escape");

    // Nav hover card
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: /Follow-ups/ }).hover();
    await expect(page.locator("[data-radix-popper-content-wrapper]")).toBeVisible();
    await expectAccessible(page, `nav hover card (${theme})`);
  });

  test(`mobile drawer is accessible in ${theme}`, async ({ page }) => {
    await useTheme(page, theme);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dashboard");
    await expect(page.locator("main h1").first()).toBeVisible({ timeout: 30_000 });
    await page.getByRole("button", { name: "Open navigation" }).click();
    await expect(page.getByRole("dialog", { name: "Navigation" })).toBeVisible();
    await expectAccessible(page, `mobile drawer (${theme})`);
  });
}

/** Redesigned pages never scroll sideways at phone width (16px gutters, no page-level horizontal scroll). */
for (const path of ["/dashboard", "/analytics", "/leads", "/leads/demo-lead-01", "/pipeline"]) {
  test(`${path} fits a 390px screen`, async ({ page }) => {
    await useTheme(page, "light");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(path);
    await expect(page.locator("main h1").first()).toBeVisible({ timeout: 30_000 });
    await page.waitForLoadState("networkidle");
    const { scroll, client } = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(scroll).toBeLessThanOrEqual(client);
  });
}
