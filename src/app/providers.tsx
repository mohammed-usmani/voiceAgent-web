"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { makeQueryClient } from "@/lib/api/query-client";
import { EventsProvider } from "@/lib/events/provider";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(makeQueryClient);
  return (
    <QueryClientProvider client={client}>
      <EventsProvider>
        <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
        <Toaster theme="dark" position="top-center" closeButton />
      </EventsProvider>
    </QueryClientProvider>
  );
}
