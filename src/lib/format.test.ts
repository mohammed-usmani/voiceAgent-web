import { describe, expect, it } from "vitest";
import {
  formatClock,
  formatDateTime,
  formatDelta,
  formatDuration,
  formatMetric,
  formatPercent,
  formatRelative,
  formatScore,
  formatUsd,
  humanize,
} from "./format";

describe("format", () => {
  it("shows a dash for missing numbers", () => {
    expect(formatUsd(null)).toBe("—");
    expect(formatScore(undefined)).toBe("—");
    expect(formatPercent(null)).toBe("—");
    expect(formatMetric(null)).toBe("—");
    expect(formatDelta(3)).toBe("+3");
    expect(formatDelta(-0.052)).toBe("−0.052");
    expect(formatDelta(null)).toBe("—");
  });

  it("formats money, scores, percents and metrics", () => {
    expect(formatUsd(0.367248)).toBe("$0.3672");
    expect(formatUsd(2)).toBe("$2.00");
    expect(formatScore(0.725)).toBe("0.73");
    expect(formatPercent(0.667)).toBe("67%");
    expect(formatMetric(true)).toBe("yes");
    expect(formatMetric(21)).toBe("21");
    expect(formatMetric(0.8373)).toBe("0.84");
  });

  it("signs deltas with a real minus", () => {
    expect(formatDelta(0.1214)).toBe("+0.121");
    expect(formatDelta(-0.0516)).toBe("−0.052");
    expect(formatDelta(0)).toBe("±0");
  });

  it("formats call durations", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(65_000)).toBe("1:05");
    expect(formatDuration(3_725_000)).toBe("1:02:05");
    expect(formatDuration(-5_000)).toBe("0:00");
  });

  it("formats clock times in a time zone", () => {
    expect(formatClock("2026-10-10T08:30:00Z", "Asia/Kolkata")).toBe("14:00");
    expect(formatDateTime("2026-10-10T08:30:00Z", "UTC")).toMatch(
      /10 Oct.*08:30/,
    );
  });

  it("formats relative times", () => {
    const now = Date.parse("2026-10-10T10:00:00Z");
    expect(formatRelative("2026-10-10T09:59:40Z", now)).toBe("just now");
    expect(formatRelative("2026-10-10T09:57:00Z", now)).toBe("3 min ago");
    expect(formatRelative("2026-10-10T07:00:00Z", now)).toBe("3 h ago");
    expect(formatRelative("2026-10-07T07:00:00Z", now)).toMatch(/^7 Oct$/);
  });

  it("turns snake_case into words", () => {
    expect(humanize("not_suitable")).toBe("Not suitable");
    expect(humanize("in_progress")).toBe("In progress");
  });
});
