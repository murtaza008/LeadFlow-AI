import { expect, test } from "@playwright/test";
import { expectAccessible, expectPage, mockAi, themes, useTheme } from "./helpers";

/** Follow-ups, team, settings, billing, onboarding. Read-only on the demo account. */

test.beforeEach(async ({ page }) => {
  await mockAi(page);
});

test("follow-ups are grouped and filter by type", async ({ page }) => {
  await useTheme(page, "light");
  await page.goto("/follow-ups");
  await expectPage(page, "Follow-ups");
  await expect(page.getByRole("heading", { name: /^Overdue/ })).toBeVisible({ timeout: 20_000 });
  await page.getByRole("radiogroup", { name: "Type" }).getByRole("radio", { name: "Task" }).click();
  await expect(page.getByRole("checkbox").first()).toHaveAccessibleName(/\(.+\)$/);
});

test("team lists members and explains why inviting is off in the demo", async ({ page }) => {
  await useTheme(page, "light");
  await page.goto("/team");
  await expectPage(page, "Team");
  await expect(page.getByText("Alex Morgan").first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("Inviting people is turned off in the shared demo")).toBeVisible();
  await expect(page.getByRole("button", { name: "Create invite" })).toHaveCount(0);
});

test("settings are read-only in the demo, appearance still works", async ({ page }) => {
  await useTheme(page, "light");
  await page.goto("/settings");
  await expectPage(page, "Settings");
  await expect(page.getByLabel("Name", { exact: true })).toBeDisabled({ timeout: 20_000 });
  await expect(page.getByText("Workspace settings are turned off in the shared demo.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Save changes" })).toHaveCount(0);
  await page.getByRole("main").getByRole("radiogroup", { name: "Theme" }).getByRole("radio", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("billing shows the current plan and no checkout in the demo", async ({ page }) => {
  await useTheme(page, "light");
  await page.goto("/billing");
  await expectPage(page, "Billing");
  await expect(page.getByText("Current plan")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("Checkout and billing changes are turned off in the shared demo.")).toBeVisible();
  await expect(page.getByRole("button", { name: /^Switch to/ })).toHaveCount(0);
});

test("onboarding asks for a workspace name when there is none", async ({ page }) => {
  await useTheme(page, "light");
  await page.route("**/api/workspaces/current", (route) => route.fulfill({ status: 200, json: null }));
  await page.goto("/onboarding");
  await expect(page.getByRole("heading", { name: "Name your workspace" })).toBeVisible();
  const submit = page.getByRole("button", { name: "Create workspace" });
  await expect(submit).toBeDisabled();
  await page.getByLabel("Workspace name").fill("Acme Sales");
  await expect(submit).toBeEnabled(); // not submitted
  await expectAccessible(page, "onboarding");
});

for (const theme of themes) {
  test(`team, settings and billing are accessible in ${theme}`, async ({ page }) => {
    await useTheme(page, theme);
    for (const [path, label] of [
      ["/team", "Team"],
      ["/settings", "Settings"],
      ["/billing", "Billing"],
      ["/follow-ups", "Follow-ups"],
    ] as const) {
      await page.goto(path);
      await expectPage(page, label);
      await page.waitForLoadState("networkidle");
      await expectAccessible(page, `${path} (${theme})`);
    }
    // A member hover card on the team page
    await page.goto("/team");
    await page.getByText("Jordan Reyes").first().hover();
    await expect(page.locator("[data-radix-popper-content-wrapper]")).toContainText("Open deals owned");
    await expectAccessible(page, `team hover card (${theme})`);
  });
}

for (const path of ["/follow-ups", "/team", "/settings", "/billing"]) {
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
