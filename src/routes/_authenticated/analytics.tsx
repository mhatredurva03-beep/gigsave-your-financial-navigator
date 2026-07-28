import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/AppShell";
import { SectionHeading } from "@/components/ui/glass-card";
import { EmptyState } from "@/components/ui/empty-state";

export const Route = createFileRoute("/_authenticated/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <SectionHeading title="Analytics" description="Coming up next in this build." />
        <EmptyState title="Analytics are being built" description="Income, expenses and your dashboard are live already." />
      </div>
    </AppShell>
  );
}
