export const KNOWN_LIMITS: { title: string; body: string }[] = [
  {
    title: "Borderline candidates",
    body: "Simulated borderline candidates give middling answers on purpose. The scorer often rates those answers above the pass mark, so many come out suitable where the label says a recruiter should decide.",
  },
  {
    title: "Fairness",
    body: "Name-swapped replays of the same answers can score differently even at temperature 0. That is scorer noise, and a check on one persona can't tell noise from bias; scoring each soft answer more than once would.",
  },
  {
    title: "Text mode",
    body: "Simulated calls run in text, so they don't see transcription errors or interruptions. Spoken runs over SIP come later.",
  },
  {
    title: "Scale",
    body: "A run is a few dozen simulated calls on six reference jobs: measurements, not a benchmark.",
  },
  {
    title: "Where expected results come from",
    body: "Expected decisions come from the rule engine applied to each persona's ground truth, set in code from the labelled rules, so the suite never grades the system against itself.",
  },
];
