import { expect, test } from "@playwright/test";
import { expectAccessible, themes, useTheme } from "./helpers";

const publicPages = [
  { path: "/", label: "landing" },
  { path: "/login", label: "sign in" },
  { path: "/signup", label: "sign up" },
  { path: "/this-page-does-not-exist", label: "404" },
];

for (const theme of themes) {
  for (const p of publicPages) {
    test(`${p.label} is accessible in ${theme}`, async ({ page }) => {
      await useTheme(page, theme);
      await page.goto(p.path);
      await expect(page.locator("h1").first()).toBeVisible();
      await expectAccessible(page, `${p.path} (${theme})`);
    });
  }
}

test("the theme is applied before first paint, with no flash", async ({ page }) => {
  await useTheme(page, "dark");
  // Record the <html> class at the first moment the document exists.
  await page.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      (window as unknown as { __firstClass: string }).__firstClass = document.documentElement.className;
    });
  });
  await page.goto("/login");
  const first = await page.evaluate(() => (window as unknown as { __firstClass: string }).__firstClass);
  expect(first).toContain("dark");
});

test("system theme follows the OS setting", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/login");
  await expect(page.locator("html")).toHaveClass(/dark/);
});
