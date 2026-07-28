import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/AppShell";
import { SectionHeading } from "@/components/ui/glass-card";
import { EmptyState } from "@/components/ui/empty-state";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <SectionHeading title="Settings" description="Coming up next in this build." />
        <EmptyState title="Settings are being built" description="Income, expenses and your dashboard are live already." />
      </div>
    </AppShell>
  );
}
