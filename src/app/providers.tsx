"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { makeQueryClient } from "@/lib/api/query-client";
import { EventsProvider } from "@/lib/events/provider";
import { LiveCallsProvider } from "@/lib/live/provider";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(makeQueryClient);
  return (
    <QueryClientProvider client={client}>
      <EventsProvider>
        <LiveCallsProvider>
          <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
        </LiveCallsProvider>
        <Toaster theme="dark" position="top-center" closeButton />
      </EventsProvider>
    </QueryClientProvider>
  );
}
