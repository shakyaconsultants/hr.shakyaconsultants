import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  useWorkspaceProfile,
  useUpdateProfile,
  useOrgChart,
} from '@/features/workspace/hooks/use-workspace';
import { WorkspacePageHeader } from '@/features/workspace/components/workspace-nav';
import { EmployeePayrollPanel } from '@/features/payroll/components/employee-payroll-panel';
import { useAuthStore } from '@/shared/stores/app.store';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { EmptyState } from '@/features/workspace/components/widget-primitives';

type Tab =
  | 'overview'
  | 'payroll'
  | 'documents'
  | 'education'
  | 'experience'
  | 'skills'
  | 'certifications'
  | 'assets'
  | 'timeline'
  | 'hierarchy'
  | 'permissions';

const BASE_TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'documents', label: 'Documents' },
  { id: 'education', label: 'Education' },
  { id: 'experience', label: 'Experience' },
  { id: 'skills', label: 'Skills' },
  { id: 'certifications', label: 'Certifications' },
  { id: 'assets', label: 'Assets' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'hierarchy', label: 'Reporting' },
  { id: 'permissions', label: 'Permissions' },
];

export function WorkspaceProfilePage() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const showPayrollTab =
    hasPermission('payslip.read') ||
    hasPermission('payroll.read') ||
    hasPermission('payroll.update');
  const tabs = useMemo(
    () =>
      showPayrollTab ? [{ id: 'payroll' as const, label: 'Payroll' }, ...BASE_TABS] : BASE_TABS,
    [showPayrollTab],
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const [tab, setTab] = useState<Tab>(() => {
    if (requestedTab === 'payroll' && showPayrollTab) {
      return 'payroll';
    }
    return 'overview';
  });
  const { data: profile, isLoading } = useWorkspaceProfile();
  const { data: hierarchy } = useOrgChart();
  const updateProfile = useUpdateProfile();
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (requestedTab === 'payroll' && showPayrollTab) {
      setTab('payroll');
    }
  }, [requestedTab, showPayrollTab]);

  function selectTab(nextTab: Tab) {
    setTab(nextTab);
    if (nextTab === 'payroll') {
      setSearchParams({ tab: 'payroll' }, { replace: true });
      return;
    }
    if (searchParams.has('tab')) {
      setSearchParams({}, { replace: true });
    }
  }

  if (isLoading || !profile) {
    return <Loading message="Loading profile..." />;
  }

  const employee = profile.employee;

  return (
    <div className="space-y-6">
      <WorkspacePageHeader
        title="My Profile"
        description="Professional profile and self-service details."
      />
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => selectTab(t.id)}
            className={`rounded-md px-3 py-1.5 text-sm ${tab === t.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-lg border bg-card p-6">
            <div className="mb-4 flex items-start gap-4">
              {employee.photoUrl ? (
                <img
                  src={String(employee.photoUrl)}
                  alt=""
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-2xl font-bold">
                  {String(employee.firstName)?.[0]}
                  {String(employee.lastName)?.[0]}
                </div>
              )}
              <div>
                <h2 className="text-xl font-semibold">
                  {String(employee.firstName)} {String(employee.lastName)}
                </h2>
                <p className="text-sm text-muted-foreground">{String(employee.email)}</p>
                <p className="text-sm text-muted-foreground">
                  {String(employee.jobTitle ?? employee.designationId ?? '')}
                </p>
              </div>
            </div>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Employee #</dt>
                <dd>{String(employee.employeeNumber)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Department</dt>
                <dd>{String(employee.departmentId)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Joined</dt>
                <dd>
                  {employee.joinedAt
                    ? new Date(String(employee.joinedAt)).toLocaleDateString()
                    : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd>{String(employee.status)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border bg-card p-6">
            <h3 className="mb-4 font-semibold">Update Contact Info</h3>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                updateProfile.mutate({
                  phone: phone || String(employee.phone ?? ''),
                  bio: bio || String(employee.bio ?? ''),
                });
              }}
            >
              <Input
                placeholder="Phone"
                defaultValue={String(employee.phone ?? '')}
                onChange={(e) => setPhone(e.target.value)}
              />
              <textarea
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                rows={4}
                placeholder="Bio"
                defaultValue={String(employee.bio ?? '')}
                onChange={(e) => setBio(e.target.value)}
              />
              <Button type="submit" disabled={updateProfile.isPending}>
                Save Changes
              </Button>
            </form>
          </section>
        </div>
      )}

      {tab === 'payroll' && showPayrollTab ? (
        <EmployeePayrollPanel
          employeeId={String(employee.id)}
          employeeName={`${String(employee.firstName)} ${String(employee.lastName)}`.trim()}
        />
      ) : null}

      {tab === 'documents' && (
        <RecordList
          items={profile.documents}
          render={(d) => (
            <div className="flex items-center gap-3">
              {d.mimeType && String(d.mimeType).startsWith('image/') && d.fileUrl ? (
                <img src={String(d.fileUrl)} alt="" className="h-12 w-12 rounded object-cover" />
              ) : null}
              <div>
                <p className="font-medium">{String(d.fileName)}</p>
                <p className="text-xs text-muted-foreground">
                  {String(d.documentType)} · v{String(d.version)}
                </p>
              </div>
            </div>
          )}
        />
      )}

      {tab === 'education' && (
        <RecordList
          items={profile.education}
          render={(e) => (
            <p>
              {String(e.institution)} — {String(e.degree)}
            </p>
          )}
        />
      )}
      {tab === 'experience' && (
        <RecordList
          items={profile.experience}
          render={(e) => (
            <p>
              {String(e.companyName)} — {String(e.jobTitle)}
            </p>
          )}
        />
      )}
      {tab === 'skills' && (
        <RecordList
          items={profile.skills}
          render={(s) => (
            <p>
              {String(s.skillName ?? s.skillId)} · {String(s.proficiencyLevel ?? '')}
            </p>
          )}
        />
      )}
      {tab === 'certifications' && (
        <RecordList
          items={profile.certifications}
          render={(c) => (
            <p>
              {String(c.name)} · {String(c.issuingOrganization ?? '')}
            </p>
          )}
        />
      )}
      {tab === 'assets' && (
        <RecordList
          items={profile.assets}
          render={(a) => (
            <p>
              {String(a.assetName ?? a.assetType)} · {String(a.serialNumber ?? '')}
            </p>
          )}
        />
      )}
      {tab === 'timeline' && (
        <RecordList
          items={profile.timeline}
          render={(t) => (
            <div>
              <p className="font-medium">{String(t.title)}</p>
              <p className="text-xs text-muted-foreground">
                {t.occurredAt ? new Date(String(t.occurredAt)).toLocaleString() : ''}
              </p>
            </div>
          )}
        />
      )}

      {tab === 'hierarchy' && hierarchy && (
        <div className="grid gap-4 md:grid-cols-3">
          <HierarchyCard title="Managers" people={hierarchy.managers} />
          <HierarchyCard title="Peers" people={hierarchy.peers} />
          <HierarchyCard title="Direct Reports" people={hierarchy.directReports} />
        </div>
      )}

      {tab === 'permissions' && (
        <div className="rounded-lg border bg-card p-6">
          <p className="mb-3 text-sm text-muted-foreground">
            {profile.permissions.length} effective permissions
          </p>
          <div className="flex flex-wrap gap-2">
            {profile.permissions.map((p) => (
              <span key={p} className="rounded bg-muted px-2 py-1 text-xs font-mono">
                {p}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RecordList({
  items,
  render,
}: {
  items: Record<string, unknown>[];
  render: (item: Record<string, unknown>) => React.ReactNode;
}) {
  if (items.length === 0) return <EmptyState title="No records found" />;
  return (
    <ul className="divide-y rounded-lg border bg-card">
      {items.map((item) => (
        <li key={String(item.id)} className="px-4 py-3 text-sm">
          {render(item)}
        </li>
      ))}
    </ul>
  );
}

function HierarchyCard({
  title,
  people,
}: {
  title: string;
  people: { firstName: string; lastName: string }[];
}) {
  return (
    <section className="rounded-lg border bg-card p-4">
      <h3 className="mb-3 font-semibold">{title}</h3>
      {people.length === 0 ? (
        <EmptyState title="None" />
      ) : (
        <ul className="space-y-2 text-sm">
          {people.map((p) => (
            <li key={p.firstName + p.lastName}>
              {p.firstName} {p.lastName}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
