import { expect, test } from "@playwright/test";
import { expectAccessible, expectPage, mockAi, themes, useTheme } from "./helpers";

/** Today and Analytics. Read-only: nothing here ticks a follow-up or edits a lead. */

test.beforeEach(async ({ page }) => {
  await mockAi(page);
});

test("Today greets the user and shows real numbers", async ({ page }) => {
  await useTheme(page, "light");
  await page.goto("/dashboard");
  await expectPage(page, "Today");
  await expect(page.locator("main h1")).toHaveText(/^(Good (morning|afternoon|evening)|Working late), Alex\.$/);

  // Final values are in data-value, so the test never reads a number mid-count.
  const openPipeline = page.locator("dl").first().locator("[data-value]").first();
  await expect(openPipeline).toHaveAttribute("data-value", /^[1-9]\d*$/, { timeout: 20_000 });

  await expect(page.getByRole("heading", { name: "Today's focus" })).toBeVisible();
  await expect(page.locator("#focus").locator("xpath=ancestor::section").getByRole("listitem").first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("heading", { name: "Needs attention" })).toBeVisible();
});

test("a KPI shows its breakdown on hover and on keyboard focus", async ({ page }) => {
  await useTheme(page, "light");
  await page.goto("/dashboard");
  await expectPage(page, "Today");
  const cell = page.locator("dl").first().locator("[tabindex='0']").first();
  await expect(cell.locator("[data-value]")).toHaveAttribute("data-value", /\d/, { timeout: 20_000 });
  await cell.hover();
  const card = page.locator("[data-radix-popper-content-wrapper]");
  await expect(card).toContainText("Qualified");
  await page.mouse.move(5, 5);
  await expect(card).toBeHidden();
  await cell.focus();
  await expect(card).toContainText("Contacted");
});

test("a lead name previews the lead without leaving the page", async ({ page }) => {
  await useTheme(page, "light");
  await page.goto("/dashboard");
  await expectPage(page, "Today");
  const link = page.locator("#focus").locator("xpath=ancestor::section").getByRole("link").first();
  await expect(link).toBeVisible({ timeout: 20_000 });
  await link.hover();
  const card = page.locator("[data-radix-popper-content-wrapper]");
  await expect(card).toContainText("Deal value", { timeout: 5_000 });
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("analytics switches range and every chart has a table view", async ({ page }) => {
  await useTheme(page, "light");
  await page.goto("/analytics");
  await expectPage(page, "Analytics");
  await expect(page.getByText("Leads added, 30 days")).toBeVisible();

  const range = page.getByRole("radiogroup", { name: "Date range" });
  const yearly = page.waitForResponse((r) => r.url().includes("/api/analytics?days=365") && r.ok());
  await range.getByRole("radio", { name: "12 months" }).click();
  await yearly;
  await expect(page.getByText("Leads added, 12 months")).toBeVisible();
  await expect(page.getByText("Per month, last 12 months")).toBeVisible();

  const trend = page.getByRole("radiogroup", { name: "Leads added and deals won: view" });
  await trend.getByRole("radio", { name: "Table" }).click();
  const table = page.getByRole("table", { name: "Leads added and deals won" });
  await expect(table).toBeVisible();
  await expect(table.getByRole("row")).toHaveCount(13); // header + 12 months

  await page.getByRole("radiogroup", { name: "Where leads come from: view" }).getByRole("radio", { name: "Table" }).click();
  await expect(page.getByRole("table", { name: "Leads per source" }).getByRole("row", { name: /Referral/ })).toBeVisible();
});

test("chart columns show a rich tooltip", async ({ page }) => {
  await useTheme(page, "light");
  await page.goto("/analytics");
  await expectPage(page, "Analytics");
  const chart = page.getByRole("img", { name: /Number of leads in each AI score band/ });
  await expect(chart).toBeVisible({ timeout: 20_000 });
  await chart.scrollIntoViewIfNeeded();
  const box = (await chart.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.9, box.y + box.height / 2);
  await expect(page.getByText(/^Score 81–100$/)).toBeVisible();
  await expect(page.getByText("Share", { exact: true })).toBeVisible();
});

for (const theme of themes) {
  test(`analytics table views and hover cards are accessible in ${theme}`, async ({ page }) => {
    await useTheme(page, theme);
    await page.goto("/analytics");
    await expectPage(page, "Analytics");
    await expect(page.locator("[data-value]").first()).toHaveAttribute("data-value", /\d/, { timeout: 20_000 });
    for (const name of ["Leads added and deals won", "Pipeline by stage", "Where leads come from", "AI score spread"]) {
      await page.getByRole("radiogroup", { name: `${name}: view` }).getByRole("radio", { name: "Table" }).click();
    }
    await expectAccessible(page, `analytics tables (${theme})`);
    await page.locator("dl").first().locator("[tabindex='0']").nth(1).focus();
    await expect(page.locator("[data-radix-popper-content-wrapper]")).toBeVisible();
    await expectAccessible(page, `analytics KPI breakdown (${theme})`);
  });
}
