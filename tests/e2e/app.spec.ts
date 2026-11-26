import { expect, test } from "@playwright/test";
import { expectPage, mockAi, useTheme } from "./helpers";

/** Shell behaviour. Read-only: nothing here creates, edits or deletes data. */

test.beforeEach(async ({ page }) => {
  await mockAi(page);
});

test("sidebar navigates between pages and marks the current one", async ({ page }) => {
  await useTheme(page, "light");
  await page.goto("/dashboard");
  await expectPage(page, "Today");
  const nav = page.getByRole("navigation", { name: "Main" });
  await nav.getByRole("link", { name: /Pipeline/ }).click();
  await expectPage(page, "Pipeline");
  await expect(nav.getByRole("link", { name: /Pipeline/ })).toHaveAttribute("aria-current", "page");
  await expect(nav.getByRole("link", { name: /Today/ })).not.toHaveAttribute("aria-current", "page");
});

test("nav hover card explains the page with live counts", async ({ page }) => {
  await useTheme(page, "light");
  await page.goto("/dashboard");
  await expectPage(page, "Today");
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: /^Leads/ }).hover();
  const card = page.locator("[data-radix-popper-content-wrapper]").filter({ hasText: "Every lead with its AI score" });
  await expect(card).toBeVisible();
  // The demo workspace is seeded with 35 leads.
  await expect(card.getByText("All leads")).toBeVisible();
  await expect(card.locator("dd").first()).toHaveText(/^\d+$/);
});

test("Ctrl+K finds a lead by company and opens its profile", async ({ page }) => {
  await useTheme(page, "light");
  await page.goto("/dashboard");
  await expectPage(page, "Today");
  await page.keyboard.press("Control+k");
  const input = page.getByRole("combobox", { name: "Search pages, leads and actions" });
  await expect(input).toBeVisible();
  await input.fill("ledgerly");
  const option = page.getByRole("option").filter({ hasText: /Ledgerly/i }).first();
  await expect(option).toBeVisible({ timeout: 20_000 });
  await input.press("Enter");
  await expect(page).toHaveURL(/\/leads\/[^/]+$/);
});

test("command palette jumps to a page", async ({ page }) => {
  await useTheme(page, "light");
  await page.goto("/dashboard");
  await expectPage(page, "Today");
  await page.getByRole("button", { name: /Search leads or jump to/ }).click();
  await page.getByRole("combobox").fill("follow");
  await page.getByRole("option", { name: /Follow-ups/ }).click();
  await expectPage(page, "Follow-ups");
});

test("notifications list real workspace events", async ({ page }) => {
  await useTheme(page, "light");
  await page.goto("/dashboard");
  await expectPage(page, "Today");
  await page.getByRole("button", { name: /^Notifications/ }).click();
  const menu = page.getByRole("menu");
  await expect(menu.getByText("Activity", { exact: true })).toBeVisible();
  // Seeded teammates (Jordan, Priya) have logged calls and moved deals in the last two weeks.
  // A real event, not the disabled "Loading…" / "Nothing new yet" items.
  await expect(menu.locator('[role="menuitem"]:not([data-disabled])').first()).toBeVisible({ timeout: 20_000 });
});

test("theme toggle switches to dark and back", async ({ page }) => {
  await useTheme(page, "light");
  await page.goto("/dashboard");
  await expectPage(page, "Today");
  const html = page.locator("html");
  await expect(html).not.toHaveClass(/dark/);
  await page.getByRole("radiogroup", { name: "Theme" }).getByRole("radio", { name: "Dark" }).click();
  await expect(html).toHaveClass(/dark/);
  await page.getByRole("radiogroup", { name: "Theme" }).getByRole("radio", { name: "Light" }).click();
  await expect(html).not.toHaveClass(/dark/);
});

test("mobile: navigation opens in a drawer", async ({ page }) => {
  await useTheme(page, "light");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");
  await expect(page.locator("main h1").first()).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "Open navigation" }).click();
  const drawer = page.getByRole("dialog", { name: "Navigation" });
  await expect(drawer).toBeVisible();
  await drawer.getByRole("link", { name: /Analytics/ }).click();
  await expect(drawer).toBeHidden();
  await expect(page).toHaveURL(/\/analytics$/);
});
