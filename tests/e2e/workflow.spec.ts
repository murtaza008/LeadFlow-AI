import { expect, test, type Page } from "@playwright/test";
import { expectAccessible, expectPage, mockAi, themes, useTheme } from "./helpers";

/**
 * The core workflow: pipeline, leads list and lead profile.
 * Read-only on the shared demo account: nothing is dropped, submitted,
 * ticked or deleted. AI routes are answered locally.
 */

const LEAD = "/leads/demo-lead-01"; // Elena Vasquez, Qualified

test.beforeEach(async ({ page }) => {
  await mockAi(page);
});

test("pipeline shows five stages with counts and filters instantly", async ({ page }) => {
  await useTheme(page, "light");
  await page.goto("/pipeline");
  await expectPage(page, "Pipeline");
  const board = page.getByRole("region", { name: "Pipeline board" });
  for (const stage of ["New", "Contacted", "Qualified", "Won", "Lost"]) {
    await expect(board.getByRole("region", { name: new RegExp(`^${stage}, \\d+ deals$`) })).toBeVisible({ timeout: 20_000 });
  }
  await expect(board.getByRole("link", { name: "Elena Vasquez" })).toBeVisible();

  await page.getByPlaceholder("Filter by name or company").fill("brightline");
  await expect(board.getByRole("region", { name: "Qualified, 1 deals" })).toBeVisible();
  await expect(board.getByRole("link", { name: "Jonah Adler" })).toBeHidden();
});

test("every card can be moved without a mouse: grip for keyboard drag, menu of stages", async ({ page }) => {
  await useTheme(page, "light");
  await page.goto("/pipeline");
  await expectPage(page, "Pipeline");
  await expect(page.getByRole("button", { name: "Move Elena Vasquez with the keyboard" })).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Move Elena Vasquez to another stage" }).click();
  const menu = page.getByRole("menu");
  await expect(menu.getByRole("menuitem")).toHaveCount(4); // every stage except the current one
  await expect(menu.getByRole("menuitem", { name: "Won" })).toBeVisible();
  await expectAccessible(page, "pipeline card menu");
  await page.keyboard.press("Escape"); // never select: that would move a lead in the shared demo
});

test("leads list searches, filters and recovers from no matches", async ({ page }) => {
  await useTheme(page, "light");
  await page.goto("/leads");
  await expectPage(page, "Leads");
  await expect(page.getByText(/^\d+ leads$/)).toBeVisible({ timeout: 20_000 });

  await page.getByRole("radiogroup", { name: "Tier" }).getByRole("radio", { name: "Hot" }).click();
  await expect(page.getByText(/^Showing \d+ of \d+ leads$/)).toBeVisible();

  await page.getByPlaceholder("Search by name, company, title or email").fill("zzzz no such lead");
  await expect(page.getByText("No leads match")).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.getByText(/^\d+ leads$/)).toBeVisible();
});

test("the sidebar's Add a lead opens the form (not submitted)", async ({ page }) => {
  await useTheme(page, "light");
  await page.goto("/dashboard");
  await expectPage(page, "Today");
  await page.getByRole("navigation", { name: "Main" }).locator("xpath=..").getByRole("link", { name: "Add a lead" }).click();
  const dialog = page.getByRole("dialog", { name: "Add a lead" });
  await expect(dialog).toBeVisible({ timeout: 20_000 });
  await expectAccessible(page, "add lead dialog");
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/\/leads$/);
});

async function openProfile(page: Page) {
  await page.goto(LEAD);
  await expectPage(page, "Leads");
  await expect(page.getByRole("heading", { level: 1, name: /Elena Vasquez/ })).toBeVisible({ timeout: 20_000 });
}

test("lead profile shows the stage, score, insight, follow-ups and timeline", async ({ page }) => {
  await useTheme(page, "light");
  await openProfile(page);
  await expect(page.getByRole("radiogroup", { name: "Stage" }).getByRole("radio", { checked: true })).toHaveText("Qualified");
  await expect(page.getByRole("heading", { name: "AI score" })).toBeVisible();
  await expect(page.locator("#score").locator("xpath=ancestor::section").locator("[data-value]")).toHaveAttribute("data-value", "90");
  await expect(page.getByRole("heading", { name: "Insight and next step" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Timeline" })).toBeVisible();
  await expect(page.getByText("Moved from Contacted to Qualified.").first()).toBeVisible();
  // Deleting is turned off in the demo, so the button isn't offered.
  await expect(page.getByRole("button", { name: /^Delete/ })).toHaveCount(0);
});

test("the timeline composer is ready to log (not submitted)", async ({ page }) => {
  await useTheme(page, "light");
  await openProfile(page);
  const log = page.getByRole("button", { name: "Log note" });
  await expect(log).toBeDisabled();
  await page.getByRole("radiogroup", { name: "Type of entry" }).getByRole("radio", { name: "Call" }).click();
  await page.getByLabel("Call text").fill("Called about the January launch.");
  await expect(page.getByRole("button", { name: "Log call" })).toBeEnabled();
});

test("re-scoring shows Gemini's answer, and a busy Gemini is explained inline", async ({ page }) => {
  await useTheme(page, "light");
  // First call: a successful score (the lead as it already is, so nothing changes).
  let calls = 0;
  await page.route(/\/api\/leads\/[^/]+\/score$/, async (route) => {
    calls++;
    if (calls === 1) {
      const lead = await (await page.request.get(`/api${LEAD}`)).json();
      return route.fulfill({ status: 200, json: lead });
    }
    return route.fulfill({ status: 503, json: { error: "Gemini is busy right now. Try again in a minute." } });
  });
  await openProfile(page);
  await page.getByRole("button", { name: "Re-score with AI" }).click();
  await expect(page.getByText("Scored by Gemini")).toBeVisible();

  await page.getByRole("button", { name: "Re-score with AI" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Gemini is busy right now" })).toBeVisible();
});

test("a bad request from the insight call is shown, not hidden", async ({ page }) => {
  await useTheme(page, "light");
  await page.route(/\/api\/leads\/[^/]+\/insights$/, (route) =>
    route.fulfill({ status: 502, json: { error: "Gemini could not handle this request (400): invalid argument" } }),
  );
  await openProfile(page);
  await page.getByRole("button", { name: "Refresh insight" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "(400)" })).toBeVisible();
});

for (const theme of themes) {
  test(`pipeline and profile are accessible in ${theme}, with hover cards open`, async ({ page }) => {
    await useTheme(page, theme);
    await page.goto("/pipeline");
    await expectPage(page, "Pipeline");
    const link = page.getByRole("region", { name: "Pipeline board" }).getByRole("link", { name: "Elena Vasquez" });
    await expect(link).toBeVisible({ timeout: 20_000 });
    await link.hover();
    await expect(page.locator("[data-radix-popper-content-wrapper]")).toContainText("Deal value");
    await expectAccessible(page, `pipeline hover card (${theme})`);

    await openProfile(page);
    await expectAccessible(page, `lead profile (${theme})`);
  });
}
