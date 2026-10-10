import { expect, test } from "@playwright/test";
import { backend, open } from "./support.ts";

test.beforeEach(() => backend("reset"));

test("add, stop, resume and delete a candidate", async ({ page }) => {
  await open(page, "/jobs/job-support?tab=candidates");
  await page.getByRole("button", { name: "Add candidate" }).click();
  await page.getByLabel("Name").fill("Neha Gupta");
  await page.getByLabel("Email").fill("neha@example.com");
  await page.getByLabel("Phone").fill("98765");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByText(/international format/)).toBeVisible();
  await page.getByLabel("Phone").fill("+919876543210");
  await page.getByRole("button", { name: "Add", exact: true }).click();

  const row = page.getByRole("row", { name: /Neha Gupta/ });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Stop calling" }).click();
  await expect(row.getByText("Calling stopped")).toBeVisible();
  await expect(row.getByRole("button", { name: "Call now" })).toHaveCount(0);
  await row.getByRole("button", { name: "Resume calling" }).click();
  await expect(row.getByRole("button", { name: "Call now" })).toBeVisible();

  await row.getByRole("button", { name: "Delete Neha Gupta" }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toContainText(
    "also deletes their call recordings and transcripts",
  );
  await dialog.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByRole("row", { name: /Neha Gupta/ })).toHaveCount(0);
});

test("calling a screened candidate again asks first", async ({ page }) => {
  await open(page, "/jobs/job-support?tab=candidates");
  const row = page.getByRole("row", { name: /Meera Nair/ });
  await row.getByRole("button", { name: "Call again" }).click();
  await expect(page.getByRole("alertdialog")).toContainText("already notified");
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Call again" })
    .click();
  await expect(page.getByText("Call queued").first()).toBeVisible();
});

test("import a CSV with one bad row", async ({ page }) => {
  await open(page, "/jobs/job-support?tab=candidates");
  await page.getByRole("button", { name: "Import CSV" }).click();
  await page.getByLabel("CSV file").setInputFiles({
    name: "candidates.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      "name,email,phone\nRavi Kumar,ravi@example.com,+919800000001\nNo Email,,+919800000002\n",
    ),
  });
  await expect(page.getByText(/Added\s*1\s*candidates/)).toBeVisible();
  await expect(page.getByText(/Row 3/)).toBeVisible();
});

test("pause and restart the campaign; the board shows every stage", async ({
  page,
}) => {
  await open(page, "/jobs/job-support?tab=campaign");
  for (const column of [
    "Queued",
    "Ringing",
    "On call",
    "Retrying",
    "Callback",
    "Unreachable",
    "Done",
  ]) {
    await expect(
      page.getByRole("heading", { name: column, exact: true }),
    ).toBeVisible();
  }
  await expect(page.getByText("next ~15:30")).toBeVisible(); // Arjun: 08:00Z + 2 h, in Kolkata
  await expect(page.getByText("callback 17:00")).toBeVisible(); // Fatima asked for 11:30Z
  await expect(page.getByText("Calling now")).toBeVisible();
  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.getByText("Paused", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Resume" }).click();
  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
});

test("a long pasted résumé keeps the Add button on screen", async ({
  page,
}) => {
  await open(page, "/jobs/job-support?tab=candidates");
  await page.getByRole("button", { name: "Add candidate" }).click();
  await page
    .getByLabel("Résumé")
    .fill(
      Array.from({ length: 120 }, (_, i) => `Line ${i} of a long résumé.`).join(
        "\n",
      ),
    );
  await expect(
    page.getByRole("button", { name: "Add", exact: true }),
  ).toBeInViewport();
});
