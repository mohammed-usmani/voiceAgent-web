import { describe, expect, it, vi } from "vitest";
import { api } from "./client";
import { ApiError, BACKEND_UNREACHABLE } from "./errors";

function respond(status: number, body?: unknown) {
  return vi.fn().mockResolvedValue(
    new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: body === undefined ? {} : { "content-type": "application/json" },
    }),
  );
}

describe("api", () => {
  it("calls the BFF with JSON and returns the body", async () => {
    const fetchMock = respond(201, { id: "j1" });
    vi.stubGlobal("fetch", fetchMock);
    await expect(api("/jobs", { body: { title: "x" } })).resolves.toEqual({ id: "j1" });
    expect(fetchMock).toHaveBeenCalledWith("/api/jobs", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ title: "x" }),
      headers: { "content-type": "application/json" },
    }));
  });

  it("sends CSV as text", async () => {
    const fetchMock = respond(200, { created: 1, errors: [] });
    vi.stubGlobal("fetch", fetchMock);
    await api("/jobs/j1/candidates:import", { method: "POST", csv: "name,email\n" });
    expect(fetchMock).toHaveBeenCalledWith("/api/jobs/j1/candidates:import", expect.objectContaining({
      body: "name,email\n",
      headers: { "content-type": "text/csv" },
    }));
  });

  it("returns undefined for 204", async () => {
    vi.stubGlobal("fetch", respond(204));
    await expect(api("/candidates/c1", { method: "DELETE" })).resolves.toBeUndefined();
  });

  it("throws ApiError with the backend's detail", async () => {
    vi.stubGlobal("fetch", respond(409, { detail: "the message was already sent" }));
    const error = await api("/decisions/d1:approve", { method: "POST" }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 409, message: "The message was already sent" });
  });

  it("turns a network failure into an unreachable-backend error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(api("/jobs")).rejects.toMatchObject({ status: 0, detail: BACKEND_UNREACHABLE });
  });
});
