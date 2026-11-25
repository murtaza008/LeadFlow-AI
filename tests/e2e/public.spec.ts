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

test("sign-in shows and hides the password, and links to sign-up", async ({ page }) => {
  await page.goto("/login");
  const pw = page.getByLabel("Password", { exact: true });
  await pw.fill("secret-pass");
  await expect(pw).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "Show password" }).click();
  await expect(pw).toHaveAttribute("type", "text");
  await page.getByRole("link", { name: "Create an account" }).click();
  await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
  await expect(page.getByText("At least 8 characters.")).toBeVisible();
});

test("the 404 page offers a way back", async ({ page }) => {
  const res = await page.goto("/no-such-page");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: /This page isn.t here/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Home page" })).toBeVisible();
});

for (const theme of themes) {
  test(`an unknown invite link explains itself and is accessible in ${theme}`, async ({ page }) => {
    await useTheme(page, theme);
    await page.goto("/invite/not-a-real-token");
    await expect(page.getByRole("heading", { name: "Invite not found" })).toBeVisible({ timeout: 20_000 });
    await expectAccessible(page, `invite not found (${theme})`);
  });
}
