import { WidgetSkeleton } from '@/features/workspace/components/widget-primitives';

export function PendingOnboardingWidget() {
  return (
    <div className="space-y-2 text-sm text-muted-foreground">
      <p className="text-3xl font-bold text-foreground">—</p>
      <p>Onboarding pipeline metrics will appear when candidates are in onboarding stage.</p>
    </div>
  );
}

export function PendingOnboardingWidgetLoader() {
  return <WidgetSkeleton title="Pending Onboarding" />;
}
