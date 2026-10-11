"use client";

import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";
import { DecisionList, type ListFilter } from "@/components/decisions/decision-list";
import { cn } from "@/lib/utils";

/** The inbox stays beside the open decision; on a narrow screen one shows at a time. */
export default function DecisionsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const selectedId = pathname.split("/")[2] ?? null;
  const [filter, setFilter] = useState<ListFilter>("pending");
  return (
    <div className="grid min-h-full @wide:grid-cols-[19rem_minmax(0,1fr)]">
      <div className={cn("border-line @wide:sticky @wide:top-0 @wide:flex @wide:h-screen @wide:flex-col @wide:border-r @wide:bg-[#0c0f14]", selectedId && "@max-wide:hidden")}>
        <DecisionList filter={filter} onFilter={setFilter} selectedId={selectedId} />
      </div>
      <div className={cn("min-w-0", !selectedId && "@max-wide:hidden")}>{children}</div>
    </div>
  );
}
