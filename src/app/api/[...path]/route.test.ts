// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, GET, POST } from "./route";

const ctx = (...path: string[]) => ({ params: Promise.resolve({ path }) });

beforeEach(() => {
  vi.stubEnv("SCREENING_API_URL", "http://backend.test");
  vi.stubEnv("SCREENING_API_KEY", "secret");
});

describe("BFF proxy", () => {
  it("forwards path, query and the API key", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json([{ id: "c" }]));
    vi.stubGlobal("fetch", fetchMock);
    const res = await GET(new Request("http://app.test/api/jobs/j1/criteria?status=approved"), ctx("jobs", "j1", "criteria"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual([{ id: "c" }]);
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(String(url)).toBe("http://backend.test/jobs/j1/criteria?status=approved");
    expect(new Headers(init.headers).get("x-api-key")).toBe("secret");
  });

  it("keeps the colon of action routes and forwards CSV bodies", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ created: 1, errors: [] }));
    vi.stubGlobal("fetch", fetchMock);
    const req = new Request("http://app.test/api/jobs/j1/candidates:import", {
      method: "POST",
      headers: { "content-type": "text/csv" },
      body: "name,email\nA,a@b.co\n",
    });
    await POST(req, ctx("jobs", "j1", "candidates:import"));
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(String(url)).toBe("http://backend.test/jobs/j1/candidates:import");
    expect(new Headers(init.headers).get("content-type")).toBe("text/csv");
    expect(new TextDecoder().decode(init.body as ArrayBuffer)).toBe("name,email\nA,a@b.co\n");
  });

  it("passes errors and empty responses through", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ detail: "nope" }, { status: 409 })));
    const conflict = await POST(new Request("http://app.test/api/decisions/d:approve", { method: "POST" }), ctx("decisions", "d:approve"));
    expect(conflict.status).toBe(409);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    const gone = await DELETE(new Request("http://app.test/api/candidates/c", { method: "DELETE" }), ctx("candidates", "c"));
    expect(gone.status).toBe(204);
  });

  it("streams server-sent events without caching", async () => {
    const body = new ReadableStream({ start: (c) => c.enqueue(new TextEncoder().encode(": hi\n\n")) });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body, { headers: { "content-type": "text/event-stream" } })));
    const res = await GET(new Request("http://app.test/api/events/stream"), ctx("events", "stream"));
    expect(res.headers.get("content-type")).toBe("text/event-stream");
    expect(res.headers.get("cache-control")).toBe("no-cache, no-transform");
    expect(res.body).not.toBeNull();
  });

  it("refuses anything outside the API's roots", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect((await GET(new Request("http://app.test/api/docs"), ctx("docs"))).status).toBe(404);
    expect((await GET(new Request("http://app.test/api/jobs/.."), ctx("jobs", ".."))).status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports an unreachable backend as 502", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    const res = await GET(new Request("http://app.test/api/jobs"), ctx("jobs"));
    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toEqual({ detail: "backend_unreachable" });
  });

  it("says so when the server isn't configured", async () => {
    vi.stubEnv("SCREENING_API_KEY", "");
    const res = await GET(new Request("http://app.test/api/jobs"), ctx("jobs"));
    expect(res.status).toBe(500);
  });
});
