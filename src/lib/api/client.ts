import { ApiError, BACKEND_UNREACHABLE } from "./errors";

export interface ApiInit {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  csv?: string;
  signal?: AbortSignal;
}

/** Calls the backend through the Next.js proxy (`/api/...`); never the backend directly. */
export async function api<T>(path: string, init: ApiInit = {}): Promise<T> {
  const headers: Record<string, string> = {};
  let body: string | undefined;
  if (init.csv !== undefined) {
    headers["content-type"] = "text/csv";
    body = init.csv;
  } else if (init.body !== undefined) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(init.body);
  }
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method: init.method ?? (body === undefined ? "GET" : "POST"),
      headers,
      body,
      signal: init.signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    throw new ApiError(0, BACKEND_UNREACHABLE);
  }
  if (res.status === 204) return undefined as T;
  const isJson = res.headers.get("content-type")?.includes("json") ?? false;
  const data: unknown = isJson ? await res.json() : await res.text();
  if (!res.ok) {
    const detail = typeof data === "object" && data !== null && "detail" in data ? data.detail : data;
    throw new ApiError(res.status, detail);
  }
  return data as T;
}
