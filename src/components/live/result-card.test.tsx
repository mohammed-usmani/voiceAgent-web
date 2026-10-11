import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import type { LiveCall } from "@/lib/live/focus";
import { ResultCard } from "./result-card";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => <a href={href} {...rest}>{children}</a>,
}));

const ended: LiveCall = {
  id: "call1",
  candidateId: "c1",
  candidateName: "Vikram Singh",
  jobId: "j1",
  jobTitle: "Customer Support Associate",
  room: "screen-1",
  startedAt: 0,
  phase: "ended",
  endReason: "completed",
  decision: null,
  notAssessed: false,
};

describe("ResultCard", () => {
  it("says the call is being assessed, then flips to the verdict", async () => {
    const { rerender } = render(<ResultCard call={ended} onDismiss={() => {}} />);
    expect(screen.getByText("Completed · assessing…")).toBeInTheDocument();
    rerender(<ResultCard call={{ ...ended, decision: { id: "d9", result: "suitable" } }} onDismiss={() => {}} />);
    expect(await screen.findByText("Suitable")).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "Review decision" })).toHaveAttribute("href", "/decisions/d9");
  });

  it("shows the recruiter's result over the agent's verdict", () => {
    render(<ResultCard call={{ ...ended, decision: { id: "d9", result: "needs_review" } }} final="suitable" onDismiss={() => {}} />);
    expect(screen.getByText("Result")).toBeInTheDocument();
    expect(screen.getByText("Suitable")).toBeInTheDocument();
    expect(screen.queryByText("Needs review")).not.toBeInTheDocument();
  });
});
