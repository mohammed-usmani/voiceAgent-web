import { expect, test } from "@playwright/test";
import { answer, backend, live, open } from "./support.ts";

test.beforeEach(() => backend("reset"));

const PAGES: [name: string, path: string, ready: string][] = [
  ["overview", "/", "Latest decisions"],
  ["job-criteria", "/jobs/job-analyst?tab=criteria", "Dropped by the agent"],
  ["job-candidates", "/jobs/job-support?tab=candidates", "Ananya Rao"],
  ["job-campaign", "/jobs/job-support?tab=campaign", "Calling hours"],
  ["decision", "/decisions/dec-ananya", "The reviewer agreed"],
  ["evaluation", "/evaluation", "Known limits"],
];

for (const [name, path, ready] of PAGES) {
  test(`${name} looks right`, async ({ page }) => {
    await open(page, path);
    await expect(page.getByText(ready).first()).toBeVisible();
    await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
  });
}

test("live call panel looks right", async ({ page }) => {
  await open(page, "/");
  const call = await answer("cand-vikram");
  const panel = page.getByRole("region", { name: "Live call with Vikram Singh" });
  await expect(panel.getByText("Hidden viewer")).toBeVisible();
  await live(page, call.room, { type: "agentState", state: "speaking" });
  await live(page, call.room, { type: "caption", id: "a1", role: "agent", text: "Do you have a graduate degree?", final: true });
  await live(page, call.room, { type: "caption", id: "c1", role: "candidate", text: "Yes, a B.Com from Pune University.", final: true });
  await live(page, call.room, { type: "progress", asking: "night_shifts", asked: ["intl_voice_years", "graduate"] });
  await expect(panel.getByText("Yes, a B.Com from Pune University.")).toBeVisible();
  await expect(panel).toHaveScreenshot("live-panel.png");
});

// the narrowest supported window: the sidebar at full width, the activity rail as a drawer
for (const [name, path, ready] of PAGES.filter(([n]) => n === "overview" || n === "decision")) {
  test(`${name} looks right at 1024 px`, async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await open(page, path);
    await expect(page.getByText(ready).first()).toBeVisible();
    await expect(page).toHaveScreenshot(`${name}-1024.png`, { fullPage: true });
  });
}
