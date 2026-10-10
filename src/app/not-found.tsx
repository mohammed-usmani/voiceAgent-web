import { Compass } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="p-8">
      <EmptyState icon={Compass} title="Page not found" action={<Button asChild variant="secondary"><Link href="/">Back to the overview</Link></Button>}>
        The link may be old, or the item was deleted.
      </EmptyState>
    </div>
  );
}
