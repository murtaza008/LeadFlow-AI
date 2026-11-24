import { test as setup, expect } from "@playwright/test";

/** Signs in to the shared demo account once and saves the session for the app tests. */
setup("sign in as the demo account", async ({ page, baseURL }) => {
  const res = await page.request.post("/api/demo/login", {
    headers: { origin: baseURL! },
    maxRedirects: 0,
  });
  expect(res.status(), "demo login should redirect").toBe(303);
  expect(res.headers().location).toContain("/dashboard");
  await page.goto("/dashboard");
  await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
  await page.context().storageState({ path: "tests/e2e/.auth/demo.json" });
});
