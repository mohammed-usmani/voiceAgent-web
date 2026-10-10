import { expect, test } from "@playwright/test";
import { SUPPORT_DESCRIPTION } from "./mock/fixtures.ts";
import { backend, open } from "./support.ts";

test.beforeEach(() => backend("reset"));

test("create a job, watch the criteria agent, approve the criteria", async ({ page }) => {
  await open(page, "/jobs/new");
  await page.getByLabel("Job description").fill(SUPPORT_DESCRIPTION);
  await page.getByLabel("Job title").fill("Night Shift Support Lead");
  await page.getByLabel("Company").fill("Brightline Support (demo)");
  await page.getByRole("button", { name: "Generate criteria" }).click();

  await expect(page).toHaveURL(/\/jobs\/job-\w+\?tab=criteria/);
  await expect(page.getByText("Waiting for the criteria agent…")).toBeVisible();
  const jobId = new URL(page.url()).pathname.split("/")[2];
  await backend("criteria", { jobId, delayMs: 150 });

  await expect(page.getByText("Critique").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "International voice experience" })).toBeVisible();
  await expect(page.getByText("At least 1 year", { exact: true })).toBeVisible();
  await expect(page.getByText("Retrieve", { exact: true })).toBeVisible(); // the steps stay as "how these were made"
  await expect(page.getByText("Age limit")).toHaveCSS("text-decoration-line", "line-through");
  await page.getByRole("button", { name: "Approve criteria" }).click();
  await expect(page.getByText("Criteria v1 approved").first()).toBeVisible(); // toast (and the activity rail)
});

test("a too-short description is explained, not swallowed", async ({ page }) => {
  await open(page, "/jobs/new");
  await page.getByLabel("Job title").fill("Tester");
  await page.getByLabel("Company").fill("Acme (demo)");
  await page.getByLabel("Job description").evaluate((el) => el.removeAttribute("minlength"));
  await page.getByLabel("Job description").fill("Too short.");
  await page.getByRole("button", { name: "Generate criteria" }).click();
  await expect(page.getByText("Description: String should have at least 50 characters")).toBeVisible();
});

test("edit a requirement in a draft", async ({ page }) => {
  await open(page, "/jobs/job-analyst?tab=criteria");
  await page.getByRole("button", { name: "Edit International voice experience" }).click();
  await page.getByLabel("Rule value").fill("2");
  await page.getByRole("button", { name: "Save as draft" }).click();
  await expect(page.getByText("At least 2 years", { exact: true })).toBeVisible();
});
