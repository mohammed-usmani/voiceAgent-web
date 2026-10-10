"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { describeEvent } from "@/lib/events/describe";
import { useEventListener } from "@/lib/events/provider";

/** Toasts for background events (criteria ready, new decisions, failed sends, ...). */
export function EventToasts() {
  const router = useRouter();
  useEventListener((e) => {
    const v = describeEvent(e);
    if (!v.toast) return;
    const href = v.href;
    toast[v.toast](v.text, { action: href ? { label: "Open", onClick: () => router.push(href) } : undefined });
  });
  return null;
}
