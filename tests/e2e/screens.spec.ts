import { test, expect, type Page } from "@playwright/test";
import path from "node:path";
import { mkdirSync } from "node:fs";
import { mockAi, themes, type Theme } from "./helpers";

/**
 * Review screenshots (not assertions): light + dark, open hover cards, menus,
 * a mid-animation frame and mobile width. Only runs when SCREENS_DIR is set:
 *
 *   SCREENS_DIR=./shots SCREENS=shell npx playwright test --project=screens
 *
 * Read-only, like every other spec.
 */
const dir = process.env.SCREENS_DIR;
const only = (process.env.SCREENS ?? "").split(",").filter(Boolean);
test.skip(!dir, "set SCREENS_DIR to capture review screenshots");

const want = (name: string) => only.length === 0 || only.includes(name);
const shot = (page: Page, name: string, theme: Theme, fullPage = false) =>
  page.screenshot({ path: path.join(dir!, `${name}-${theme}.png`), fullPage });

for (const theme of themes) {
  test.describe(theme, () => {
    test.beforeEach(async ({ page }) => {
      await mockAi(page);
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.emulateMedia({ colorScheme: theme });
      await page.addInitScript((t) => localStorage.setItem("theme", t), theme);
    });

    test("shell", async ({ page }) => {
      test.skip(!want("shell"));
      await page.goto("/dashboard");
      await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible({ timeout: 30_000 });
      await page.waitForTimeout(1200);
      await shot(page, "shell-dashboard", theme);

      await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: /Follow-ups/ }).hover();
      await page.waitForTimeout(800);
      await shot(page, "shell-nav-hovercard", theme);

      await page.mouse.move(900, 600);
      await page.keyboard.press("Control+k");
      await page.keyboard.type("le");
      await page.waitForTimeout(900);
      await shot(page, "shell-command-palette", theme);
      await page.keyboard.press("Escape");

      await page.getByRole("button", { name: /^notifications/i }).click();
      await page.waitForTimeout(900);
      await shot(page, "shell-notifications", theme);
      await page.keyboard.press("Escape");

      await page.getByRole("button", { name: /account menu/i }).click();
      await page.waitForTimeout(300);
      await shot(page, "shell-user-menu", theme);
      await page.keyboard.press("Escape");

      // Mid-animation: navigate and capture ~120ms into the page transition.
      await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: /Team/ }).click();
      await page.waitForTimeout(120);
      await shot(page, "shell-mid-transition", theme);

      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto("/leads");
      await page.waitForTimeout(1200);
      await shot(page, "shell-mobile", theme);
      await page.getByRole("button", { name: "Open navigation" }).click();
      await page.waitForTimeout(500);
      await shot(page, "shell-mobile-drawer", theme);
    });
  });
}

/**
 * App screenshots for the landing page and README, written to public/screens.
 * Run with SCREENS=marketing (see scripts/screens.mjs).
 */
for (const theme of themes) {
  test(`marketing ${theme}`, async ({ page }) => {
    test.skip(!want("marketing"));
    const out = path.join(process.cwd(), "public", "screens");
    mkdirSync(out, { recursive: true });
    await mockAi(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    await page.addInitScript((t) => localStorage.setItem("theme", t), theme);

    for (const [name, url] of [
      ["dashboard", "/dashboard"],
      ["pipeline", "/pipeline"],
      ["lead", "/leads/demo-lead-01"],
      ["analytics", "/analytics"],
    ] as const) {
      await page.goto(url);
      await expect(page.locator("main h1").first()).toBeVisible({ timeout: 30_000 });
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1200);
      await page.mouse.move(1430, 890);
      await page.screenshot({ path: path.join(out, `${name}-${theme}.png`) });
    }
  });
}

/** Landing review shots: hero, every story stage, a tooltip, the demos and mobile. */
for (const theme of themes) {
  test(`landing ${theme}`, async ({ page }) => {
    test.skip(!want("landing"));
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ colorScheme: theme });
    await page.addInitScript((t) => localStorage.setItem("theme", t), theme);
    await page.goto("/");
    await page.waitForTimeout(1500);
    await shot(page, "landing-hero", theme);

    const box = await page.evaluate(() => {
      const el = document.getElementById("how-it-works")!;
      return { top: el.offsetTop, h: el.offsetHeight, vh: window.innerHeight };
    });
    for (let s = 0; s < 5; s++) {
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), box.top + ((box.h - box.vh) * s) / 4);
      await page.waitForTimeout(1600);
      await shot(page, `landing-story-${s}`, theme);
    }
    await page.locator("[data-scene-card]").nth(3).hover({ force: true });
    await page.waitForTimeout(300);
    await shot(page, "landing-story-tooltip", theme);

    for (const [id, name] of [["features", "landing-features"], ["inside", "landing-inside"], ["pricing", "landing-pricing"], ["faq", "landing-faq"]] as const) {
      await page.evaluate((i) => document.getElementById(i)!.scrollIntoView({ behavior: "instant" }), id);
      await page.waitForTimeout(900);
      await shot(page, name, theme);
    }
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
    await page.waitForTimeout(900);
    await shot(page, "landing-end", theme);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.waitForTimeout(1200);
    await shot(page, "landing-mobile", theme);
    await page.evaluate(() => {
      const el = document.getElementById("how-it-works")!;
      window.scrollTo({ top: el.offsetTop + (el.offsetHeight - window.innerHeight) / 2, behavior: "instant" });
    });
    await page.waitForTimeout(1600);
    await shot(page, "landing-mobile-story", theme);
  });
}

/** Today and Analytics review shots, with a KPI breakdown and a chart tooltip open. */
for (const theme of themes) {
  test(`data ${theme}`, async ({ page }) => {
    test.skip(!want("data"));
    await mockAi(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ colorScheme: theme });
    await page.addInitScript((t) => localStorage.setItem("theme", t), theme);

    await page.goto("/dashboard");
    await expect(page.locator("main h1")).toBeVisible({ timeout: 30_000 });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(400);
    await shot(page, "today-mid-animation", theme);
    await page.waitForTimeout(1200);
    await shot(page, "today", theme, true);
    await page.locator("dl").first().locator("[tabindex='0']").first().hover();
    await page.waitForTimeout(700);
    await shot(page, "today-kpi-hover", theme);

    await page.goto("/analytics");
    await expect(page.locator("main h1")).toBeVisible({ timeout: 30_000 });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);
    await shot(page, "analytics", theme, true);
    const chart = page.getByRole("img", { name: /Leads added and deals won/ });
    const box = (await chart.boundingBox())!;
    await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.6);
    await page.waitForTimeout(300);
    await shot(page, "analytics-tooltip", theme);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);
    await shot(page, "today-mobile", theme, true);
  });
}

/** Pipeline, leads and lead profile review shots. Nothing is dropped or submitted. */
for (const theme of themes) {
  test(`workflow ${theme}`, async ({ page }) => {
    test.skip(!want("workflow"));
    await mockAi(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ colorScheme: theme });
    await page.addInitScript((t) => localStorage.setItem("theme", t), theme);

    await page.goto("/pipeline");
    await expect(page.getByRole("link", { name: "Elena Vasquez" })).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(800);
    await shot(page, "pipeline", theme);
    await page.getByRole("button", { name: "Move Elena Vasquez to another stage" }).click();
    await page.waitForTimeout(300);
    await shot(page, "pipeline-menu", theme);
    await page.keyboard.press("Escape");

    // Mid-drag frame: pick a card up and hold it over another column, then cancel with Escape.
    const card = page.locator('[data-lead-card="demo-lead-01"]');
    const box = (await card.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + 60);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 120, box.y + 90, { steps: 6 });
    await page.mouse.move(box.x + box.width / 2 + 290, box.y + 120, { steps: 6 });
    await page.waitForTimeout(250);
    await shot(page, "pipeline-dragging", theme);
    await page.keyboard.press("Escape");
    await page.mouse.up();

    await page.goto("/leads");
    await expect(page.getByText(/^\d+ leads$/)).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(900);
    await shot(page, "leads", theme);

    await page.goto("/leads/demo-lead-01");
    await expect(page.getByRole("heading", { level: 1, name: /Elena Vasquez/ })).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(1000);
    await shot(page, "lead-profile", theme, true);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/pipeline");
    await page.waitForTimeout(2000);
    await shot(page, "pipeline-mobile", theme);
    await page.goto("/leads/demo-lead-01");
    await page.waitForTimeout(2000);
    await shot(page, "lead-profile-mobile", theme, true);
  });
}
