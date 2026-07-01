import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchDepartmentDetail } from '@/features/organization/departments/department.api';
import { departmentQueryKeys } from '@/features/organization/departments/department-query-keys';
import { isValidEntityId } from '@/shared/utils/entity-id.util';
import { PageHeader } from '@/shared/components/page-header';
import { StatCard } from '@/shared/components/stat-card';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';
import { ROUTES } from '@/config/app.config';

const TABS = [
  'Overview',
  'Employees',
  'Hierarchy',
  'Projects',
  'Activity Timeline',
  'Audit History',
] as const;

type TabKey = (typeof TABS)[number];

function formatDate(value: unknown): string {
  if (!value) return '—';
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}

export function DepartmentDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabKey>('Overview');

  const { data: department, isLoading, isError } = useQuery({
    queryKey: departmentQueryKeys.detail(id),
    queryFn: () => fetchDepartmentDetail(id),
    enabled: isValidEntityId(id),
  });

  if (isLoading) {
    return <Loading message="Loading department…" />;
  }

  if (isError || !department) {
    return <p className="text-destructive">Department not found.</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Building2 className="h-6 w-6 text-primary" />}
        title={department.name}
        description={department.description ? String(department.description) : 'Department administration overview'}
        breadcrumbs={[
          { label: 'Organization', href: ROUTES.ORGANIZATION },
          { label: 'Departments', href: ROUTES.organizationEntity('department') },
          { label: department.name },
        ]}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to={ROUTES.organizationEntity('department')}>All Departments</Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Employees" value={department.stats.employees} />
        <StatCard label="Managers" value={department.stats.managers} />
        <StatCard label="Projects" value={department.stats.projects} />
      </div>

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
              <dd className="font-mono text-sm">{department.code}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Status</dt>
              <dd className="capitalize">{department.status}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Branch</dt>
              <dd>{department.branchName ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Parent Department</dt>
              <dd>{department.parentDepartmentName ?? 'Root department'}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Department Head</dt>
              <dd>
                {department.headEmployeeName
                  ? `${department.headEmployeeName}${department.headEmployeeNumber ? ` (${department.headEmployeeNumber})` : ''}`
                  : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Email</dt>
              <dd>{department.email ?? '—'}</dd>
            </div>
            {department.internalNotes ? (
              <div className="sm:col-span-2 lg:col-span-3">
                <dt className="text-sm text-muted-foreground">Internal Notes</dt>
                <dd className="whitespace-pre-wrap text-sm">{department.internalNotes}</dd>
              </div>
            ) : null}
          </dl>
        )}

        {activeTab === 'Employees' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4">Employee #</th>
                  <th className="pb-2 pr-4">Name</th>
                  <th className="pb-2 pr-4">Email</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {department.employees.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-muted-foreground">
                      No employees assigned to this department.
                    </td>
                  </tr>
                ) : (
                  department.employees.map((employee) => (
                    <tr key={employee.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-mono text-xs">{employee.employeeNumber}</td>
                      <td className="py-2 pr-4">
                        <Link to={ROUTES.employeeDetail(employee.id)} className="text-primary hover:underline">
                          {employee.firstName} {employee.lastName}
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

        {activeTab === 'Hierarchy' && (
          <div className="space-y-6">
            <section>
              <h3 className="mb-2 text-sm font-semibold">Ancestors</h3>
              {department.hierarchy.ancestors.length === 0 ? (
                <p className="text-sm text-muted-foreground">This is a root department.</p>
              ) : (
                <ol className="space-y-1 text-sm">
                  {department.hierarchy.ancestors.map((ancestor) => (
                    <li key={ancestor.id}>
                      <Link
                        to={ROUTES.organizationEntityDetail('department', ancestor.id)}
                        className="text-primary hover:underline"
                      >
                        {ancestor.name}
                      </Link>
                      <span className="ml-2 font-mono text-xs text-muted-foreground">{ancestor.code}</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
            <section>
              <h3 className="mb-2 text-sm font-semibold">Child Departments</h3>
              {department.hierarchy.children.length === 0 ? (
                <p className="text-sm text-muted-foreground">No child departments.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {department.hierarchy.children.map((child) => (
                    <li key={child.id}>
                      <Link
                        to={ROUTES.organizationEntityDetail('department', child.id)}
                        className="text-primary hover:underline"
                      >
                        {child.name}
                      </Link>
                      <span className="ml-2 font-mono text-xs text-muted-foreground">{child.code}</span>
                      <span className="ml-2 capitalize text-muted-foreground">({child.status})</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}



        {activeTab === 'Projects' && (
          <ul className="space-y-2 text-sm">
            {department.projects.length === 0 ? (
              <li className="text-muted-foreground">No projects assigned to this department.</li>
            ) : (
              department.projects.map((project) => (
                <li key={project.id} className="flex items-center justify-between rounded border px-3 py-2">
                  <Link to={ROUTES.projectDetail(project.id)} className="text-primary hover:underline">
                    {project.name}
                  </Link>
                  <span className="capitalize text-muted-foreground">{project.status}</span>
                </li>
              ))
            )}
          </ul>
        )}

        {activeTab === 'Activity Timeline' && (
          <ol className="space-y-4 border-l-2 pl-4">
            {department.auditHistory.length === 0 ? (
              <li className="text-sm text-muted-foreground">No activity recorded yet.</li>
            ) : (
              department.auditHistory.map((entry) => (
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
                {department.auditHistory.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-4 text-muted-foreground">
                      No audit records found.
                    </td>
                  </tr>
                ) : (
                  department.auditHistory.map((entry) => (
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
