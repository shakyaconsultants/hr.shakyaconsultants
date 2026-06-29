import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  COMPANY_SETUP_STEPS,
  clearWizardDraft,
  loadWizardDraft,
  saveWizardDraft,
  type WizardDraftState,
  wizardStepIndex,
} from '@/features/admin/constants/wizard-steps';
import { getEntityFields } from '@/features/admin/constants/entity-fields';
import { EntityForm, formValueToPayload } from '@/features/admin/components/entity-form';
import { createEntity, getCompany, updateCompany } from '@/features/organization/api/organization.api';
import { invalidateAllMasterDataQueries } from '@/features/organization/hooks/use-master-data';
import { runFormMutation } from '@/shared/feedback/run-form-mutation';
import { getEntityMeta } from '@/features/organization/constants/entity-catalog';
import { PageHeader } from '@/shared/components/page-header';
import { Button } from '@/shared/components/ui/button';
import { ROUTES } from '@/config/app.config';
import { cn } from '@/shared/utils/cn';

const EMPTY_DRAFT: WizardDraftState = {
  currentStepIndex: 0,
  company: {},
  entities: {},
  updatedAt: new Date().toISOString(),
};

export function CompanySetupWizardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [draft, setDraft] = useState<WizardDraftState>(() => loadWizardDraft() ?? EMPTY_DRAFT);
  const [entityForm, setEntityForm] = useState<Record<string, unknown>>({ status: 'active' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const step = COMPANY_SETUP_STEPS[draft.currentStepIndex];

  useEffect(() => {
    saveWizardDraft(draft);
  }, [draft]);

  useEffect(() => {
    const stepId = searchParams.get('step');
    if (!stepId) {
      return;
    }
    const index = wizardStepIndex(stepId);
    if (index >= 0) {
      setDraft((prev) => ({ ...prev, currentStepIndex: index }));
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    void getCompany().then((company) => {
      if (Object.keys(draft.company).length === 0) {
        setDraft((prev) => ({ ...prev, company }));
      }
    });
  }, [draft.company]);

  const entityEntries = useMemo(() => {
    if (!step?.entityKey) {
      return [];
    }
    return draft.entities[step.entityKey] ?? [];
  }, [draft.entities, step?.entityKey]);

  async function saveCompanyStep() {
    if (saving) {
      return;
    }
    setSaving(true);
    setError(null);

    const saved = await runFormMutation({
      setError,
      successMessage: 'Company details saved.',
      mutation: () => updateCompany(draft.company),
      onSuccess: () => {
        invalidateAllMasterDataQueries(queryClient);
        setDraft((prev) => ({ ...prev, currentStepIndex: prev.currentStepIndex + 1 }));
      },
    });

    setSaving(false);
    if (!saved) {
      return;
    }
  }

  async function addEntityRecord() {
    const entityKey = step?.entityKey;
    if (!entityKey || saving) {
      return;
    }
    setSaving(true);
    setError(null);

    const meta = getEntityMeta(entityKey);
    const saved = await runFormMutation({
      setError,
      successMessage: `${meta?.label ?? 'Record'} created successfully.`,
      mutation: async () => {
        const payload = formValueToPayload(entityForm, getEntityFields(entityKey));
        return createEntity(entityKey, payload);
      },
      onSuccess: (created) => {
        invalidateAllMasterDataQueries(queryClient);
        setDraft((prev) => ({
          ...prev,
          entities: {
            ...prev.entities,
            [entityKey]: [...(prev.entities[entityKey] ?? []), created],
          },
        }));
        setEntityForm({ status: 'active' });
      },
    });

    setSaving(false);
    if (!saved) {
      return;
    }
  }

  function nextStep() {
    setDraft((prev) => ({ ...prev, currentStepIndex: Math.min(prev.currentStepIndex + 1, COMPANY_SETUP_STEPS.length - 1) }));
  }

  function prevStep() {
    setDraft((prev) => ({ ...prev, currentStepIndex: Math.max(prev.currentStepIndex - 1, 0) }));
  }

  function finishWizard() {
    clearWizardDraft();
    setCompleted(true);
    navigate(ROUTES.ORGANIZATION);
  }

  if (completed) {
    return null;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Company Setup Wizard"
        description="Configure your organization step-by-step. Progress is saved automatically and can be resumed."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to={ROUTES.ORGANIZATION}>Exit wizard</Link>
          </Button>
        }
      />

      <ol className="grid gap-2 md:grid-cols-3 lg:grid-cols-5">
        {COMPANY_SETUP_STEPS.map((wizardStep, index) => (
          <li
            key={wizardStep.id}
            className={cn(
              'rounded-md border px-3 py-2 text-xs',
              index === draft.currentStepIndex ? 'border-primary bg-primary/5' : 'border-border',
              index < draft.currentStepIndex ? 'text-muted-foreground' : '',
            )}
          >
            <span className="font-semibold">{index + 1}. {wizardStep.title}</span>
          </li>
        ))}
      </ol>

      <section className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">{step?.title}</h2>
        <p className="mb-4 text-sm text-muted-foreground">{step?.description}</p>

        {step?.kind === 'company' ? (
          <EntityForm
            fields={[
              { key: 'name', label: 'Company Name', type: 'text', required: true },
              { key: 'legalName', label: 'Legal Name', type: 'text', required: true },
              { key: 'email', label: 'Email', type: 'text' },
              { key: 'phone', label: 'Phone', type: 'text' },
              { key: 'timezone', label: 'Timezone', type: 'text' },
              { key: 'currency', label: 'Currency', type: 'text' },
              { key: 'address.line1', label: 'Address', type: 'text' },
              { key: 'address.city', label: 'City', type: 'text' },
              { key: 'address.country', label: 'Country', type: 'text' },
            ]}
            value={draft.company}
            onChange={(company) => setDraft((prev) => ({ ...prev, company }))}
          />
        ) : null}

        {step?.kind === 'entity' && step.entityKey ? (
          <div className="space-y-4">
            <EntityForm
              fields={getEntityFields(step.entityKey)}
              value={entityForm}
              onChange={setEntityForm}
            />
            <Button type="button" onClick={() => void addEntityRecord()} disabled={saving}>
              Add to {step.title}
            </Button>
            {entityEntries.length > 0 ? (
              <ul className="space-y-2 text-sm">
                {entityEntries.map((entry) => (
                  <li key={String(entry.id)} className="flex items-center gap-2 rounded border px-3 py-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    {String(entry.name)} ({String(entry.code)})
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No records added yet for this step.</p>
            )}
          </div>
        ) : null}

        {step?.kind === 'review' ? (
          <div className="space-y-4 text-sm">
            <p>Review your setup summary before finishing.</p>
            <div className="rounded border p-4">
              <p className="font-medium">{String(draft.company.name ?? 'Company')}</p>
              <p className="text-muted-foreground">{String(draft.company.email ?? '')}</p>
            </div>
            {Object.entries(draft.entities).map(([key, items]) => (
              <p key={key}>
                {key}: {items?.length ?? 0} record(s)
              </p>
            ))}
          </div>
        ) : null}

        {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

        <div className="mt-6 flex justify-between">
          <Button variant="outline" onClick={prevStep} disabled={draft.currentStepIndex === 0}>
            Back
          </Button>
          <div className="flex gap-2">
            {step?.kind === 'company' ? (
              <Button onClick={() => void saveCompanyStep()} disabled={saving}>
                Save & Continue
              </Button>
            ) : step?.kind === 'review' ? (
              <Button onClick={finishWizard}>Finish Setup</Button>
            ) : (
              <Button onClick={nextStep}>Continue</Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
