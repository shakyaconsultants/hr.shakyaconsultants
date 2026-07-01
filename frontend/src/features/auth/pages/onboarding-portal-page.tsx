import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchOnboardingPortal, saveOnboardingDraft, submitOnboardingPortal } from '@/features/auth/api/auth.api';
import { Button } from '@/shared/components/ui/button';
import { Loading } from '@/shared/components/loading';

const SECTIONS = ['personal', 'address', 'bank', 'documents', 'emergency'] as const;

export function OnboardingPortalPage({ secureToken }: { secureToken: string }) {
  const [state, setState] = useState<Record<string, unknown> | null>(null);
  const [section, setSection] = useState<string>('personal');
  const [formJson, setFormJson] = useState('{}');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchOnboardingPortal(secureToken)
      .then((data) => {
        setState(data);
        const formData = (data.formData as Record<string, unknown> | undefined) ?? {};
        const current = (data.currentSection as string | undefined) ?? 'personal';
        setSection(current);
        setFormJson(JSON.stringify(formData[current] ?? {}, null, 2));
      })
      .catch(() => setError('This onboarding link is invalid or expired.'))
      .finally(() => setLoading(false));
  }, [secureToken]);

  if (loading) return <Loading message="Loading onboarding portal..." />;

  if (error) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <h2 className="text-xl font-semibold">Portal unavailable</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (message) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <h2 className="text-xl font-semibold">Onboarding submitted</h2>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      </div>
    );
  }

  const progress = typeof state?.progressPercent === 'number' ? state.progressPercent : 0;

  const saveDraft = async () => {
    try {
      const data = JSON.parse(formJson) as Record<string, unknown>;
      await saveOnboardingDraft(secureToken, section, data);
      setMessage(null);
      setError(null);
    } catch {
      setError('Invalid JSON or save failed');
    }
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await saveDraft();
    const result = await submitOnboardingPortal(secureToken);
    setMessage(typeof result.status === 'string' ? 'Thank you — onboarding submitted.' : 'Submitted successfully.');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Employee onboarding</h2>
        <p className="text-sm text-muted-foreground">Complete your profile details. This secure link expires in 48 hours.</p>
        <p className="text-sm text-muted-foreground">Complete each section and save your progress anytime.</p>
        <div className="mt-4 h-2 rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${String(progress)}%` }} />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {SECTIONS.map((item) => (
          <Button key={item} type="button" variant={section === item ? 'default' : 'outline'} size="sm" onClick={() => setSection(item)}>
            {item}
          </Button>
        ))}
      </div>
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4 rounded-lg border bg-card p-4">
        <label className="block space-y-1 text-sm">
          <span className="font-medium capitalize">{section} data (JSON)</span>
          <textarea className="min-h-[200px] w-full rounded-md border p-3 font-mono text-xs" value={formJson} onChange={(e) => setFormJson(e.target.value)} />
        </label>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => void saveDraft()}>
            Save draft
          </Button>
          <Button type="submit">Submit onboarding</Button>
        </div>
      </form>
    </div>
  );
}

export function OnboardingPortalRoutePage() {
  const { secureToken = '' } = useParams();
  return <OnboardingPortalPage secureToken={secureToken} />;
}
