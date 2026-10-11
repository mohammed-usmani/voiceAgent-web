import { expect, test } from "@playwright/test";
import { backend, open } from "./support.ts";

test.beforeEach(() => backend("reset"));

const PAGES: [name: string, path: string, ready: string][] = [
  ["overview", "/", "Latest decisions"],
  ["job criteria", "/jobs/job-analyst?tab=criteria", "Dropped by the agent"],
  ["job candidates", "/jobs/job-support?tab=candidates", "Ananya Rao"],
  ["job campaign", "/jobs/job-support?tab=campaign", "Calling hours"],
  ["job decisions", "/jobs/job-support?tab=decisions", "Rahul Verma"],
  ["candidate", "/candidates/cand-ananya", "Résumé"],
  ["decision", "/decisions/dec-ananya", "The reviewer agreed"],
  ["evaluation", "/evaluation", "Known limits"],
  ["new job", "/jobs/new", "Job description"],
];

// Wide content (tables, the campaign board, the run timeline) scrolls inside its own box, never the page.
for (const width of [1024, 1280, 1440]) {
  test(`no page scrolls sideways at ${width} px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const [name, path, ready] of PAGES) {
      await open(page, path);
      await expect(page.getByText(ready).first()).toBeVisible();
      const { scroll, inner } = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, inner: window.innerWidth }));
      expect(scroll, `${name} at ${width} px`).toBeLessThanOrEqual(inner);
    }
  });
}

test("below 1280 px the activity rail is a drawer, closed until asked for", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 800 });
  await open(page, "/");
  await expect(page.getByRole("heading", { name: "Activity" })).toHaveCount(0);
  await page.getByRole("button", { name: "Show activity" }).click();
  const drawer = page.getByRole("dialog", { name: "Activity" });
  await expect(drawer).toBeVisible();
  await drawer.getByRole("button", { name: "Hide activity" }).click();
  await expect(drawer).toHaveCount(0);
  await page.keyboard.press("ControlOrMeta+.");
  await expect(drawer).toBeVisible();
});

test("below 1024 px the sidebar is an icon rail that keeps its names", async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 800 });
  await open(page, "/");
  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(nav.getByRole("link", { name: "Customer Support Associate" })).toHaveAttribute("title", "Customer Support Associate");
  expect((await nav.boundingBox())?.width).toBeLessThan(80);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
