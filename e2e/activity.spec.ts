import { expect, test } from "@playwright/test";
import { backend, open } from "./support.ts";

test.beforeEach(() => backend("reset"));

test("the activity feed opens with what happened before the page loaded", async ({
  page,
}) => {
  // The event stream starts at the newest event, so history has to be loaded separately.
  const created = await page.request.post("/api/jobs", {
    data: {
      title: "Night Shift Lead",
      company_name: "Acme",
      description:
        "We need a night shift lead for our warehouse who can run a team of twenty people.",
    },
  });
  expect(created.status()).toBe(201);
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, "/");
  await expect(page.getByText("Job created: Night Shift Lead")).toBeVisible();
});
