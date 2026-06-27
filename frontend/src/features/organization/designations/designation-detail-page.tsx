import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Award } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchDesignationDetail } from '@/features/organization/designations/designation.api';
import { getHierarchyLevelLabel } from '@/features/organization/designations/designation.constants';
import { PageHeader } from '@/shared/components/page-header';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';
import { ROUTES } from '@/config/app.config';

const TABS = [
  'Overview',
  'Assigned Employees',
  'Applicable Job Roles',
  'Promotion Path',
  'Activity Timeline',
  'Audit History',
] as const;

type TabKey = (typeof TABS)[number];

function formatDate(value: unknown): string {
  if (!value) return '—';
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}

export function DesignationDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabKey>('Overview');

  const { data: designation, isLoading, isError } = useQuery({
    queryKey: ['organization', 'designation', id, 'detail'],
    queryFn: () => fetchDesignationDetail(id),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return <Loading message="Loading designation…" />;
  }

  if (isError || !designation) {
    return <p className="text-destructive">Designation not found.</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Award className="h-6 w-6 text-primary" />}
        title={designation.name}
        description={designation.description ? String(designation.description) : 'Designation master record'}
        breadcrumbs={[
          { label: 'Organization', href: ROUTES.ORGANIZATION },
          { label: 'Designations', href: ROUTES.organizationEntity('designation') },
          { label: designation.name },
        ]}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to={ROUTES.organizationEntity('designation')}>All Designations</Link>
          </Button>
        }
      />

      <div className="flex flex-wrap gap-1 border-b">
        {TABS.map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab(tab)}
            className="rounded-b-none"
          >
            {tab}
          </Button>
        ))}
      </div>

      <div className="rounded-lg border bg-card p-6">
        {activeTab === 'Overview' && (
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-sm text-muted-foreground">Code</dt>
              <dd className="font-mono text-sm">{designation.code}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Hierarchy Level</dt>
              <dd>{designation.hierarchyLevelLabel ?? getHierarchyLevelLabel(designation.hierarchyLevel)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Department</dt>
              <dd>{designation.departmentName ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Salary Grade</dt>
              <dd>{designation.salaryGradeName ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Status</dt>
              <dd className="capitalize">{designation.status}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Employees Assigned</dt>
              <dd>{designation.employeeCount ?? designation.employees.length}</dd>
            </div>
          </dl>
        )}

        {activeTab === 'Assigned Employees' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4">Employee #</th>
                  <th className="pb-2 pr-4">Full Title</th>
                  <th className="pb-2 pr-4">Email</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {designation.employees.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-muted-foreground">
                      No employees assigned to this designation.
                    </td>
                  </tr>
                ) : (
                  designation.employees.map((employee) => (
                    <tr key={employee.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-mono text-xs">{employee.employeeNumber}</td>
                      <td className="py-2 pr-4">
                        <Link to={ROUTES.employeeDetail(employee.id)} className="text-primary hover:underline">
                          {employee.fullTitle}
                        </Link>
                      </td>
                      <td className="py-2 pr-4">{employee.email}</td>
                      <td className="py-2 capitalize">{employee.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'Applicable Job Roles' && (
          <ul className="space-y-2 text-sm">
            {designation.applicableJobRoles?.length ? (
              designation.applicableJobRoles.map((role) => (
                <li key={role.id} className="flex items-center justify-between rounded border px-3 py-2">
                  <span>{role.fullTitle}</span>
                  <span className="font-mono text-xs text-muted-foreground">{role.code}</span>
                </li>
              ))
            ) : (
              <li className="text-muted-foreground">No applicable job roles linked.</li>
            )}
          </ul>
        )}

        {activeTab === 'Promotion Path' && (
          <div className="space-y-2 text-sm">
            {designation.promotionDesignationId ? (
              <p>
                Promotes to{' '}
                <Link
                  to={ROUTES.organizationEntityDetail('designation', designation.promotionDesignationId)}
                  className="font-medium text-primary hover:underline"
                >
                  {designation.promotionDesignationName ?? designation.promotionDesignationId}
                </Link>
              </p>
            ) : (
              <p className="text-muted-foreground">No promotion path configured.</p>
            )}
          </div>
        )}

        {activeTab === 'Activity Timeline' && (
          <ol className="space-y-4 border-l-2 pl-4">
            {designation.auditHistory.length === 0 ? (
              <li className="text-sm text-muted-foreground">No activity recorded yet.</li>
            ) : (
              designation.auditHistory.map((entry) => (
                <li key={String(entry.id)} className="relative text-sm">
                  <span className="absolute -left-[1.35rem] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                  <p className="font-medium capitalize">{String(entry.action ?? 'update')}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(entry.createdAt)}</p>
                </li>
              ))
            )}
          </ol>
        )}

        {activeTab === 'Audit History' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4">Action</th>
                  <th className="pb-2 pr-4">User</th>
                  <th className="pb-2">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {designation.auditHistory.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-4 text-muted-foreground">
                      No audit records found.
                    </td>
                  </tr>
                ) : (
                  designation.auditHistory.map((entry) => (
                    <tr key={String(entry.id)} className="border-b last:border-0">
                      <td className="py-2 pr-4 capitalize">{String(entry.action ?? '—')}</td>
                      <td className="py-2 pr-4 font-mono text-xs">{String(entry.userId ?? '—')}</td>
                      <td className="py-2">{formatDate(entry.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
