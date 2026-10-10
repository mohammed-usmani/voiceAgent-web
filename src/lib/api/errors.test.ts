import { describe, expect, it } from "vitest";
import { ApiError, BACKEND_UNREACHABLE, errorText, isBackendDown, isForceable, messageOf } from "./errors";

describe("errorText", () => {
  it("capitalises a plain detail", () => {
    expect(errorText("candidate not found", 404)).toBe("Candidate not found");
  });

  it("reads FastAPI validation arrays field by field", () => {
    const detail = [
      { loc: ["body", "description"], msg: "String should have at least 50 characters", type: "string_too_short" },
      { loc: ["body"], msg: "Value error, give a phone number or a SIP address", type: "value_error" },
    ];
    expect(errorText(detail, 422)).toBe(
      "Description: String should have at least 50 characters; Give a phone number or a SIP address",
    );
  });

  it("joins criteria approval errors", () => {
    expect(errorText({ errors: ["night_shifts: a hard requirement needs a rule", "add at least one requirement"] }, 422)).toBe(
      "Night_shifts: a hard requirement needs a rule; Add at least one requirement",
    );
  });

  it("names the backend when it is unreachable", () => {
    expect(errorText(BACKEND_UNREACHABLE, 502)).toBe("Can't reach the screening backend");
  });

  it("falls back to the status for anything else", () => {
    expect(errorText({ weird: true }, 500)).toBe("Request failed (500)");
  });
});

describe("error predicates", () => {
  it("spots a 409 that a force flag would override", () => {
    expect(isForceable(new ApiError(409, 'candidate is screened; send {"force": true} to call again'))).toBe(true);
    expect(isForceable(new ApiError(409, "a call to this candidate is already active"))).toBe(false);
    expect(isForceable(new Error("x"))).toBe(false);
  });

  it("spots an unreachable backend", () => {
    expect(isBackendDown(new ApiError(0, BACKEND_UNREACHABLE))).toBe(true);
    expect(isBackendDown(new ApiError(502, BACKEND_UNREACHABLE))).toBe(true);
    expect(isBackendDown(new ApiError(404, "job not found"))).toBe(false);
  });

  it("gives every error a sentence", () => {
    expect(messageOf(new ApiError(404, "job not found"))).toBe("Job not found");
    expect(messageOf(new Error("boom"))).toBe("boom");
    expect(messageOf("??")).toBe("Something went wrong");
  });
});
