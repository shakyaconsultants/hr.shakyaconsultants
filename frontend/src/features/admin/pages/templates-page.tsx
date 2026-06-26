import { useMemo, useState } from 'react';
import { useSettingsGroup, useCreateSetting, useUpdateSetting } from '@/features/admin/hooks/use-settings';
import { PageHeader } from '@/shared/components/page-header';
import { Button } from '@/shared/components/ui/button';
import { Loading } from '@/shared/components/loading';
import { useAuthStore } from '@/shared/stores/app.store';

const TEMPLATE_TYPES = ['offer_letter', 'joining_letter', 'experience_letter', 'relieving_letter', 'payslip', 'email', 'notification'];

export function TemplatesPage() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const { data: settings, isLoading } = useSettingsGroup('templates');
  const createMutation = useCreateSetting();
  const updateMutation = useUpdateSetting();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const templates = useMemo(
    () => (settings ?? []).filter((s) => s.key.startsWith('template.')),
    [settings],
  );

  if (isLoading) return <Loading message="Loading templates..." />;

  return (
    <div className="space-y-6">
      <PageHeader title="Template Builder" description="Manage document and notification templates with variables and preview." />
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-2">
          {TEMPLATE_TYPES.map((type) => {
            const key = `template.${type}`;
            const exists = templates.find((t) => t.key === key);
            return (
              <Button key={type} variant={selectedKey === key ? 'default' : 'outline'} className="w-full justify-start" onClick={() => { setSelectedKey(key); setDraft(String(exists?.value ?? `Hello {{employeeName}},\n\nYour ${type.replace(/_/g, ' ')} content here.`)); }}>
                {type.replace(/_/g, ' ')}
              </Button>
            );
          })}
        </aside>
        <section className="rounded-lg border bg-card p-4">
          {selectedKey ? (
            <>
              <h2 className="mb-3 font-semibold">{selectedKey}</h2>
              <textarea className="min-h-64 w-full rounded-md border px-3 py-2 font-mono text-sm" value={draft} onChange={(e) => setDraft(e.target.value)} />
              <p className="mt-2 text-xs text-muted-foreground">Variables: {'{{employeeName}}'}, {'{{companyName}}'}, {'{{date}}'}</p>
              {hasPermission('settings.manage') ? (
                <Button className="mt-3" onClick={() => {
                  const existing = templates.find((t) => t.key === selectedKey);
                  if (existing) void updateMutation.mutateAsync({ key: selectedKey, value: draft });
                  else void createMutation.mutateAsync({ key: selectedKey, value: draft, valueType: 'string', group: 'templates' });
                }}>Save Template</Button>
              ) : null}
              <div className="mt-4 rounded border bg-muted/30 p-3 text-sm whitespace-pre-wrap">{draft}</div>
            </>
          ) : (
            <p className="text-muted-foreground">Select a template type to edit.</p>
          )}
        </section>
      </div>
    </div>
  );
}
