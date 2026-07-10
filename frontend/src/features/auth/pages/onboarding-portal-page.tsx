import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  fetchOnboardingPortal,
  saveOnboardingDraft,
  submitOnboardingPortal,
} from '@/features/auth/api/auth.api';
import {
  AddressSection,
  BankSection,
  DocumentsSection,
  EmergencySection,
  PersonalSection,
  emptyOnboardingForm,
  hydrateFormFromApi,
  sectionToPayload,
  validateSection,
  type OnboardingFormState,
  type OnboardingSectionId,
} from '@/features/auth/components/onboarding-portal-sections';
import { Button } from '@/shared/components/ui/button';
import { Loading } from '@/shared/components/loading';
import { cn } from '@/shared/utils/cn';

const SECTIONS: { id: OnboardingSectionId; label: string }[] = [
  { id: 'personal', label: 'Personal' },
  { id: 'address', label: 'Address' },
  { id: 'bank', label: 'Bank' },
  { id: 'documents', label: 'Education' },
  { id: 'emergency', label: 'Emergency' },
];

const REQUIRED_SECTIONS = SECTIONS.filter((s) => s.id !== 'documents');

export function OnboardingPortalPage({ secureToken }: { secureToken: string }) {
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState<OnboardingFormState>(emptyOnboardingForm);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const section = SECTIONS[stepIndex].id;
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === SECTIONS.length - 1;

  useEffect(() => {
    void fetchOnboardingPortal(secureToken)
      .then((data) => {
        const formData = (data.formData as Record<string, unknown> | undefined) ?? {};
        setForm(hydrateFormFromApi(formData));
        const current = (data.currentSection as OnboardingSectionId | undefined) ?? 'personal';
        const resumeIndex = SECTIONS.findIndex((s) => s.id === current);
        if (resumeIndex >= 0) {
          setStepIndex(resumeIndex);
        }
        setProgress(typeof data.progressPercent === 'number' ? data.progressPercent : 0);
      })
      .catch(() => setLoadError('This onboarding link is invalid or expired.'))
      .finally(() => setLoading(false));
  }, [secureToken]);

  const saveSection = useCallback(
    async (sectionId: OnboardingSectionId, formState: OnboardingFormState) => {
      const result = await saveOnboardingDraft(
        secureToken,
        sectionId,
        sectionToPayload(sectionId, formState),
      );
      if (typeof result.progressPercent === 'number') {
        setProgress(result.progressPercent);
      }
    },
    [secureToken],
  );

  const saveDraft = async () => {
    setError(null);
    try {
      setSaving(true);
      await saveSection(section, form);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const goToStep = async (targetIndex: number) => {
    if (targetIndex === stepIndex || saving) {
      return;
    }
    if (targetIndex < stepIndex) {
      setStepIndex(targetIndex);
      setError(null);
      return;
    }
    setError(null);
    const validationError = validateSection(section, form);
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      setSaving(true);
      await saveSection(section, form);
      setStepIndex(targetIndex);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this step');
    } finally {
      setSaving(false);
    }
  };

  const goNext = async () => {
    if (isLastStep) {
      return;
    }
    await goToStep(stepIndex + 1);
  };

  const goPrevious = () => {
    if (!isFirstStep) {
      setStepIndex(stepIndex - 1);
      setError(null);
    }
  };

  const onSubmit = async () => {
    setError(null);
    for (const { id } of REQUIRED_SECTIONS) {
      const validationError = validateSection(id, form);
      if (validationError) {
        const failedIndex = SECTIONS.findIndex((s) => s.id === id);
        if (failedIndex >= 0) {
          setStepIndex(failedIndex);
        }
        setError(validationError);
        return;
      }
    }

    try {
      setSaving(true);
      for (const { id } of SECTIONS) {
        await saveOnboardingDraft(secureToken, id, sectionToPayload(id, form));
      }
      await submitOnboardingPortal(secureToken);
      setProgress(100);
      setMessage('Thank you — your profile details have been submitted to HR.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading message="Loading onboarding portal..." />;

  if (loadError) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <h2 className="text-xl font-semibold">Portal unavailable</h2>
        <p className="mt-2 text-sm text-muted-foreground">{loadError}</p>
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Employee onboarding</h2>
        <p className="text-sm text-muted-foreground">
          Complete your profile details. This secure link expires in 48 hours.
        </p>
        <p className="text-sm text-muted-foreground">
          Step {stepIndex + 1} of {SECTIONS.length} — complete each step to continue.
        </p>
        <div className="mt-4 h-2 rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{progress}% saved</p>
      </div>

      <ol className="flex flex-wrap gap-2">
        {SECTIONS.map((item, index) => {
          const isActive = index === stepIndex;
          const isComplete = index < stepIndex;
          const canJump = index <= stepIndex;
          return (
            <li key={item.id}>
              <button
                type="button"
                disabled={saving || !canJump}
                onClick={() => void goToStep(index)}
                className={cn(
                  'flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors',
                  isActive && 'border-primary bg-primary text-primary-foreground',
                  !isActive && isComplete && 'border-primary/40 bg-primary/5 text-foreground',
                  !isActive && !isComplete && 'border-muted bg-muted/30 text-muted-foreground',
                  canJump && !saving && 'hover:border-primary/60',
                  (!canJump || saving) && 'cursor-not-allowed opacity-60',
                )}
              >
                <span
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold',
                    isActive && 'bg-primary-foreground text-primary',
                    !isActive && isComplete && 'bg-primary text-primary-foreground',
                    !isActive && !isComplete && 'bg-muted text-muted-foreground',
                  )}
                >
                  {index + 1}
                </span>
                {item.label}
              </button>
            </li>
          );
        })}
      </ol>

      <div className="space-y-4 rounded-lg border bg-card p-4">
        <h3 className="text-lg font-semibold">{SECTIONS[stepIndex].label}</h3>

        {section === 'personal' ? (
          <PersonalSection
            value={form.personal}
            onChange={(personal) => setForm({ ...form, personal })}
          />
        ) : null}
        {section === 'address' ? (
          <AddressSection
            value={form.address}
            onChange={(address) => setForm({ ...form, address })}
          />
        ) : null}
        {section === 'bank' ? (
          <BankSection value={form.bank} onChange={(bank) => setForm({ ...form, bank })} />
        ) : null}
        {section === 'documents' ? (
          <DocumentsSection
            value={form.documents}
            onChange={(documents) => setForm({ ...form, documents })}
          />
        ) : null}
        {section === 'emergency' ? (
          <EmergencySection
            value={form.emergency}
            onChange={(emergency) => setForm({ ...form, emergency })}
          />
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            disabled={isFirstStep || saving}
            onClick={goPrevious}
          >
            Previous
          </Button>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={saving}
              onClick={() => void saveDraft()}
            >
              {saving ? 'Saving…' : 'Save draft'}
            </Button>

            {isLastStep ? (
              <Button type="button" disabled={saving} onClick={() => void onSubmit()}>
                {saving ? 'Submitting…' : 'Submit onboarding'}
              </Button>
            ) : (
              <Button type="button" disabled={saving} onClick={() => void goNext()}>
                {saving ? 'Saving…' : 'Next'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function OnboardingPortalRoutePage() {
  const { secureToken = '' } = useParams();
  return <OnboardingPortalPage secureToken={secureToken} />;
}
