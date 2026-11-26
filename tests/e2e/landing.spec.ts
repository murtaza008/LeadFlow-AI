import { expect, test } from "@playwright/test";
import { useTheme } from "./helpers";

test("the headline is in the server HTML", async ({ request }) => {
  const html = await (await request.get("/")).text();
  // The words are split into spans for the reveal; strip tags and check the text.
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? "";
  expect(h1.replace(/<[^>]+>/g, "").replace(/<!-- -->/g, "")).toBe("Know which leads to call today.");
});

test("the 3D story loads, follows the scroll and explains a hovered lead", async ({ page }) => {
  await useTheme(page, "light", { reducedMotion: false });
  await page.goto("/");
  const story = page.locator("#how-it-works");
  await story.scrollIntoViewIfNeeded();
  await expect(page.locator('[data-scene="css3d"]')).toBeAttached({ timeout: 20_000 });
  await expect(story.locator('[aria-current="step"]')).toContainText("Capture");

  // Scroll to the end of the story: the last step becomes current.
  await page.evaluate(() => {
    const el = document.getElementById("how-it-works")!;
    window.scrollTo({ top: el.offsetTop + el.offsetHeight - window.innerHeight, behavior: "instant" });
  });
  await expect(story.locator('[aria-current="step"]')).toContainText("Follow up", { timeout: 10_000 });

  // Hovering a lead card shows a tooltip about that lead.
  await page.waitForTimeout(1500);
  const card = page.locator("[data-scene-card]").first();
  await card.hover({ force: true });
  await expect(page.getByRole("tooltip")).toBeVisible();
});

test("follow-up demo runs the real rules", async ({ page }) => {
  await page.goto("/");
  const demo = page.getByRole("radiogroup", { name: "Move the lead to a stage" });
  await demo.getByRole("radio", { name: "Qualified" }).click();
  await expect(page.getByText("Send proposal").first()).toBeVisible();
  await expect(page.getByText(/due in 2 days/).first()).toBeVisible();
});

test("focus demo drops a lead once it's won", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /^Mark won: Elena Vasquez/ }).click();
  await expect(page.getByRole("button", { name: /^Reopen: Elena Vasquez/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("Elena Vasquez").last()).toHaveClass(/line-through/);
});

test("funnel demo recalculates the win rate", async ({ page }) => {
  await page.goto("/");
  const win = page.getByRole("button", { name: "Win one" });
  const rate = page.locator("dt", { hasText: "Win rate" }).locator("xpath=following-sibling::dd");
  const before = await rate.textContent();
  await win.click();
  await expect(rate).not.toHaveText(before ?? "");
});

test("screen tabs switch the screenshot", async ({ page }) => {
  await page.goto("/");
  const tabs = page.getByRole("tablist", { name: "App screens" });
  await tabs.getByRole("tab", { name: "Pipeline" }).click();
  await expect(page.getByRole("tabpanel", { name: "Pipeline" })).toBeVisible();
  await expect(page.getByRole("tabpanel", { name: "Today" })).toBeHidden();
});

test("smooth scrolling is on for mouse users and off with reduced motion", async ({ page }) => {
  await useTheme(page, "light", { reducedMotion: false });
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/lenis/);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator("html")).not.toHaveClass(/lenis/);
});

test("the still image shows when JavaScript is off", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.getByRole("img", { name: /35 leads in five pipeline columns/ })).toBeVisible();
  await expect(page.locator("h1")).toContainText("Know which leads to call today.");
  await context.close();
});

test("the landing page logs no errors (hydration included)", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  await useTheme(page, "dark", { reducedMotion: false });
  await page.goto("/");
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 700) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 60));
    }
  });
  await page.waitForTimeout(800);
  expect(errors).toEqual([]);
});
