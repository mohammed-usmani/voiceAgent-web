import { type RemoteParticipant, type RemoteTrack, Room, RoomEvent, Track } from "livekit-client";
import type { ViewerToken } from "@/lib/api/types";
import type { Emit, LiveConnection } from "./connect";
import { decodeJson, parseProgress, parseTurn, PROGRESS_TOPIC, TURNS_TOPIC } from "./messages";

// LiveKit Agents 1.x conventions (Ruling 14)
const TRANSCRIPTION = "lk.transcription";
const SEGMENT_ID = "lk.segment_id";
const FINAL = "lk.transcription_final";
const TRACK_ID = "lk.transcribed_track_id";
const AGENT_STATE = "lk.agent.state";

/** Joins the call's room as a hidden, subscribe-only viewer and turns what happens there
 * into LiveMessages. Nothing is published. */
export async function connectLiveKit(t: ViewerToken, emit: Emit): Promise<LiveConnection> {
  const room = new Room({ adaptiveStream: false, dynacast: false });
  const audio = new Map<RemoteTrack, HTMLMediaElement>();
  let focused = false;
  let listening = false;

  const agent = (): RemoteParticipant | undefined => [...room.remoteParticipants.values()].find((p) => p.isAgent);
  const isAgentStream = (trackId: string | undefined, sender: string) => {
    const a = agent();
    if (trackId && a) return a.trackPublications.has(trackId);
    return room.remoteParticipants.get(sender)?.isAgent ?? false;
  };

  room.registerTextStreamHandler(TRANSCRIPTION, (reader, from) => {
    const attrs = reader.info.attributes ?? {};
    const id = attrs[SEGMENT_ID] ?? reader.info.id;
    const role = isAgentStream(attrs[TRACK_ID], from.identity) ? "agent" : "candidate";
    void (async () => {
      let text = "";
      for await (const chunk of reader) {
        text += chunk;
        emit({ type: "caption", id, role, text, final: false });
      }
      emit({ type: "caption", id, role, text, final: attrs[FINAL] === "true" || role === "agent" });
    })().catch(() => undefined);
  });

  room.on(RoomEvent.ParticipantAttributesChanged, (_changed, p) => {
    const state = p.attributes[AGENT_STATE];
    if (p.isAgent && state) emit({ type: "agentState", state });
  });

  room.on(RoomEvent.DataReceived, (payload, _p, _kind, topic) => {
    if (topic === PROGRESS_TOPIC) {
      const progress = parseProgress(decodeJson(payload));
      if (progress) emit({ type: "progress", ...progress });
    } else if (topic === TURNS_TOPIC) {
      const point = parseTurn(decodeJson(payload));
      if (point) emit({ type: "turn", point });
    }
  });

  room.on(RoomEvent.ActiveSpeakersChanged, () => {
    let agentLevel = 0;
    let candidate = 0;
    for (const p of room.remoteParticipants.values()) {
      if (p.isAgent) agentLevel = Math.max(agentLevel, p.audioLevel);
      else candidate = Math.max(candidate, p.audioLevel);
    }
    emit({ type: "levels", agent: agentLevel, candidate });
  });

  const setSubscribed = (on: boolean) => {
    for (const p of room.remoteParticipants.values()) for (const pub of p.audioTrackPublications.values()) pub.setSubscribed(on);
  };
  room.on(RoomEvent.TrackPublished, (pub) => {
    if (pub.kind === Track.Kind.Audio) pub.setSubscribed(focused);
  });
  room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
    if (track.kind !== Track.Kind.Audio) return;
    const el = track.attach();
    el.muted = !listening; // never plays before "Listen in", even if autoplay is allowed
    el.hidden = true;
    document.body.append(el);
    audio.set(track, el);
  });
  room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
    for (const el of track.detach()) el.remove();
    audio.delete(track);
  });
  room.on(RoomEvent.Disconnected, () => emit({ type: "closed" }));

  await room.connect(t.url, t.token, { autoSubscribe: false });
  emit({ type: "connected" });
  const state = agent()?.attributes[AGENT_STATE];
  if (state) emit({ type: "agentState", state });

  const setListening = (on: boolean) => {
    listening = on;
    for (const el of audio.values()) el.muted = !on;
    emit({ type: "audio", state: on ? "playing" : "off" });
  };

  const focus = (on: boolean) => {
    focused = on;
    setSubscribed(on);
    if (!on && listening) setListening(false);
  };

  return {
    focus,
    async listen(on) {
      if (on) {
        if (!focused) focus(true);
        await room.startAudio();
      }
      setListening(on);
    },
    close() {
      for (const el of audio.values()) el.remove();
      audio.clear();
      void room.disconnect();
    },
  };
}
