import { Inbox } from "lucide-react";

/** Beside the inbox on a wide screen, until a decision is picked. */
export default function DecisionsPage() {
  return (
    <div className="grid h-full min-h-[60vh] place-items-center p-8">
      <div className="max-w-sm text-center">
        <Inbox className="mx-auto mb-4 size-7 text-text-dim" aria-hidden />
        <p className="font-semibold">Pick a decision to review</p>
        <p className="mt-1 text-sm text-text-muted">Each one shows the candidate&apos;s own words for every requirement, a second model&apos;s check, and the message that will go out.</p>
      </div>
    </div>
  );
}
