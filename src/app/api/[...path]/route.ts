import { BACKEND_UNREACHABLE } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

// The backend's route roots; anything else (/docs, /openapi.json, ..) is not exposed.
const ROOTS = new Set([
  "health",
  "jobs",
  "candidates",
  "calls",
  "decisions",
  "messages",
  "events",
  "evals",
]);
const REQUEST_HEADERS = ["content-type", "accept"];

type Context = { params: Promise<{ path: string[] }> };

function detail(status: number, text: string): Response {
  return Response.json({ detail: text }, { status });
}

/** The upstream body, ended quietly instead of erroring when the browser leaves: closing a
 * tab aborts the upstream fetch mid-stream, which Next logged as "failed to pipe response". */
function endQuietlyOnAbort(
  body: ReadableStream<Uint8Array>,
  signal: AbortSignal,
): ReadableStream<Uint8Array> {
  const reader = body.getReader();
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) controller.close();
        else controller.enqueue(value);
      } catch (error) {
        if (signal.aborted) controller.close();
        else controller.error(error);
      }
    },
    cancel(reason) {
      return reader.cancel(reason);
    },
  });
}

/** Forwards /api/<path> to SCREENING_API_URL/<path> with the API key, streaming the reply
 * back (which is how the event stream passes through). */
async function proxy(request: Request, { params }: Context): Promise<Response> {
  const { path } = await params;
  if (
    !ROOTS.has(path[0] ?? "") ||
    path.some((p) => p === "." || p === ".." || p === "")
  ) {
    return detail(404, "Not Found");
  }
  const base = process.env.SCREENING_API_URL;
  const key = process.env.SCREENING_API_KEY;
  if (!base || !key)
    return detail(500, "SCREENING_API_URL and SCREENING_API_KEY must be set");

  const segments = path.map((p) =>
    encodeURIComponent(p).replaceAll("%3A", ":"),
  );
  const target = new URL(`${base.replace(/\/$/, "")}/${segments.join("/")}`);
  target.search = new URL(request.url).search;

  const headers = new Headers({ "x-api-key": key });
  for (const name of REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const hasBody = request.method === "POST" || request.method === "PATCH";

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      signal: request.signal,
      cache: "no-store",
    });
  } catch {
    if (request.signal.aborted) return new Response(null, { status: 499 });
    return detail(502, BACKEND_UNREACHABLE);
  }

  const out = new Headers();
  const type = upstream.headers.get("content-type");
  if (type) out.set("content-type", type);
  if (type?.startsWith("text/event-stream") && upstream.body) {
    out.set("cache-control", "no-cache, no-transform");
    out.set("x-accel-buffering", "no");
    return new Response(endQuietlyOnAbort(upstream.body, request.signal), {
      status: upstream.status,
      headers: out,
    });
  }
  return new Response(upstream.status === 204 ? null : upstream.body, {
    status: upstream.status,
    headers: out,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
