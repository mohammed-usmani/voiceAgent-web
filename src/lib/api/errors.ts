export const BACKEND_UNREACHABLE = "backend_unreachable";

export class ApiError extends Error {
  status: number;
  detail: unknown;

  constructor(status: number, detail: unknown) {
    super(errorText(detail, status));
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function sentence(s: string): string {
  const t = s.trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function validationLine(item: Record<string, unknown>): string {
  const msg = String(item.msg).replace(/^Value error, /, "");
  const loc = Array.isArray(item.loc) ? item.loc.filter((p): p is string => typeof p === "string" && p !== "body") : [];
  const field = loc.at(-1);
  return field ? `${sentence(field)}: ${msg}` : sentence(msg);
}

/** A readable sentence for whatever FastAPI put in `detail`. */
export function errorText(detail: unknown, status: number): string {
  if (detail === BACKEND_UNREACHABLE) return "Can't reach the screening backend";
  if (typeof detail === "string" && detail.trim()) return sentence(detail);
  if (Array.isArray(detail)) {
    const lines = detail.filter(isRecord).filter((d) => typeof d.msg === "string").map(validationLine);
    if (lines.length) return lines.join("; ");
  }
  if (isRecord(detail) && Array.isArray(detail.errors)) {
    const lines = detail.errors.filter((e): e is string => typeof e === "string").map(sentence);
    if (lines.length) return lines.join("; ");
  }
  return `Request failed (${status})`;
}

export function messageOf(e: unknown): string {
  if (e instanceof Error && e.message) return e.message;
  return "Something went wrong";
}

/** A 409 the backend would accept with `{"force": true}`: ask, then retry with force. */
export function isForceable(e: unknown): boolean {
  return e instanceof ApiError && e.status === 409 && typeof e.detail === "string" && e.detail.includes('"force": true');
}

export function isBackendDown(e: unknown): boolean {
  return e instanceof ApiError && (e.status === 0 || e.detail === BACKEND_UNREACHABLE);
}

export function isNotFound(e: unknown): boolean {
  return e instanceof ApiError && e.status === 404;
}
