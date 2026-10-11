import { expect, test } from "@playwright/test";
import { answer, backend, live, open } from "./support.ts";

test.beforeEach(() => backend("reset"));

test("a live call pops up, streams, and flips to its verdict", async ({ page }) => {
  await open(page, "/");
  const call = await answer("cand-vikram");
  const panel = page.getByRole("region", { name: "Live call with Vikram Singh" });
  await expect(panel).toBeVisible();
  await expect(panel.getByText("Hidden viewer")).toBeVisible();

  await live(page, call.room, { type: "agentState", state: "speaking" });
  await expect(panel.getByText("Speaking")).toBeVisible();
  await live(page, call.room, { type: "caption", id: "s1", role: "agent", text: "Hi Vikram, this is Aria", final: false });
  await live(page, call.room, { type: "caption", id: "s1", role: "agent", text: "Hi Vikram, this is Aria, an AI assistant.", final: true });
  await expect(panel.getByText("Hi Vikram, this is Aria, an AI assistant.")).toBeVisible();
  await live(page, call.room, { type: "progress", asking: "graduate", asked: ["intl_voice_years"] });
  await expect(panel.locator('[data-state="asked"]')).toHaveCount(1);
  await expect(panel.locator('[data-state="asking"]')).toHaveCount(1);
  await live(page, call.room, { type: "turn", point: { i: 0, kind: "pause", t: 4.2, outcome: "respond", eot_delay_ms: 600, reply_delay_ms: 1800, paused_then_resumed: false, suspect: null } });
  await expect(panel.getByText("median reply 1.80 s")).toBeVisible();
  await panel.getByRole("button", { name: "Listen in" }).click();
  await expect(panel.getByRole("button", { name: "Stop listening" })).toBeVisible();

  await backend("end", { callId: call.id });
  await expect(panel.getByText("Completed · assessing…")).toBeVisible();
  await backend("decide", { callId: call.id, result: "suitable" });
  await expect(panel.getByText("Suitable")).toBeVisible();
  await expect(panel.getByRole("link", { name: "Review decision" })).toBeVisible();
});

test("the result card goes once its decision is overridden elsewhere", async ({ page }) => {
  await open(page, "/");
  const call = await answer("cand-vikram");
  const panel = page.getByRole("region", { name: "Live call with Vikram Singh" });
  await expect(panel.getByText("Hidden viewer")).toBeVisible();
  await backend("end", { callId: call.id });
  const decision = await backend<{ id: string }>("decide", { callId: call.id, result: "needs_review" });
  await expect(panel.getByText("Needs review")).toBeVisible();
  // another recruiter (or another tab) overrides it
  const res = await fetch(`http://127.0.0.1:8787/decisions/${decision.id}:override`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": "test-key" },
    body: JSON.stringify({ result: "suitable", note: "Clear answers." }),
  });
  expect(res.ok).toBe(true);
  await expect(panel).toHaveCount(0);
});

test("the result card goes when its decision is opened", async ({ page }) => {
  await open(page, "/");
  const call = await answer("cand-vikram");
  const panel = page.getByRole("region", { name: "Live call with Vikram Singh" });
  await expect(panel.getByText("Hidden viewer")).toBeVisible();
  await backend("end", { callId: call.id });
  await backend("decide", { callId: call.id, result: "needs_review" });
  await panel.getByRole("link", { name: "Review decision" }).click();
  await expect(page).toHaveURL(/\/decisions\/dec-/);
  await expect(panel).toHaveCount(0);
});

test("a second call docks without stealing focus", async ({ page }) => {
  await open(page, "/");
  await answer("cand-vikram");
  await expect(page.getByRole("region", { name: "Live call with Vikram Singh" })).toBeVisible();
  await answer("cand-priya", "2026-10-10T09:29:00Z");
  const dock = page.getByRole("region", { name: "Other live calls" });
  await expect(dock.getByText("Priya Iyer")).toBeVisible();
  await expect(page.getByText("Priya Iyer answered")).toBeVisible();
  await expect(page.getByRole("region", { name: "Live call with Vikram Singh" })).toBeVisible();
  await dock.getByRole("button", { name: /Priya Iyer/ }).click();
  await expect(page.getByRole("region", { name: "Live call with Priya Iyer" })).toBeVisible();
  await page.keyboard.press("ControlOrMeta+j");
  await expect(page.getByRole("dialog", { name: "Live wall" }).getByText("Vikram Singh")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Live wall" })).toHaveCount(0);
});

test("focus moves to the longest-running call ~5 s after the focused one ends", async ({ page }) => {
  await open(page, "/");
  const first = await answer("cand-vikram", "2026-10-10T09:20:00Z");
  await expect(page.getByRole("region", { name: "Live call with Vikram Singh" })).toBeVisible();
  await answer("cand-priya", "2026-10-10T09:25:00Z");
  await answer("cand-arjun", "2026-10-10T09:28:00Z");
  await backend("end", { callId: first.id });
  await expect(page.getByText("Completed · assessing…")).toBeVisible();
  await expect(page.getByRole("region", { name: "Live call with Priya Iyer" })).toBeVisible({ timeout: 8_000 });
});

test("a refused live view says so and the rest keeps working", async ({ page }) => {
  await open(page, "/");
  await backend("refuse-viewer", { candidateId: "cand-vikram" });
  await answer("cand-vikram");
  await expect(page.getByText("Live view unavailable — the call is still running")).toBeVisible();
  await page.getByRole("link", { name: "Evaluation" }).click();
  await expect(page.getByRole("heading", { name: "Evaluation" })).toBeVisible();
});

test("events missed while disconnected still arrive", async ({ page }) => {
  await open(page, "/");
  await backend("drop-streams");
  await answer("cand-vikram"); // happens while the stream is down
  await expect(page.getByTestId("stream-status")).toHaveAttribute("data-status", "open");
  await expect(page.getByRole("region", { name: "Live call with Vikram Singh" })).toBeVisible();
});
