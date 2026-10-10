import { expect, type Page } from "@playwright/test";
import type { Call } from "../src/lib/api/types";
import type { LiveMessage } from "../src/lib/live/call-state";
import { NOW } from "./mock/fixtures.ts";

const MOCK = "http://127.0.0.1:8787";

export async function backend<T = unknown>(action: string, body: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(`${MOCK}/__test/${action}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`${action}: ${res.status} ${await res.text()}`);
  return (await res.json()) as T;
}

/** Opens a page with the clock fixed and waits for the event stream to connect. */
export async function open(page: Page, path: string): Promise<void> {
  await page.clock.setFixedTime(new Date(NOW));
  await page.goto(path);
  await expect(page.getByTestId("stream-status")).toHaveAttribute("data-status", "open");
}

export const answer = (candidateId: string, startedAt = "2026-10-10T09:27:48Z") => backend<Call>("answer", { candidateId, startedAt });

export async function live(page: Page, room: string, message: LiveMessage): Promise<void> {
  await page.evaluate(({ room, message }) => window.dispatchEvent(new CustomEvent("fake-live", { detail: { room, message } })), { room, message });
}
