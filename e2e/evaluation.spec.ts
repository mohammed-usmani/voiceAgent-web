import { expect, test } from "@playwright/test";
import { backend, open } from "./support.ts";

test.beforeEach(() => backend("reset"));

test("runs, stages, matrix, drill-down and comparison", async ({ page }) => {
  await open(page, "/evaluation");
  for (const stage of ["Criteria", "Answer capture", "Decisions", "Conversation", "Messages", "Reviewer", "Calibration", "Fairness", "Cost"]) {
    await expect(page.getByRole("heading", { name: stage, exact: true })).toBeVisible();
  }
  await expect(page.getByText("offline", { exact: true })).toHaveCount(0);
  await page.getByLabel("Show offline runs").click();
  await expect(page.getByText("offline", { exact: true })).toBeVisible();

  await expect(page.getByLabel("expected Needs review, got Suitable: 1")).toBeVisible();
  await page.getByRole("button", { name: "Ananya Rao" }).click();
  await expect(page.getByRole("dialog")).toContainText("About a year and a half");
  await page.keyboard.press("Escape");

  await page.getByLabel("Run to compare with").selectOption({ index: 1 });
  await expect(page.locator("table").filter({ hasText: "Then" }).getByText("Decisions: Accuracy")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Known limits" })).toBeVisible();
});
