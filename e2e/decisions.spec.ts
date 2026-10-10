import { expect, test } from "@playwright/test";
import { backend, open } from "./support.ts";

test.beforeEach(() => backend("reset"));

test("edit the message, approve and send", async ({ page }) => {
  await open(page, "/decisions/dec-ananya");
  await expect(page.getByRole("row", { name: /International voice experience/ })).toContainText("Pass");
  await expect(page.getByText("The reviewer agreed")).toBeVisible();
  await page.getByLabel("Subject").fill("Next steps with Brightline Support");
  await page.getByRole("button", { name: "Save message" }).click();
  await expect(page.getByText("Message saved")).toBeVisible();
  await page.getByRole("button", { name: "Approve & send" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Approve & send" }).click();
  await expect(page.getByLabel("Verdict").getByText("Approved")).toBeVisible();
});

test("override a decision that needs review", async ({ page }) => {
  await open(page, "/decisions/dec-rahul");
  await expect(page.getByRole("button", { name: "Approve & send" })).toBeDisabled();
  await expect(page.getByText("The reviewer challenged this")).toBeVisible();
  await page.getByRole("button", { name: "Override" }).click();
  await page.getByLabel("Suitable", { exact: true }).check();
  await page.getByLabel("Why").fill("Solid answers; the upset-customer answer was short but right.");
  await expect(page.getByText("This calibrates future scoring", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Save override" }).click();
  await expect(page.getByLabel("Verdict").getByText("Overridden")).toBeVisible();
  await expect(page.getByLabel("Message body")).toHaveValue(/invite you to the next round/);
});

test("the review queue lists pending decisions", async ({ page }) => {
  await open(page, "/decisions");
  await expect(page.getByRole("link", { name: "Rahul Verma" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Meera Nair" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Decisions/ }).getByLabel("2 pending")).toBeVisible();
});
