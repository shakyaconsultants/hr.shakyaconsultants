import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { SETTING_GROUPS } from '@/features/admin/api/settings.api';
import { useCreateSetting, useSettings, useUpdateSetting } from '@/features/admin/hooks/use-settings';
import { PageHeader } from '@/shared/components/page-header';
import { DataTable } from '@/shared/components/data-table';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Loading } from '@/shared/components/loading';
import { ROUTES } from '@/config/app.config';
import { useAuthStore } from '@/shared/stores/app.store';

export function SettingsPage() {
  const location = useLocation();
  const backRoute = location.pathname.startsWith('/system') ? ROUTES.ENTERPRISE : ROUTES.ORGANIZATION;
  const backLabel = location.pathname.startsWith('/system') ? 'Enterprise' : 'Organization';
  const [group, setGroup] = useState('');
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const { data, isLoading, isError } = useSettings({ group: group || undefined, pageSize: 100 });
  const updateMutation = useUpdateSetting();
  const createMutation = useCreateSetting();

  const columns = [
    { key: 'key', header: 'Key' },
    { key: 'group', header: 'Group' },
    { key: 'valueType', header: 'Type' },
    {
      key: 'value',
      header: 'Value',
      render: (row: { key: string; value: unknown; isEditable: boolean }) =>
        editKey === row.key ? (
          <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="max-w-xs" />
        ) : (
          typeof row.value === 'object' ? JSON.stringify(row.value) : String(row.value ?? '')
        ),
    },
    {
      key: 'actions',
      header: '',
      render: (row: { key: string; value: unknown; isEditable: boolean }) =>
        row.isEditable && hasPermission('settings.manage') ? (
          editKey === row.key ? (
            <Button size="sm" onClick={() => void updateMutation.mutateAsync({ key: row.key, value: editValue }).then(() => setEditKey(null))}>Save</Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => { setEditKey(row.key); setEditValue(typeof row.value === 'object' ? JSON.stringify(row.value) : String(row.value ?? '')); }}>Edit</Button>
          )
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="System Settings" description="Dynamic configuration for company, modules, security, and integrations." />
      <Link to={backRoute} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />{backLabel}
      </Link>
      <div className="flex flex-wrap gap-3">
        <select className="h-10 rounded-md border px-3 text-sm" value={group} onChange={(e) => setGroup(e.target.value)}>
          <option value="">All groups</option>
          {SETTING_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        {hasPermission('settings.manage') ? (
          <Button variant="outline" size="sm" onClick={() => void createMutation.mutateAsync({ key: `custom.${Date.now()}`, value: '', valueType: 'string', group: group || 'general' })}>
            Add Setting
          </Button>
        ) : null}
      </div>
      {isLoading && <Loading message="Loading settings..." />}
      {isError && <p className="text-destructive">Failed to load settings.</p>}
      {!isLoading && !isError && <DataTable columns={columns} data={data?.items ?? []} />}
    </div>
  );
}
