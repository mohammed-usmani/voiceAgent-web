import { describe, expect, it } from "vitest";
import { isExpectedOnRoomDelete } from "./livekit";

describe("isExpectedOnRoomDelete", () => {
  it("matches the errors a deleted room causes, and nothing else", () => {
    expect(
      isExpectedOnRoomDelete(
        "publisher data channel 'RELIABLE' closed unexpectedly",
      ),
    ).toBe(true);
    expect(
      isExpectedOnRoomDelete(
        "publisher data channel 'DATA_TRACK_LOSSY' closed unexpectedly",
      ),
    ).toBe(true);
    expect(
      isExpectedOnRoomDelete(
        "DataChannel error on reliable: User-Initiated Abort, reason=",
      ),
    ).toBe(true);
    expect(
      isExpectedOnRoomDelete("DataChannel error on reliable: SCTP failure"),
    ).toBe(false);
    expect(isExpectedOnRoomDelete("could not connect to signal server")).toBe(
      false,
    );
    expect(isExpectedOnRoomDelete({ message: "closed unexpectedly" })).toBe(
      false,
    );
  });
});
