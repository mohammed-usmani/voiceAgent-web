"use client";

import { useState } from "react";
import { DecisionQueue } from "@/components/decisions/decision-queue";
import { PageHeader } from "@/components/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DecisionsPage() {
  const [tab, setTab] = useState("pending");
  return (
    <>
      <PageHeader title="Decisions" subtitle="Every screening call ends in a decision. Approve it to send the message, or override it." />
      <Tabs value={tab} onValueChange={setTab} className="p-8">
        <TabsList>
          <TabsTrigger value="pending">To review</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-4"><DecisionQueue status="pending_review" /></TabsContent>
        <TabsContent value="all" className="mt-4"><DecisionQueue /></TabsContent>
      </Tabs>
    </>
  );
}
