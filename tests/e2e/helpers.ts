import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

export type Theme = "light" | "dark";
export const themes: Theme[] = ["light", "dark"];

/** Put the page in a theme before it loads (next-themes reads localStorage). */
export async function useTheme(page: Page, theme: Theme, { reducedMotion = true } = {}) {
  await page.emulateMedia({ colorScheme: theme, reducedMotion: reducedMotion ? "reduce" : "no-preference" });
  await page.addInitScript((t) => {
    try {
      localStorage.setItem("theme", t);
    } catch {}
  }, theme);
}

/** Wait until every finite animation on the page has finished (max 3 s). */
export async function settle(page: Page) {
  await page.waitForTimeout(150);
  await page
    .evaluate(() =>
      Promise.race([
        Promise.all(
          document
            .getAnimations()
            .filter((a) => a.effect?.getTiming().iterations !== Infinity)
            .map((a) => a.finished),
        ),
        new Promise((r) => setTimeout(r, 3000)),
      ]),
    )
    .catch(() => {});
}

/** WCAG 2.1 AA scan of the current page state. Fails with a readable summary. */
export async function expectAccessible(page: Page, label: string) {
  // Let entry animations settle so colours are measured at their final values.
  await settle(page);
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const summary = results.violations.map(
    (v) =>
      `${v.id} (${v.impact}): ${v.help}\n` +
      v.nodes
        .slice(0, 5)
        .map((n) => `    ${n.target.join(" ")}\n      ${n.failureSummary?.split("\n").join("\n      ")}`)
        .join("\n"),
  );
  expect(summary, `axe violations on ${label}`).toEqual([]);
}

/**
 * Every route that would call Gemini is answered locally, so tests never spend
 * the free-tier quota or the demo's hourly AI budget, and never write data.
 */
export async function mockAi(page: Page) {
  await page.route(/\/api\/leads\/[^/]+\/score$/, (route) =>
    route.fulfill({ status: 429, json: { error: "Mocked in tests: live AI scoring is not called.", demo: true } }),
  );
  await page.route(/\/api\/leads\/[^/]+\/insights$/, (route) =>
    route.fulfill({ status: 429, json: { error: "Mocked in tests: live AI insights are not called.", demo: true } }),
  );
}

export const appPages = [
  { path: "/dashboard", label: "Today" },
  { path: "/leads", label: "Leads" },
  { path: "/leads/demo-lead-01", label: "Leads" },
  { path: "/pipeline", label: "Pipeline" },
  { path: "/follow-ups", label: "Follow-ups" },
  { path: "/analytics", label: "Analytics" },
  { path: "/team", label: "Team" },
  { path: "/billing", label: "Billing" },
  { path: "/settings", label: "Settings" },
] as const;

/** The page is loaded: the breadcrumb names it and the page has its h1. */
export async function expectPage(page: Page, label: string) {
  // Generous: the test DB is a remote Neon instance (~0.6 s per request from a dev machine).
  await expect(page.getByRole("navigation", { name: "Breadcrumb" }).getByText(label, { exact: true })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.locator("main h1").first()).toBeVisible({ timeout: 20_000 });
}
